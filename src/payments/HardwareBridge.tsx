import {
  StripeTerminalProvider,
  useStripeTerminal,
  type Reader,
} from '@stripe/stripe-terminal-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { toMinorUnits } from '@/lib/money';

import {
  MERCHANT_DISPLAY_NAME,
  USE_SIMULATED_READER,
  fetchConnectionToken,
  fetchLocationId,
} from './config';
import type { ChargeRequest, ChargeResult, TerminalPhase } from './types';

export type BridgeProps = {
  /** Non-null means "run this charge now". Identity change starts a new run. */
  request: ChargeRequest | null;
  onPhase: (phase: TerminalPhase, message: string) => void;
  onResult: (result: ChargeResult) => void;
};

/**
 * Real Stripe Tap to Pay. Loaded lazily so the app boots (and the web bundle
 * builds) without the native Terminal module ever being touched.
 */
export default function HardwareBridge(props: BridgeProps) {
  return (
    <StripeTerminalProvider tokenProvider={fetchConnectionToken} logLevel="error">
      <Runner {...props} />
    </StripeTerminalProvider>
  );
}

function errorText(e: unknown) {
  if (e && typeof e === 'object' && 'message' in e) return String((e as Error).message);
  return String(e);
}

function Runner({ request, onPhase, onResult }: BridgeProps) {
  const {
    initialize,
    discoverReaders,
    connectReader,
    connectedReader,
    createPaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
    cancelCollectPaymentMethod,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: (readers) => {
      discovered.current = readers;
    },
  });

  const discovered = useRef<Reader.Type[]>([]);
  const [ready, setReady] = useState(false);
  /** Guards against the same request being run twice (StrictMode, re-renders). */
  const ranFor = useRef<ChargeRequest | null>(null);

  // Bring the SDK up and attach to the phone's reader once, on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        onPhase('connecting', 'Starting the reader…');
        const init = await initialize();
        if (init.error) throw new Error(init.error.message);

        onPhase('connecting', 'Looking for a reader…');
        const locationId = await fetchLocationId();

        // discoverReaders resolves as soon as discovery *starts*; results land
        // on onUpdateDiscoveredReaders, so poll briefly for the first one.
        const discovery = discoverReaders({
          discoveryMethod: 'tapToPay',
          simulated: USE_SIMULATED_READER,
        });

        const reader = await waitFor(() => discovered.current[0], 15000);
        const discoveryResult = await discovery;
        if (discoveryResult.error && !reader) throw new Error(discoveryResult.error.message);
        if (!reader) throw new Error('No Tap to Pay reader found on this device.');
        if (cancelled) return;

        onPhase('connecting', 'Connecting…');
        const connection = await connectReader({
          discoveryMethod: 'tapToPay',
          reader,
          locationId,
          merchantDisplayName: MERCHANT_DISPLAY_NAME,
          // Lets the SDK show Apple's Tap to Pay terms sheet on first run.
          tosAcceptancePermitted: true,
        });
        if (connection.error) throw new Error(connection.error.message);
        if (cancelled) return;

        setReady(true);
        onPhase('idle', 'Reader ready');
      } catch (e) {
        if (cancelled) return;
        onPhase('error', errorText(e));
      }
    })();

    return () => {
      cancelled = true;
    };
    // Mount-only: the SDK functions are stable for the life of the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run a charge whenever the parent hands us a new request.
  useEffect(() => {
    if (!request || ranFor.current === request) return;
    if (!ready || !connectedReader) return;
    ranFor.current = request;

    let cancelled = false;

    (async () => {
      try {
        onPhase('processing', 'Preparing payment…');
        const intent = await createPaymentIntent({
          amount: toMinorUnits(request.amount, request.currency),
          currency: request.currency.toLowerCase(),
          description: request.description,
          captureMethod: 'automatic',
          metadata: { person: request.personName, demo: 'splitabroad' },
        });
        if (intent.error || !intent.paymentIntent) {
          throw new Error(intent.error?.message ?? 'Could not create the payment.');
        }
        if (cancelled) return;

        onPhase('waiting', 'Hold the card or phone near the top of this device');
        const collected = await collectPaymentMethod({ paymentIntent: intent.paymentIntent });
        if (collected.error || !collected.paymentIntent) {
          throw new Error(collected.error?.message ?? 'Card was not read.');
        }
        if (cancelled) return;

        onPhase('processing', 'Authorising…');
        const confirmed = await confirmPaymentIntent({ paymentIntent: collected.paymentIntent });
        if (confirmed.error || !confirmed.paymentIntent) {
          throw new Error(confirmed.error?.message ?? 'The payment was declined.');
        }
        if (cancelled) return;

        onResult({ status: 'success', paymentIntentId: confirmed.paymentIntent.id ?? null });
      } catch (e) {
        if (cancelled) return;
        onResult({ status: 'error', message: errorText(e) });
      }
    })();

    return () => {
      cancelled = true;
      cancelCollectPaymentMethod().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, ready, connectedReader]);

  return null;
}

/** Polls `get` until it returns a value or the timeout elapses. */
async function waitFor<T>(get: () => T | undefined, timeoutMs: number): Promise<T | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = get();
    if (value) return value;
    await new Promise((r) => setTimeout(r, 250));
  }
  return undefined;
}

/** Android needs the runtime permissions granted before discovery. */
export async function ensureAndroidPermissions() {
  if (Platform.OS !== 'android') return true;
  const { requestNeededAndroidPermissions } = await import(
    '@stripe/stripe-terminal-react-native'
  );
  const result = await requestNeededAndroidPermissions({
    accessFineLocation: {
      title: 'Location permission',
      message: 'Stripe Terminal needs location access to accept contactless payments.',
      buttonPositive: 'Allow',
    },
  });
  return !result.error;
}

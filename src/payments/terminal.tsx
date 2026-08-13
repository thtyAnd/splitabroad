import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { hasBackend } from './config';
import type {
  ChargeRequest,
  ChargeResult,
  TerminalMode,
  TerminalPhase,
  TerminalSnapshot,
} from './types';

const HardwareBridge = lazy(() => import('./HardwareBridge'));

/**
 * Expo Go ships without the Stripe Terminal native module, so hardware mode
 * would crash there. A dev-client / EAS build reports `standalone` or `bare`.
 */
const nativeSdkPossible =
  Platform.OS !== 'web' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/**
 * The software fallback brings the reader up and then *waits* — it does not
 * complete on a timer. A payment that fires while the presenter is still
 * talking looks like a screensaver; one that fires when a card arrives looks
 * like a terminal. `complete()` is what a card arriving maps to here.
 */
const SIM_STEPS: { phase: TerminalPhase; message: string; ms: number }[] = [
  { phase: 'connecting', message: 'Waking the reader…', ms: 500 },
  { phase: 'waiting', message: 'Hold card or phone near the top of this device', ms: 0 },
];

/** How long the "Authorising…" beat runs once a card is presented. */
const AUTHORISING_MS = 1300;

type TerminalContextValue = TerminalSnapshot & {
  /** Runs a charge and resolves once it settles. */
  charge: (request: ChargeRequest) => Promise<ChargeResult>;
  /** Simulated mode only: stand in for a card being presented to the reader. */
  complete: () => void;
  cancel: () => void;
  reset: () => void;
  setMode: (mode: TerminalMode) => void;
  toggleMode: () => TerminalMode;
  /** Why hardware mode is unavailable, or null when it should work. */
  hardwareBlockedReason: string | null;
};

const TerminalContext = createContext<TerminalContextValue | null>(null);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TerminalMode>('simulated');
  const [phase, setPhase] = useState<TerminalPhase>('idle');
  const [message, setMessage] = useState('');
  const [request, setRequest] = useState<ChargeRequest | null>(null);

  const settle = useRef<((result: ChargeResult) => void) | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finish = useCallback(
    (result: ChargeResult) => {
      clearTimers();
      setPhase(
        result.status === 'success' ? 'success' : result.status === 'cancelled' ? 'cancelled' : 'error'
      );
      setMessage(result.status === 'error' ? result.message : '');
      setRequest(null);
      settle.current?.(result);
      settle.current = null;
    },
    [clearTimers]
  );

  const runSimulated = useCallback(() => {
    clearTimers();
    let elapsed = 0;
    for (const step of SIM_STEPS) {
      const at = elapsed;
      timers.current.push(
        setTimeout(() => {
          setPhase(step.phase);
          setMessage(step.message);
        }, at)
      );
      elapsed += step.ms;
    }
    // No success timer: the flow parks on `waiting` until complete() is called.
  }, [clearTimers]);

  /**
   * "A card was presented." In simulated mode this is what the presenter's tap
   * on the reader target — or the payer's second phone — maps to.
   */
  const complete = useCallback(() => {
    if (!settle.current || phase === 'processing') return;
    clearTimers();
    setPhase('processing');
    setMessage('Authorising…');
    timers.current.push(
      setTimeout(() => finish({ status: 'success', paymentIntentId: null }), AUTHORISING_MS)
    );
  }, [clearTimers, finish, phase]);

  const charge = useCallback(
    (next: ChargeRequest) =>
      new Promise<ChargeResult>((resolve) => {
        settle.current = resolve;
        setRequest(next);
        setPhase('connecting');
        setMessage('Waking the reader…');
        if (mode === 'simulated' || !nativeSdkPossible) runSimulated();
        // Hardware mode: the lazy bridge picks the request up and reports back.
      }),
    [mode, runSimulated]
  );

  const cancel = useCallback(() => finish({ status: 'cancelled' }), [finish]);

  const reset = useCallback(() => {
    clearTimers();
    setPhase('idle');
    setMessage('');
    setRequest(null);
    settle.current = null;
  }, [clearTimers]);

  /** Returns the mode being switched to, so the caller can announce it. */
  const toggleMode = useCallback(() => {
    const next: TerminalMode = mode === 'simulated' ? 'hardware' : 'simulated';
    setMode(next);
    return next;
  }, [mode]);

  const hardwareBlockedReason = useMemo(() => {
    if (Platform.OS === 'web') return 'Tap to Pay needs the iOS or Android app.';
    if (!nativeSdkPossible) return 'Expo Go has no Terminal module — use a dev client build.';
    if (!hasBackend()) return 'No Stripe backend configured (EXPO_PUBLIC_TERMINAL_BACKEND_URL).';
    return null;
  }, []);

  const onPhase = useCallback(
    (next: TerminalPhase, text: string) => {
      // The bridge reports connection failures as a phase, not a result — settle
      // any charge waiting on it so the UI can offer a retry instead of hanging.
      if (next === 'error') {
        finish({ status: 'error', message: text });
        return;
      }
      setPhase(next);
      setMessage(text);
    },
    [finish]
  );

  const value = useMemo<TerminalContextValue>(
    () => ({
      mode,
      phase,
      message,
      request,
      hardwareAvailable: nativeSdkPossible,
      charge,
      complete,
      cancel,
      reset,
      setMode,
      toggleMode,
      hardwareBlockedReason,
    }),
    [
      mode,
      phase,
      message,
      request,
      charge,
      complete,
      cancel,
      reset,
      toggleMode,
      hardwareBlockedReason,
    ]
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
      {mode === 'hardware' && nativeSdkPossible ? (
        <Suspense fallback={null}>
          <HardwareBridge request={request} onPhase={onPhase} onResult={finish} />
        </Suspense>
      ) : null}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error('useTerminal must be used inside <TerminalProvider>');
  return ctx;
}

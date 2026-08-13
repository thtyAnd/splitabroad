import type { ChargeRequest, ChargeResult, TerminalPhase } from './types';

export type BridgeProps = {
  request: ChargeRequest | null;
  onPhase: (phase: TerminalPhase, message: string) => void;
  onResult: (result: ChargeResult) => void;
};

/**
 * Stripe Terminal is native-only. On web the terminal provider never mounts
 * this, but Metro still resolves the module for the web bundle — so it has to
 * exist, and it has to not pull in the native SDK.
 */
export default function HardwareBridge(_props: BridgeProps) {
  return null;
}

export async function ensureAndroidPermissions() {
  return true;
}

import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";

// 6-digit TOTP, 30s period, SHA-1 — the defaults every authenticator app
// (Google Authenticator, Authy, 1Password, etc.) supports out of the box.
const DIGITS = 6;
const PERIOD = 30;
const ALGORITHM = "SHA1";
const ISSUER = "SWG Boutique";

export function generateSecret(): string {
  return new Secret({ size: 20 }).base32;
}

function build(secret: string, label: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: Secret.fromBase32(secret),
  });
}

export function otpauthUrl(secret: string, email: string): string {
  return build(secret, email).toString();
}

export async function otpauthQrDataUrl(secret: string, email: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl(secret, email), { margin: 1, width: 240 });
}

/**
 * Verifies a 6-digit code against the stored secret. Accepts one period of
 * drift either side (±30s) to tolerate mildly out-of-sync clocks.
 */
export function verifyCode(secret: string, code: string): boolean {
  const trimmed = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(trimmed)) return false;
  const totp = build(secret, "");
  const delta = totp.validate({ token: trimmed, window: 1 });
  return delta !== null;
}

// Swap these for real HTTP calls (fetch/axios) when the backend is ready.
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Mock tokens that simulate an expired / already-used reset link. */
const INVALID_TOKENS = new Set(["invalid", "expired"])

export class InvalidResetTokenError extends Error {
  constructor() {
    super("Invalid or expired reset token")
    this.name = "InvalidResetTokenError"
  }
}

export const authApi = {
  /** Always resolves (never reveals whether the account exists). */
  async requestPasswordReset(email: string): Promise<void> {
    await delay(800)
    void email
  },
  async resetPassword(token: string, password: string): Promise<void> {
    await delay(800)
    void password
    if (INVALID_TOKENS.has(token)) throw new InvalidResetTokenError()
  },
}

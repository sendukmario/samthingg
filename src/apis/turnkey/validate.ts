/**
 * Validate that all required Turnkey environment variables are set
 */
export function validateTurnkeyConfig(): void {
  const required = [
    "TURNKEY_API_PRIVATE_KEY",
    "TURNKEY_API_PUBLIC_KEY",
    "TURNKEY_ORGANIZATION_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Turnkey environment variables: ${missing.join(", ")}`,
    );
  }
}

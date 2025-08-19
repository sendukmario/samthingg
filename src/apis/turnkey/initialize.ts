import { Connection } from "@solana/web3.js";
import { Turnkey } from "@turnkey/sdk-server";

let connection: Connection | null = null;
let turnkeyClient: Turnkey | null = null;

/**
 * Initialize the server-side Turnkey client
 */
export function getTurnkeyClient(): Turnkey {
  const apiPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
  const apiPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
  const organizationId = process.env.TURNKEY_ORGANIZATION_ID;

  if (!apiPrivateKey || !apiPublicKey || !organizationId) {
    throw new Error(
      "Missing Turnkey API credentials. Please set the TURNKEY_API_PRIVATE_KEY, TURNKEY_API_PUBLIC_KEY, and TURNKEY_ORGANIZATION_ID environment variables.",
    );
  }

  if (!turnkeyClient) {
    turnkeyClient = new Turnkey({
      apiBaseUrl: process.env.TURNKEY_API_BASE_URL || "https://api.turnkey.com",
      apiPrivateKey: apiPrivateKey,
      apiPublicKey: apiPublicKey,
      defaultOrganizationId: organizationId,
    });
  }
  return turnkeyClient;
}

export function getSolanaConnection(): Connection {
  if (!connection) {
    connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      {
        commitment: "confirmed",
        wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_WS_URL,
      }
    );
  }
  return connection;
}

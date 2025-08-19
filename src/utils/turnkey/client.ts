// lib/turnkey-client.js
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";

export function initializeTurnkeyClient({
  apiPrivateKey,
  apiPublicKey,
}: {
  apiPublicKey?: string;
  apiPrivateKey?: string;
}) {
  if (!apiPublicKey || !apiPrivateKey) {
    throw new Error("Session and API keys must be provided.");
  }

  try {
    const stamper = new ApiKeyStamper({
      apiPublicKey: apiPublicKey,
      apiPrivateKey: apiPrivateKey,
    });

    const client = new TurnkeyClient(
      { baseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL! },
      {
        stamp: async (w) => {
          try {
            console.log("Stamping wallet with API keys:", w);
            return await stamper.stamp(w)
          } catch (error) {
            console.error("Error stamping wallet:", error);
            throw error;
          }
        },
      }
    );

    return client;
  } catch (error) {
    console.error("Error initializing Turnkey client:", error);
  }
}

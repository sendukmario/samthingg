import { TStamper } from "@turnkey/sdk-browser";

export const createTurnkeyClient = async (stamper: TStamper) => {
  const { TurnkeyClient } = await import("@turnkey/http");

  return new TurnkeyClient(
    {
      baseUrl:
        process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL ||
        "https://api.turnkey.com",
    },
    stamper,
  );
};

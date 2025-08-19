"use client";
import { useEffect, useRef } from "react";
import { webSocketManager, GetWebSocketManager, SIGNATURE_CONFIRMER_INSTANCE } from "@/lib/websocket-manager";
import { getWSBaseURLBasedOnRegion } from "@/utils/getWSBaseURLBasedOnRegion";
import cookies from "js-cookie";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const currentTokenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const connectWebSocket = () => {
      const token = cookies.get("_nova_session");
      currentTokenRef.current = token;
      
      webSocketManager.connect({
        url: String(getWSBaseURLBasedOnRegion()),
        token: token
      });
      // Open websocket for the signature confirmer
      GetWebSocketManager(SIGNATURE_CONFIRMER_INSTANCE).connect({
        url: process.env.NEXT_PUBLIC_WS_MAIN_BASE_URL + "/subscribe",
        token: token
      });
    };

    // Initial connection
    connectWebSocket();

    // Listen for authentication changes (storage events)
    const handleAuthChange = () => {
      const newToken = cookies.get("_nova_session");
      
      // Only reconnect if token actually changed
      if (newToken !== currentTokenRef.current) {
        // console.log("Auth token changed, reconnecting WebSocket...");
        webSocketManager.disconnect();
        GetWebSocketManager(SIGNATURE_CONFIRMER_INSTANCE).disconnect();
        setTimeout(connectWebSocket, 100); // Small delay to ensure clean disconnection
      }
    };

    // Listen for cookie changes via storage events (when logged in/out from another tab)
    window.addEventListener("storage", handleAuthChange);

    // Listen for custom auth events (when logged in/out from current tab)
    window.addEventListener("nova-auth-changed", handleAuthChange);

    // Periodic check for token changes (backup mechanism)
    const tokenCheckInterval = setInterval(handleAuthChange, 5000);

    return () => {
      webSocketManager.disconnect();
      GetWebSocketManager(SIGNATURE_CONFIRMER_INSTANCE).disconnect();
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("nova-auth-changed", handleAuthChange);
      clearInterval(tokenCheckInterval);
    };
  }, []);

  return children;
}

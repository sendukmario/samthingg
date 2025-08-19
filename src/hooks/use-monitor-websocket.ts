import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useNetworkHealth } from "./use-network-health";
import cookies from "js-cookie";
import { useTwitterMonitorMessageStore } from "@/stores/footer/use-twitter-monitor-message.store";
import { useTSMonitorMessageStore } from "@/stores/footer/use-ts-monitor-message.store";
import { useDiscordMonitorMessageStore } from "@/stores/footer/use-discord-monitor-message.store";
import {
  getTwitterAPIKey,
  getTwitterMonitorAccounts,
} from "@/apis/rest/twitter-monitor";
import { getTSMonitorAccounts } from "@/apis/rest/ts-monitor";
import { getDiscordMonitorChannel } from "@/apis/rest/discord-monitor";
import { useMemo } from "react";
import { getServerTime } from "@/apis/rest/settings/server-time";

async function isServerHealthy(): Promise<boolean> {
  try {
    const response = await getServerTime();
    return !!response;
  } catch {
    return false;
  }
}

type MonitorWebSocketProps<T> = {
  url: string;
  name: // "twitter" |
  "truth-social" | "discord";
  onOpen?: (event: Event) => void;
  onMessage?: (data: T) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onInit?: () => void;
  enableHeartbeat?: boolean;
};

export function useMonitorWebSocket<T = any>({
  url,
  name,
  onOpen,
  onMessage,
  onError,
  onClose,
  onInit,
  enableHeartbeat = true,
}: MonitorWebSocketProps<T>) {
  const isNetworkHealthy = useNetworkHealth();
  const isNetworkHealthyRef = useRef(isNetworkHealthy);
  const wsRef = useRef<WebSocket | null>(null);
  const lastMessageTimestamp = useRef<number>(Date.now());
  const heartBeatTimeout = 30_000 * 1; // 30 seconds
  const staleConnectionTimeout = 60_000; // 1 minute
  const heartBeatInterval = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectDelay = 1000;
  const isConnectingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const messageQueue = useRef<Map<string, any>>(new Map());

  function log(msg: string, extra?: any) {
    // console.debug(`WEBSOCKET SERVICE [${name}] - ${msg}`, extra ?? "");
  }

  // State Configuration ✨
  // ## Twitter
  const twitterAccounts = useTwitterMonitorMessageStore(
    (state) => state.accounts,
  );
  const setTwitterAccounts = useTwitterMonitorMessageStore(
    (state) => state.setAccounts,
  );
  const setTwitterLoading = useTwitterMonitorMessageStore(
    (state) => state.setIsLoading,
  );

  // ## Truth Social
  const tsAccounts = useTSMonitorMessageStore((state) => state.accounts);
  const setTSAccounts = useTSMonitorMessageStore((state) => state.setAccounts);
  const setTSLoading = useTSMonitorMessageStore((state) => state.setIsLoading);

  // ## Discord
  const discordAccounts = useDiscordMonitorMessageStore(
    (state) => state.accounts,
  );
  const setDiscordAccounts = useDiscordMonitorMessageStore(
    (state) => state.setAccounts,
  );
  const setDiscordLoading = useDiscordMonitorMessageStore(
    (state) => state.setIsLoading,
  );

  const monitorState: Record<
    typeof name,
    {
      accounts: any[];
      setAccounts: (data: any[]) => void;
      setIsLoading: (loading: boolean) => void;
      getAccounts: () => Promise<any[]>;
      subscriptionMessage: any;
    }
  > = useMemo(
    () => ({
      twitter: {
        accounts: twitterAccounts,
        setAccounts: setTwitterAccounts,
        setIsLoading: setTwitterLoading,
        getAccounts: getTwitterMonitorAccounts,
        subscriptionMessage: {
          action: "subscribe",
          licenseKey: cookies.get("_twitter_api_key"),
          usernames: (twitterAccounts || [])?.map((acc) => acc?.username),
        },
      },
      "truth-social": {
        accounts: tsAccounts,
        setAccounts: setTSAccounts,
        setIsLoading: setTSLoading,
        getAccounts: getTSMonitorAccounts,
        subscriptionMessage: {
          action: "subscribe",
          licenseKey: cookies.get("_truthsocial_api_key"),
          usernames: (tsAccounts || [])?.map((acc) =>
            acc?.username?.replace("@", ""),
          ),
        },
      },
      discord: {
        accounts: discordAccounts,
        setAccounts: setDiscordAccounts,
        setIsLoading: setDiscordLoading,
        getAccounts: getDiscordMonitorChannel,
        subscriptionMessage: {
          action: "subscribe",
          licenseKey: cookies.get("_discord_api_key"),
          groups: (discordAccounts || [])?.filter(Boolean),
        },
      },
    }),
    [twitterAccounts, tsAccounts, discordAccounts],
  );

  const isValid = !!monitorState[name];

  const {
    setAccounts,
    setIsLoading,
    accounts,
    getAccounts,
    subscriptionMessage,
  } = isValid
    ? monitorState[name]
    : {
        setAccounts: () => {},
        setIsLoading: () => {},
        accounts: [],
        getAccounts: async () => [],
      };

  const { data, isLoading } = useQuery({
    queryKey: [`get-${name}-accounts`],
    queryFn: async () => {
      return await getAccounts();
    },
    enabled: isValid,
  });

  useQuery({
    queryKey: ["get-api-key"],
    queryFn: async () => {
      const { success, message } = await getTwitterAPIKey();
      if (!success) return message || "No API key found";
      cookies.set("_twitter_api_key", message);
      cookies.set("_truthsocial_api_key", message);
      cookies.set("_discord_api_key", message);
      return message || "No API key found";
    },
    retry: 2,
    enabled:
      !cookies.get("_twitter_api_key") ||
      !cookies.get("_truthsocial_api_key") ||
      !cookies.get("_discord_api_key"),
  });

  const previousAccounts = useRef<(typeof accounts)[]>([]);

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    if (data) {
      setAccounts(data);
    }
  }, [data, setAccounts]);

  const startHeartbeat = () => {
    clearHeartbeat();
    log("🔄 Starting heartbeat");

    heartBeatInterval.current = setInterval(() => {
      const now = Date.now();
      const diff = now - lastMessageTimestamp.current;

      if (!wsRef.current) return;

      if (diff > staleConnectionTimeout / 2) {
        console.warn(
          `WEBSOCKET SERVICE [${name}] - 💓 Heartbeat detected slow connection`,
        );
      }

      if (!isNetworkHealthyRef.current) {
        return;
      }

      const shouldReconnect = diff > staleConnectionTimeout;

      log("🔄 Heartbeat", {
        diff,
        shouldReconnect,
      });

      // SENDING PING TO SERVER
      // if (wsRef.current?.readyState === WebSocket.OPEN) {
      //   wsRef.current.send(
      //     JSON.stringify({
      //       channel: name,
      //       licenseKey,
      //       message: "ping",
      //     })
      //   )
      // }

      if (shouldReconnect) {
        shouldReconnectRef.current = true;
        wsRef.current?.close();
      }
    }, heartBeatTimeout);
  };

  const clearHeartbeat = () => {
    if (heartBeatInterval.current) {
      clearInterval(heartBeatInterval.current);
      heartBeatInterval.current = null;
    }
  };

  // update network status
  useEffect(() => {
    isNetworkHealthyRef.current = isNetworkHealthy;
  }, [isNetworkHealthy]);

  const cleanUp = () => {
    log("🔄 Cleaning up WebSocket");
    reconnectAttempts.current = 0;

    shouldReconnectRef.current = false;
    if (heartBeatInterval.current) {
      clearInterval(heartBeatInterval.current);
      heartBeatInterval.current = null;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (isConnectingRef.current || isConnectedRef.current) return;
    log("🔄 Connecting to WebSocket");
    isConnectingRef.current = true;

    onInit?.();

    // if ws is already connected, close it
    if (wsRef.current) {
      log("🔄 Reconnecting to WebSocket");
      const status = wsRef.current.readyState;
      if (status === WebSocket.OPEN || status === WebSocket.CONNECTING) {
        log("🔄 Reconnecting to WebSocket - already connected");
        return;
      }

      log("🔄 Reconnecting to WebSocket - closing");
      isConnectingRef.current = false;
      isConnectedRef.current = false;
      shouldReconnectRef.current = true;
      wsRef.current.close();
    }

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = (event) => {
      log("🔄 Connected to WebSocket");
      onOpen?.(event);
      isConnectedRef.current = true;
      isConnectingRef.current = false;
      if (enableHeartbeat) {
        startHeartbeat();
      }
      flushMessageQueue();
    };

    wsRef.current.onmessage = (event) => {
      if (
        event.data.includes("success") ||
        event.data.includes("Ping") ||
        event.data.includes("ping") ||
        event.data.includes("UpdateType") ||
        event.data.includes("error")
      ) {
        setIsLoading(false);
        lastMessageTimestamp.current = Date.now();
        return;
      }

      const data = JSON.parse(event.data);
      lastMessageTimestamp.current = Date.now();

      if (data.event === "server_shutdown" && data.code === 1012) {
        console.warn(
          "⚠️ Server shutdown detected, closing socket to trigger reconnect.",
        );
        shouldReconnectRef.current = true;
        wsRef.current?.close();
        return;
      }

      onMessage?.(data);
    };

    wsRef.current.onerror = (event) => {
      log("🔄 Error in WebSocket");
      onError?.(event);
      isConnectingRef.current = false;
      isConnectedRef.current = false;
    };

    wsRef.current.onclose = (event) => {
      log("🔄 Closing WebSocket...", {
        shouldReconnect: shouldReconnectRef.current,
        accounts,
      });
      onClose?.(event);
      isConnectingRef.current = false;
      isConnectedRef.current = false;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }

      if (shouldReconnectRef.current) {
        const tryReconnect = async () => {
          log(
            "🔄 Trying to reconnect to WebSocket...",
            reconnectAttempts.current,
          );
          reconnectAttempts.current++;
          const delay = reconnectDelay * reconnectAttempts.current;

          const healthy = await isServerHealthy();
          console.warn(
            "💓 HEALTHY ✅",
            healthy,
            reconnectAttempts.current,
            delay,
          );

          if (healthy) {
            connect();
          } else {
            reconnectTimeout.current = setTimeout(tryReconnect, delay);
          }
        };

        tryReconnect();
      }
      log("🔄 Closed WebSocket");
    };
  }, [
    accounts,
    url,
    subscriptionMessage,
    onInit,
    onOpen,
    onMessage,
    onError,
    onClose,
    startHeartbeat,
    isServerHealthy,
    reconnectDelay,
  ]);

  // Websocket
  useEffect(() => {
    if (accounts && accounts.length) {
      connect();
    }
    return cleanUp;
  }, []);

  // Manage subscriptions
  useEffect(() => {
    const prev = previousAccounts.current;
    const curr = accounts || [];

    const serialize = (a: any) => JSON.stringify(a);
    const removedAccounts = prev?.filter(
      (p) => !curr.some((c) => serialize(c) === serialize(p)),
    );
    const addedAccounts = curr?.filter(
      (c) => !prev.some((p) => serialize(p) === serialize(c)),
    );

    log("🔄 Changed accounts 👇🏻", {
      prev,
      curr,
      accounts,
      removedAccounts,
      addedAccounts,
    });

    if (removedAccounts.length > 0) {
      const unsubscribeMsg = {
        ...subscriptionMessage,
        action: "unsubscribe",
      };

      if ("usernames" in subscriptionMessage) {
        unsubscribeMsg.usernames = removedAccounts?.map(
          (a: any) => a?.username?.replace?.("@", "") ?? a.username ?? a,
        );
      }

      if ("groups" in subscriptionMessage) {
        unsubscribeMsg.groups = removedAccounts;
      }

      sendMessage(unsubscribeMsg);
    }

    if (addedAccounts.length > 0) {
      const subscribeMsg = {
        ...subscriptionMessage,
        action: "subscribe",
      };

      if ("usernames" in subscriptionMessage) {
        subscribeMsg.usernames = addedAccounts?.map(
          (a: any) => a?.username?.replace?.("@", "") ?? a?.username ?? a,
        );
      }

      if ("groups" in subscriptionMessage) {
        subscribeMsg.groups = addedAccounts;
      }

      sendMessage(subscribeMsg);
    }

    previousAccounts.current = curr;
  }, [accounts, subscriptionMessage]);

  // close websocket if no accounts remaining
  useEffect(() => {
    log("🔄 Checking if no accounts remaining 👇🏻", {
      accounts,
      wsStatus: wsRef.current?.readyState,
      subscriptionMessage,
    });

    if (!accounts || accounts.length === 0) {
      previousAccounts.current = [];
      shouldReconnectRef.current = false;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        log("🔄 No accounts remaining - closing WebSocket");
        shouldReconnectRef.current = false;
        wsRef.current.close();
      }
    }

    // if ws is closed, send subscription message
    if (
      accounts &&
      accounts.length > 0 &&
      wsRef.current?.readyState === WebSocket.CLOSED
    ) {
      sendMessage(subscriptionMessage);
    }
  }, [accounts, wsRef.current?.readyState]);

  // send message
  const sendMessage = (message: any) => {
    if (
      isConnectedRef.current &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      log("📤 Sending message", message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      messageQueue.current.set(JSON.stringify(message), message);
      log("📤 Sending queued message", message);
      connect();
    }
  };

  function flushMessageQueue(): void {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      for (const [_, msg] of messageQueue.current) {
        wsRef.current.send(JSON.stringify(msg));
      }
      messageQueue.current.clear();
    }
  }

  return {
    sendMessage,
    reconnect: connect,
    disconnect: () => {
      cleanUp();
    },
  };
}

import { useBlockhashStore } from "@/stores/use-blockhash.store";
import { useWebSocket } from "./useWebsocketNew";

const useBlockhash = () => {
  const { setBlockhash } = useBlockhashStore();
  useWebSocket({
    channel: "blockhash",
    initialMessage: {
      channel: "blockhash",
      action: "join",
    },
    onMessage: (event) => {
      if (event?.channel === "ping" && event.success === true) {
        return;
      }
      const message: { channel: "blockhash"; data: any } = event;
      if (message.channel === "blockhash" && message.data) {
        setBlockhash(message.data);
      }
    },
  });
}

export default useBlockhash;
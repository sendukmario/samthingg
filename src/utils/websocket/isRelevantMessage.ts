import {
  PingMessageType,
  SuccessMessageType,
  WSMessage,
} from "@/types/ws-general";

/**
 * Determines if a WebSocket message is relevant based on its type and channel.
 *
 * This function filters out:
 * - Ping messages (`channel === "ping"` and `success === true`)
 * - Success messages for the given channels (`success === true` and `channel` is included in `channel[]`)
 * - Messages not targeted at any of the provided channels
 *
 * @param {WSMessage<any>} event - The WebSocket message to evaluate.
 * @param {...string[]} channel - One or more channel names to check against.
 * @returns {boolean} `true` if the message is relevant and should be processed; `false` otherwise.
 */
export function isRelevantMessage(
  event: WSMessage<any>,
  ...channel: Array<string>
): boolean {
  // IGNORE PING MESSAGES
  const pingMessage = event as PingMessageType;
  if (pingMessage.channel === "ping" && pingMessage.success) return false;

  // IGNORE SUCCESS MESSAGES FOR THE CHANNEL
  const successMessage = event as SuccessMessageType;
  if (successMessage.success && channel.includes(successMessage.channel))
    return false;

  // IGNORE MESSAGES NOT MEANT FOR THE CHANNEL
  if (!channel.includes(event.channel)) return false;

  return true;
}

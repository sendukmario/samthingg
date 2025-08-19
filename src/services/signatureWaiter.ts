import { getSolanaConnection } from "@/apis/turnkey/initialize";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { GetWebSocketManager, SIGNATURE_CONFIRMER_INSTANCE } from "@/lib/websocket-manager";

// Wait and send toast notification for transaction
export async function ConfirmTransaction(signatures: string[], allToast: {showToast: (options: any) => string, error: (message: string, options?: any) => string, dismiss: (toastId?: string | undefined) => void, success: (message: string, options?: any) => string}, soundRef: HTMLAudioElement | null): Promise<void> {
    allToast.showToast({ state: "LOADING", message: "Transaction submitted! Waiting for confirmation..." });

    // Remove duplicates from signatures
    signatures = [...new Set(signatures)];

    const subscribeMsg = {
        "action": "join",
        "channels": signatures
    };
    // waiting -> true: we are still waiting for sig confirmation | false: we got a response already
    let waiting = true;
    let timedOut = 0;
    const websocketManager = GetWebSocketManager(SIGNATURE_CONFIRMER_INSTANCE);

    // Send the initial subscribe msg
    function SendInitial() {
        websocketManager.send(subscribeMsg);
    }

    // Connect and listen for the signature confirmation
    //SendInitial();

    websocketManager.onOpen(() => {
        // Connection has been reopened -> send subscribe msg again
        if (waiting) SendInitial();
    });

    websocketManager.onMessage((data: any) => {
        // Check if it's for this transaction
        if (!signatures.includes(data.channel)) {
            // not for us
            return
        }
        if (!waiting) return; // We already sent a toast

        switch (data.message) {
            case "Transaction timeout":
                timedOut++

                // Only show timeout toast if all signatures timed out
                if (timedOut >= signatures.length) {
                    allToast.error("Transaction timed out!");
                    waiting = false;
                }
                break;
            case "Transaction confirmed":
                // TODO: add better error handling for tx

                allToast.dismiss();
                allToast.success("Transaction confirmed!");
                waiting = false;

                soundRef?.play();
                break;
            default:
                console.error("unknown response from websocket: ", data);
                break;
        }
    });

    // Listen with solana websocket too
    const connection = getSolanaConnection();

    for (const sig of signatures) {
        const subId = connection.onSignature(sig, 
            (result, context) => {
                if (!waiting) return; // We already sent a toast
                waiting = false;

                if (result.err) {
                    allToast.error("Transaction failed");
                } else {
                    allToast.dismiss();
                    allToast.success("Transaction confirmed!");

                    soundRef?.play();
                }

                // Once we get an answer, we can unsubscribe
                connection.removeSignatureListener(subId).catch(console.error);
            },
            "confirmed"
        );
    }
}
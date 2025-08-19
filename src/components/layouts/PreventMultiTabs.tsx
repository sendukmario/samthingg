"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import BaseButton from "../customs/buttons/BaseButton";

const MAX_TABS = 25;
const STORAGE_KEY = "nova-dex-tab-count";
const CHANNEL_NAME = "nova-dex-tab-counter";

export default function PreventMultiTabs({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showModal, setShowModal] = useState(false);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const tabId = useRef<string>(Math.random().toString(36).substring(7));
  const isClosing = useRef<boolean>(false);
  const isRegistered = useRef<boolean>(false);

  useEffect(() => {
    // Check if BroadcastChannel is supported
    if (typeof window === "undefined" || !window.BroadcastChannel) {
      return;
    }

    broadcastChannel.current = new BroadcastChannel(CHANNEL_NAME);

    // Simple tab count management
    const getTabCount = (): number => {
      try {
        return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      } catch {
        return 0;
      }
    };

    const setTabCount = (count: number) => {
      try {
        localStorage.setItem(STORAGE_KEY, count.toString());
      } catch {
        // Ignore errors
      }
    };

    const incrementTabCount = (): number => {
      const currentCount = getTabCount();
      const newCount = currentCount + 1;
      setTabCount(newCount);
      return newCount;
    };

    const decrementTabCount = () => {
      const currentCount = getTabCount();
      const newCount = Math.max(0, currentCount - 1);
      setTabCount(newCount);
    };

    // Check if this tab can open
    const checkTabLimit = (): boolean => {
      const currentCount = getTabCount();

      if (currentCount >= MAX_TABS) {
        // Too many tabs already open
        isClosing.current = true;
        setTimeout(() => setShowModal(true), 100);
        return false;
      }

      // Register this tab
      incrementTabCount();
      isRegistered.current = true;

      // Notify other tabs
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage({
          type: "tab-registered",
          tabId: tabId.current,
          count: getTabCount(),
        });
      }

      return true;
    };

    // Handle messages from other tabs
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "tab-registered") {
        // Another tab registered, check if we need to close
        const count = getTabCount();
        if (count > MAX_TABS && !isClosing.current) {
          isClosing.current = true;
          setTimeout(() => setShowModal(true), 100);
        }
      }
    };

    // Handle tab closing
    const handleBeforeUnload = () => {
      if (isRegistered.current) {
        decrementTabCount();
        isRegistered.current = false;
      }
    };

    // Initial check
    if (!checkTabLimit()) {
      return; // This tab should close
    }

    // Set up event listeners
    if (broadcastChannel.current) {
      broadcastChannel.current.addEventListener("message", handleMessage);
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      if (isRegistered.current && !isClosing.current) {
        decrementTabCount();
        isRegistered.current = false;
      }

      if (broadcastChannel.current) {
        broadcastChannel.current.removeEventListener("message", handleMessage);
        broadcastChannel.current.close();
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Countdown effect for when modal is shown
  useEffect(() => {
    if (!showModal) return;

    let countdown = 5;
    const countdownInterval = setInterval(() => {
      countdown--;
      const countdownElement = document.getElementById("countdown");
      if (countdownElement) {
        countdownElement.textContent = countdown.toString();
      }

      if (countdown <= 0) {
        clearInterval(countdownInterval);
        handleCloseTab();
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showModal]);

  const handleCloseTab = () => {
    try {
      window.close();

      // Fallback methods
      setTimeout(() => {
        if (!window.closed) {
          window.location.href = "about:blank";
        }
      }, 100);
    } catch {
      window.location.href = "about:blank";
    }
  };

  return (
    <>
      <Dialog open={showModal} onOpenChange={() => {}}>
        <DialogOverlay
          className="z-[15000]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        <DialogContent className="z-[15001]">
          <DialogHeader>
            <DialogTitle>Tab Limit Reached</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You can only have a maximum of{" "}
            <strong className="text-fontColorAction">{MAX_TABS} tabs</strong>{" "}
            open at once. This tab will be closed automatically. <br />
            <span className="text-destructive">
              This tab will close automatically in{" "}
              <span id="countdown" className="text-destructive">
                5
              </span>{" "}
              seconds
            </span>
          </DialogDescription>
          <DialogFooter>
            <BaseButton
              className="w-full"
              id="closeTabBtn"
              onClick={handleCloseTab}
            >
              Close This Tab
            </BaseButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
}

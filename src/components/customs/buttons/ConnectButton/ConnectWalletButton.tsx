"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import { useEffect, useState } from "react";

// ######## Components 🧩 ########
import ConnectDesktop from "./ConnectDesktop";
import ConnectMobile from "./ConnectMobile";

// ######## Utils 🔧 ########
import { isMobileDevice as detectMobileDevice } from "@/utils/phantom-wallet/mobileAuthUtils";
import { buildUrl } from "@/utils/phantom-wallet";

// Utility function to detect Phantom user agent
const isPhantomUserAgent = (): boolean => {
  if (typeof window === "undefined") return false;
  return /phantom/i.test(navigator.userAgent);
};

interface ConnectWalletButtonProps {
  onSuccess?: (authResponse: any) => Promise<void>;
  className?: string;
  variant?: "primary" | "gray";
  is2FARequired?: boolean;
}

// ########## CONNECT WALLET BUTTON🤖 ##########
const ConnectWalletButton = ({
  onSuccess,
  className,
  variant = "primary",
}: ConnectWalletButtonProps) => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPhantom, setIsPhantom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Detect device type and Phantom user agent on component mount
  useEffect(() => {
    setIsMobileDevice(detectMobileDevice());
    setIsPhantom(isPhantomUserAgent());
  }, []);

  return (
    <>
      {isPhantom || !isMobileDevice ? (
        <ConnectDesktop
          onSuccess={onSuccess}
          className={className}
          variant={variant}
        />
      ) : (
        <ConnectMobile
          onSuccess={onSuccess}
          className={className}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}
      {/* <PhantomCheckerComponent /> */}
    </>
  );
};

export default ConnectWalletButton;

// const usePhantomChecker = () => {
//   const [isPhantomInstalled, setIsPhantomInstalled] = useState<boolean | null>(
//     null,
//   );
//
//   const checkPhantomInstallation = () => {
//     const params = new URLSearchParams({
//       cluster: "mainnet-beta",
//     });
//     const url = buildUrl("connect", params);
//
//     // Redirect to Phantom app
//     window.location.href = url;
//
//     return;
//     const phantomUrlScheme = "phantom://";
//     const timeoutDuration = 2000; // Timeout duration in ms to determine if app is installed
//
//     // Create an invisible iframe to check the deep link
//     const iframe = document.createElement("iframe");
//     iframe.style.display = "none";
//     document.body.appendChild(iframe);
//
//     // Start loading the Phantom URL scheme
//     iframe.src = phantomUrlScheme;
//
//     // Set a timeout to detect if Phantom app is installed
//     const timeout = setTimeout(() => {
//       // If the Phantom app hasn't opened, it's probably not installed
//       setIsPhantomInstalled(false);
//       document.body.removeChild(iframe);
//     }, timeoutDuration);
//
//     // Listen to the event when the app tries to open and close the iframe
//     iframe.onload = () => {
//       clearTimeout(timeout);
//       setIsPhantomInstalled(true); // Phantom is installed, as it responded to the deep link
//       document.body.removeChild(iframe);
//     };
//   };
//
//   return {
//     isPhantomInstalled,
//     checkPhantomInstallation,
//   };
// };
//
// const PhantomCheckerComponent = () => {
//   const { isPhantomInstalled, checkPhantomInstallation } = usePhantomChecker();
//
//   return (
//     <div>
//       <button onClick={checkPhantomInstallation}>Go Phantom</button>
//       {isPhantomInstalled === null ? (
//         <p>Loading...</p>
//       ) : isPhantomInstalled ? (
//         <p>Phantom Wallet is installed on your device!</p>
//       ) : (
//         <p>Phantom Wallet is not installed on your device.</p>
//       )}
//     </div>
//   );
// };

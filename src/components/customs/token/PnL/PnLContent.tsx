"use client";

// ######## Libraries 📦 & Hooks 🪝 ########
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toBlob, toPng } from "html-to-image";
import * as QRCode from "qrcode";
import GIF from "gif.js";
import { parseGIF, decompressFrames } from "gifuct-js";
// @ts-ignore
// ######## Components 🧩 ########
import Image from "next/image";
import BaseButton from "@/components/customs/buttons/BaseButton";
import WalletSelectionButton from "@/components/customs/WalletSelectionButton";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
// ######## Utils & Helpers 🤝 ########
import {
  formatAmountDollarPnL,
  formatAmountWithoutLeadingZero,
} from "@/utils/formatAmount";
// ######## Types 🗨️ ########
import { Wallet } from "@/apis/rest/wallet-manager";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy } from "lucide-react";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import toast from "react-hot-toast";
import CustomToast from "../../toasts/CustomToast";
import { cn } from "@/libraries/utils";
import { getIsStrippedHoldingPreviewData } from "@/utils/getIsStrippedHoldingPreviewData";
import PnLCustomImage from "@/components/customs/token/PnL/PnLCustomImage";
import { usePnlSettings } from "@/stores/use-pnl-settings.store";
import { getProxyUrl } from "@/utils/getProxyUrl";
import { useQuery } from "@tanstack/react-query";
import { getUserEarningData } from "@/apis/rest/earn-new";
import { useTelegramSettingsStore } from "@/stores/setting/use-telegram-settings.store";
import { useCustomToast } from "@/hooks/use-custom-toast";

function getRandomBinary(): number {
  return Math.floor(Math.random() * 2);
}

/* ---------- Global blob cache shared across PnLContent instances ---------- */
let GLOBAL_PNL_BLOB: Blob | null = null;
let GLOBAL_PNL_CLIPBOARD_ITEM: ClipboardItem | null = null;
let GLOBAL_PNL_TEMPLATE_SIG: string | null = null;
let GLOBAL_PNL_GENERATION_PROMISE: Promise<Blob | null> | null = null;

// Helper to ensure all images inside node are fully loaded before conversion
// OPTIMIZATION: Enhanced image loading with timeout and prioritization
const waitForImagesLoaded = (node: HTMLElement): Promise<void> => {
  // Get all images in the node
  const images = Array.from(node.querySelectorAll("img"));

  // If no images or all are already loaded, resolve immediately
  const unloaded = images.filter((img) => !img.complete);
  if (unloaded.length === 0) return Promise.resolve();

  // OPTIMIZATION: Preload critical images by setting their loading priority
  unloaded.forEach((img) => {
    // Set fetchpriority attribute for modern browsers
    if ("fetchPriority" in HTMLImageElement.prototype) {
      (img as any).fetchPriority = "high";
    }
    // Force browser to start loading by accessing naturalWidth
    void img.naturalWidth;
  });

  return Promise.race([
    // Normal loading process
    new Promise<void>((resolve) => {
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount += 1;
        if (loadedCount === unloaded.length) resolve();
      };
      unloaded.forEach((img) => {
        img.addEventListener("load", checkDone, { once: true });
        img.addEventListener("error", checkDone, { once: true });
      });
    }),

    // OPTIMIZATION: Timeout after 2 seconds to prevent hanging
    // This ensures we don't wait forever if some images fail to load
    new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn(
          "Image loading timed out, proceeding with available images",
        );
        resolve();
      }, 2000);
    }),
  ]);
};

// OPTIMIZATION: Preload all template assets when the module loads
// This ensures assets are in browser cache before they're needed
// Import browser utility functions
import {
  isBrowser,
  runInBrowser,
  createClipboardItem,
  hasClipboardSupport,
  writeToClipboard,
} from "@/utils/browserUtils";
import { truncateString } from "@/utils/truncateString";

// Use the runInBrowser utility to safely execute browser-only code
runInBrowser(() => {
  const criticalAssets = [
    "/template/assets/sol-white.svg",
    "/template/assets/sol-green.svg",
    "/template/assets/sol-red.svg",
  ];

  try {
    // Immediately start preloading when module is loaded
    criticalAssets.forEach((url) => {
      // Use the global Image constructor instead of the Next.js Image component
      const img = new window.Image();
      img.src = url;
      // Set high priority for faster loading
      if ("fetchPriority" in HTMLImageElement.prototype) {
        (img as any).fetchPriority = "high";
      }
      // Force browser to actually load the image
      img.onload = () => {
        // Image loaded and cached
        console.log(`Preloaded asset: ${url}`);
      };
      img.onerror = () => {
        console.warn(`Failed to preload asset: ${url}`);
      };
      // Force browser to start loading
      void img.naturalWidth;
    });
  } catch (error) {
    console.warn("Error preloading critical assets:", error);
  }
});
// Assets are already being preloaded by the IIFE above

const PnLContent = ({
  profitAndLoss,
  profitAndLossUsdRaw,
  profitAndLossPercentage,
  sold,
  soldDRaw,
  invested,
  investedDRaw,
  closeElement,
  scrollable,
  solPrice,
  wallets,
  setWallets,
  title,
  image,
  type,
  remaining,
  remainingDRaw,
}: {
  profitAndLoss: string | number;
  profitAndLossUsdRaw?: string | number;
  profitAndLossPercentage: string | number;
  sold: string | number;
  soldDRaw?: string | number;
  invested: string | number;
  investedDRaw?: string | number;
  closeElement: React.ReactNode;
  scrollable?: boolean;
  solPrice: number;
  wallets?: Wallet[];
  setWallets?: (wallets: Wallet[]) => void;
  title: string;
  image?: string;
  type?: string;
  remaining: string | number;
  remainingDRaw?: string | number;
}) => {
  const width = useWindowSizeStore((state) => state.width);
  const { selectedBackgroundPnlCard, customImageCard } = usePnlSettings();
  const { novaUserId: userId, telegramUserId } = useTelegramSettingsStore();
  const { success: successToast, error: errorToast } = useCustomToast();

  const { data: userData } = useQuery({
    queryKey: ["earn-user-data"],
    queryFn: async () => {
      return await getUserEarningData({ userId, telegramUserId });
    },
    enabled: !!userId,
    retry: 2,
  });

  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [showUSD, setShowUSD] = useState(true);

  const selectedWalletAddresses = (wallets || [])?.map(
    (wallet) => wallet?.address,
  );
  const referralCode = userData?.referralCode || "TradeOnNova";

  const randomBinary = useMemo(() => {
    return getRandomBinary();
  }, []);

  const getAmount = (
    value: any,
    formatter: (value: number, param?: any) => string,
    suffix: string = "",
    additionalParam: any = undefined,
  ) => formatter(Number(value) || 0, additionalParam) + suffix;

  const generateQRCodeBase64 = async (text: string) => {
    try {
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 200,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      return null;
    }
  };

  const templateData = useMemo(() => {
    const imageToUse = image ? getProxyUrl(image) : undefined;

    // Format profit/loss values for display
    const formattedProfit = getAmount(
      profitAndLoss,
      formatAmountWithoutLeadingZero,
      "",
    );
    const formattedProfitUSD = profitAndLossUsdRaw
      ? getAmount(profitAndLossUsdRaw, formatAmountDollarPnL, "")
      : getAmount(
          Number(profitAndLoss || 0) * solPrice,
          formatAmountDollarPnL,
          "",
        );

    // Format investment values
    const formattedInvested = getAmount(
      invested,
      formatAmountWithoutLeadingZero,
      "",
    );
    const formattedInvestedUSD = investedDRaw
      ? getAmount(investedDRaw, formatAmountDollarPnL, "")
      : getAmount(Number(invested || 0) * solPrice, formatAmountDollarPnL, "");

    // Format sold values
    const formattedSold = getAmount(sold, formatAmountWithoutLeadingZero, "");
    const formattedSoldUSD = soldDRaw
      ? getAmount(soldDRaw, formatAmountDollarPnL, "")
      : getAmount(Number(sold || 0) * solPrice, formatAmountDollarPnL, "");

    // Format holding values
    const formattedHolding = getAmount(
      remaining,
      formatAmountWithoutLeadingZero,
      "",
    );
    const formattedHoldingUSD = remainingDRaw
      ? getAmount(remainingDRaw, formatAmountDollarPnL, "")
      : getAmount(Number(remaining || 0) * solPrice, formatAmountDollarPnL, "");

    // Calculate ROI
    const roi =
      Number(invested || 0) !== 0
        ? (Number(profitAndLoss || 0) >= 0 ? "+" : "") +
          Math.max((Number(profitAndLoss || 0) / Number(invested || 1)) * 100, -100).toFixed(2) +
          "%"
        : "0%";

    const roiUSD =
      Number(investedDRaw || 0) !== 0
        ? (Number(
            profitAndLossUsdRaw || Number(profitAndLoss || 0) * solPrice,
          ) >= 0
            ? "+"
            : "") +
          (
            (Number(
              profitAndLossUsdRaw || Number(profitAndLoss || 0) * solPrice,
            ) /
              Number(investedDRaw || Number(invested || 0) * solPrice || 1)) *
            100
          ).toFixed(2) +
          "%"
        : "0%";

    // Create formatted display values for the profit/loss display
    const profitLossDisplay = showUSD ? formattedProfitUSD : formattedProfit;
    const profitLossPercent = showUSD ? roiUSD : roi;

    // Create summary items for BOUGHT, SOLD, STILL HOLDING
    const summaryItems = [
      {
        label: "BOUGHT",
        value: showUSD ? formattedInvestedUSD : formattedInvested,
      },
      { label: "SOLD", value: showUSD ? formattedSoldUSD : formattedSold },
      {
        label: "STILL HOLDING",
        value: showUSD ? formattedHoldingUSD : formattedHolding,
      },
    ];

    return {
      pnlBg: selectedBackgroundPnlCard
        ? selectedBackgroundPnlCard
        : randomBinary === 0
          ? "/template/assets/pnl-trophy.png"
          : "/template/assets/pnl-rocket.png",
      symbol: type === "holding" ? "ALL HOLDINGS" : title,
      isImage: Boolean(imageToUse),
      image: imageToUse,
      showUSD,
      invested: formattedInvested,
      sold: formattedSold,
      holding: formattedHolding,
      investedD: formattedInvestedUSD,
      soldD: formattedSoldUSD,
      holdingD: formattedHoldingUSD,
      roi,
      roiD: roiUSD,
      profitOrLoss: Number(profitAndLoss || 0) > 0 ? "Profit" : "Loss",
      profitD:
        (Number(profitAndLossUsdRaw || Number(profitAndLoss || 0) * solPrice) >
        0
          ? "+"
          : "") + formattedProfitUSD,
      profit: (Number(profitAndLoss || 0) > 0 ? "+" : "") + formattedProfit,
      profitSol: getAmount(
        profitAndLoss,
        formatAmountWithoutLeadingZero,
        " SOL",
      ),
      isProfit: Number(profitAndLoss || 0) > 0,
      isLoss: Number(profitAndLoss || 0) < 0,
      referralCode: referralCode,
      // Add new fields for snapshot data manipulation
      profitLossDisplay,
      profitLossPercent,
      summaryItems,
    };
  }, [
    selectedWalletAddresses,
    profitAndLoss,
    profitAndLossUsdRaw,
    profitAndLossPercentage,
    solPrice,
    title,
    showUSD,
    image,
    selectedBackgroundPnlCard,
    referralCode,
    invested,
    investedDRaw,
    sold,
    soldDRaw,
    remaining,
    remainingDRaw,
  ]);

  const renderedTemplate = useMemo(() => {
    const isGif = templateData.pnlBg.startsWith("data:image/gif");
    return (
      <div
        id="pnl-template-content"
        className={`relative z-[10] h-full w-full bg-center bg-no-repeat ${
          selectedBackgroundPnlCard && !isGif ? "bg-cover" : "bg-contain"
        }`}
        style={{
          backgroundImage: `url(${templateData.pnlBg})`,
          backgroundSize: isGif ? "cover" : undefined,
        }}
      >
        {selectedBackgroundPnlCard ? (
          <Image
            className="absolute left-[26px] top-[22px]"
            src="/template/assets/nova-logo-text.svg"
            alt="logo"
            width={74}
            height={0}
          />
        ) : null}
        <div className="body z-[10]">
          <main className="pnl-main font-outfit">
            <div className="main-container">
              <div className="token-container">
                {image && templateData.symbol !== "ALL HOLDINGS" && (
                  <div
                    className="token-logo relative"
                    id="token-logo-container"
                  >
                    <Image
                      src={templateData.image as string}
                      className="token-logo-image"
                      alt="token-logo"
                      fill
                    />
                  </div>
                )}

                <span className="token-name">{truncateString(templateData.symbol, 18)}</span>
              </div>

              <div className="pnl mt-[-3.5px]">
                <div className="flex">
                  {getIsStrippedHoldingPreviewData(
                    templateData.invested,
                    remaining,
                  ) ? (
                    "-"
                  ) : templateData.showUSD ? (
                    templateData.profitD
                  ) : (
                    <>
                      {templateData.profit}
                      <div className="relative ml-[10px] mt-[10px] flex h-auto w-[30px] items-center justify-center">
                        <Image
                          src="/template/assets/sol-white.svg"
                          alt="sol icon"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="summary">
                <div className="summary-item">
                  <span className="summary-label">BOUGHT</span>
                  <div
                    className={cn(
                      templateData.isProfit
                        ? "summary-value-profit"
                        : templateData.isLoss
                        ? "summary-value-loss"
                        : "summary-value",
                      "mt-[-4.5px]",
                    )}
                  >
                    <div className="flex">
                      {getIsStrippedHoldingPreviewData(
                        templateData.invested,
                        remaining,
                      ) ? (
                        "-"
                      ) : showUSD ? (
                        templateData.investedD
                      ) : (
                        <>
                          {templateData.invested}
                          <div className="relative ml-[5px] h-auto w-[15px]">
                            <Image
                              src={
                                templateData.isProfit
                                  ? "/template/assets/sol-green.svg"
                                  : templateData.isLoss
                                  ? "/template/assets/sol-red.svg"
                                  : "/template/assets/sol-white.svg"
                              }
                              alt="sol icon"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="summary-item">
                  <span className="summary-label">SOLD</span>
                  <span
                    className={cn(
                      templateData.isProfit
                        ? "summary-value-profit"
                        : templateData.isLoss
                        ? "summary-value-loss"
                        : "summary-value",
                      "mt-[-4.5px]",
                    )}
                  >
                    <div className="flex">
                      {getIsStrippedHoldingPreviewData(
                        Number(templateData.sold) +
                          Number(templateData.invested),
                        remaining,
                      ) ? (
                        "-"
                      ) : showUSD ? (
                        templateData.soldD
                      ) : (
                        <>
                          {templateData.sold}
                          <div className="relative ml-[5px] h-auto w-[15px]">
                            <Image
                              src={
                                templateData.isProfit
                                  ? "/template/assets/sol-green.svg"
                                  : "/template/assets/sol-red.svg"
                              }
                              alt="sol icon"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">STILL HOLDING</span>
                  <span className="summary-value mt-[-4.5px]">
                    <div className="flex">
                      {showUSD ? (
                        templateData.holdingD
                      ) : (
                        <>
                          {templateData.holding}
                          <div className="relative ml-[5px] h-auto w-[15px]">
                            <Image
                              src="/template/assets/sol-white.svg"
                              alt="sol icon"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">R.O.I</span>
                  <span className="summary-value mt-[-4.5px]">
                    {getIsStrippedHoldingPreviewData(
                      templateData.invested,
                      remaining,
                    )
                      ? "-"
                      : templateData.roi}
                  </span>
                </div>
              </div>

              <div className="referral-container">
                <div className="referral">
                  <div className="referral-label">REFERRAL</div>
                  <div className="referral-value mt-[-2px]">
                    {templateData.referralCode}
                  </div>
                </div>
              </div>

              <div className="footer-container">
                <div className="nova-website">nova.trade</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }, [
    selectedBackgroundPnlCard,
    customImageCard.image,
    customImageCard.name,
    templateData,
  ]);

  const handleTweet = () => {
    const pnlValue = showUSD
      ? getAmount(
          profitAndLossUsdRaw
            ? profitAndLossUsdRaw
            : Number(profitAndLoss || 0) * solPrice,
          formatAmountDollarPnL,
        )
      : getAmount(profitAndLoss, formatAmountWithoutLeadingZero);

    const tweetText = `I just made ${pnlValue}${showUSD ? "USD" : "SOL"} on ${title} with Nova 💜\n\nThe fastest speeds and highest earning rewards.\n\nTrade with me - https://nova.trade/`;
    const encodedTweet = encodeURIComponent(tweetText);
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodedTweet}`;
    window.open(twitterIntentUrl, "_blank");
  };

  const htmlToCanvasRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateAnimatedPnlGif = useCallback(
    async (
      elementToCapture: HTMLElement,
      backgroundGifUrl: string,
      action: "download" | "copy",
    ) => {
      try {
        // --- 1. Fetch and Parse ---
        const gifBlob = await fetch(backgroundGifUrl).then((res) => res.blob());
        const arrayBuffer = await gifBlob.arrayBuffer();
        const parsedGif = parseGIF(arrayBuffer);
        const frames = decompressFrames(parsedGif, true);

        // --- 2. Generate Overlay ---
        const contentElement = elementToCapture.querySelector<HTMLElement>(
          "#pnl-template-content",
        );
        if (!contentElement) throw new Error("Content element not found");
        const originalBg = contentElement.style.backgroundImage;
        contentElement.style.backgroundImage = "none";
        const overlayPngDataUrl = await toPng(contentElement, {
          cacheBust: true,
          quality: 1,
          pixelRatio: 3,
        });
        contentElement.style.backgroundImage = originalBg;
        const overlayImage = new window.Image();
        overlayImage.src = overlayPngDataUrl;
        await new Promise((resolve, reject) => {
          overlayImage.onload = resolve;
          overlayImage.onerror = reject;
        });

        // --- 3. Initialize Canvases and Encoder ---
        const finalWidth = TEMPLATE_WIDTH * 3;
        const finalHeight = TEMPLATE_HEIGHT * 3;
        const gif = new GIF({
          workers: 4,
          quality: 10,
          workerScript: "/gif.worker.js",
          width: finalWidth,
          height: finalHeight,
        });

        const gifBackgroundCanvas = document.createElement("canvas");
        const logicalWidth = parsedGif.lsd.width;
        const logicalHeight = parsedGif.lsd.height;
        gifBackgroundCanvas.width = logicalWidth;
        gifBackgroundCanvas.height = logicalHeight;
        const gifBackgroundCtx = gifBackgroundCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        if (!gifBackgroundCtx)
          throw new Error("Could not get background canvas context");

        const finalFrameCanvas = document.createElement("canvas");
        finalFrameCanvas.width = finalWidth;
        finalFrameCanvas.height = finalHeight;
        const finalFrameCtx = finalFrameCanvas.getContext("2d");
        if (!finalFrameCtx)
          throw new Error("Could not get final canvas context");
        finalFrameCtx.imageSmoothingEnabled = true;
        finalFrameCtx.imageSmoothingQuality = "high";

        let backgroundColor: string | null = null;
        if (parsedGif.gct && parsedGif.lsd.backgroundColorIndex !== undefined) {
          const bgColor = parsedGif.gct[parsedGif.lsd.backgroundColorIndex];
          if (bgColor) {
            backgroundColor = `rgb(${bgColor.join(",")})`;
            gifBackgroundCtx.fillStyle = backgroundColor;
            gifBackgroundCtx.fillRect(0, 0, logicalWidth, logicalHeight);
          }
        }

        // --- 4. Render Frames with Full Disposal Logic ---
        let previousFrameImageData: ImageData | null = null;
        let lastFrameDisposalType: number | null = null;
        let lastFrameDims: {
          top: number;
          left: number;
          width: number;
          height: number;
        } | null = null;

        for (const frame of frames) {
          const currentFrameDims = frame.dims;

          if (lastFrameDisposalType === 2 && lastFrameDims) {
            if (backgroundColor) {
              gifBackgroundCtx.fillStyle = backgroundColor;
              gifBackgroundCtx.fillRect(
                lastFrameDims.left,
                lastFrameDims.top,
                lastFrameDims.width,
                lastFrameDims.height,
              );
            } else {
              gifBackgroundCtx.clearRect(
                lastFrameDims.left,
                lastFrameDims.top,
                lastFrameDims.width,
                lastFrameDims.height,
              );
            }
          }
          if (lastFrameDisposalType === 3 && previousFrameImageData) {
            gifBackgroundCtx.putImageData(previousFrameImageData, 0, 0);
          }

          if (frame.disposalType === 3) {
            previousFrameImageData = gifBackgroundCtx.getImageData(
              0,
              0,
              logicalWidth,
              logicalHeight,
            );
          }

          const patchImageData = new ImageData(
            frame.patch,
            currentFrameDims.width,
            currentFrameDims.height,
          );
          gifBackgroundCtx.putImageData(
            patchImageData,
            currentFrameDims.left,
            currentFrameDims.top,
          );

          const sourceRatio = logicalWidth / logicalHeight;
          const destRatio = finalWidth / finalHeight;
          let scaledWidth, scaledHeight, scaledX, scaledY;
          if (sourceRatio > destRatio) {
            scaledHeight = finalHeight;
            scaledWidth = finalHeight * sourceRatio;
            scaledX = (finalWidth - scaledWidth) / 2;
            scaledY = 0;
          } else {
            scaledWidth = finalWidth;
            scaledHeight = finalWidth / sourceRatio;
            scaledX = 0;
            scaledY = (finalHeight - scaledHeight) / 2;
          }
          finalFrameCtx.drawImage(
            gifBackgroundCanvas,
            scaledX,
            scaledY,
            scaledWidth,
            scaledHeight,
          );
          finalFrameCtx.drawImage(overlayImage, 0, 0);
          gif.addFrame(finalFrameCtx, { copy: true, delay: frame.delay });

          lastFrameDisposalType = frame.disposalType;
          lastFrameDims = currentFrameDims;
        }

        // --- 5. Finalize and Route to Correct Action ---
        gif.on("finished", async (blob) => {
          if (action === "download") {
            const link = document.createElement("a");
            link.download = "pnl-image.gif";
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            // toast.custom((t) => (
            //   <CustomToast
            //     tVisibleState={t.visible}
            //     message="Image downloaded!"
            //     state="SUCCESS"
            //   />
            // ));
            successToast("Image downloaded!");
          }
          // TODO: Fix this copy logic to handle GIFs properly. This code still fails.
          else if (action === "copy") {
            if (!navigator.clipboard || !navigator.clipboard.write) {
              // toast.custom((t) => (
              //   <CustomToast
              //     tVisibleState={t.visible}
              //     message="Copy to clipboard is not supported by your browser."
              //     state="ERROR"
              //   />
              // ));
              errorToast("Copy to clipboard is not supported by your browser.");

              setIsLoadingDownload(false);
              return;
            }

            try {
              const item = new ClipboardItem({ "image/gif": blob });
              await navigator.clipboard.write([item]);
              // toast.custom((t) => (
              //   <CustomToast
              //     tVisibleState={t.visible}
              //     message="GIF copied to clipboard!"
              //     state="SUCCESS"
              //   />
              // ));
              successToast("GIF copied to clipboard!");
            } catch (copyError) {
              console.error("Failed to copy GIF:", copyError);
              let errorMessage = "Could not copy image.";
              if (
                copyError instanceof Error &&
                copyError.name === "NotAllowedError"
              ) {
                errorMessage = "Clipboard permission denied.";
              }
              // toast.custom((t) => (
              //   <CustomToast
              //     tVisibleState={t.visible}
              //     message={errorMessage}
              //     state="ERROR"
              //   />
              // ));
              errorToast(errorMessage);
            }
          }
          setIsLoadingDownload(false);
        });

        gif.render();
      } catch (err) {
        console.error("❌ Error generating animated GIF:", err);
        // toast.custom((t) => (
        //   <CustomToast
        //     tVisibleState={t.visible}
        //     message="Failed to generate animated GIF."
        //     state="ERROR"
        //   />
        // ));
        errorToast("Failed to generate image.");
        setIsLoadingDownload(false);
      }
    },
    [],
  );

  const handleImageAction = useCallback(
    async (
      action: "download" | "copy" | "both",
      _showToast?: boolean,
      _snapshot?: {
        templateData: any;
        showUSD: boolean;
      },
    ) => {
      setIsLoadingDownload(true);

      const isFirefox =
        typeof navigator !== "undefined" &&
        navigator.userAgent?.toLowerCase().indexOf("firefox") > -1;
      const elementToCapture = htmlToCanvasRef.current;

      if (!elementToCapture) {
        setIsLoadingDownload(false);
        return;
      }

      const isGifBackground =
        selectedBackgroundPnlCard &&
        selectedBackgroundPnlCard.startsWith("data:image/gif");

      if (isGifBackground && action === "download") {
        await generateAnimatedPnlGif(
          elementToCapture,
          selectedBackgroundPnlCard,
          action,
        );
      } else {
        try {
          console.log("Starting fast preview blob generation (fonts embedded)");

          // Ensure assets ready
          await waitForImagesLoaded(htmlToCanvasRef.current as unknown as HTMLElement);
          if (document.fonts && (document.fonts as any).ready) {
            await (document.fonts as any).ready.catch(() => {});
          }

          const blob = await toBlob(elementToCapture as HTMLElement, {
            cacheBust: false,
            // PNGs ignore quality but keep for JPEG compatibility
            quality: 1,
            pixelRatio: 3,
            fetchRequestInit: {
              mode: "no-cors",
            },
            skipFonts: false,
            
            
          });

          if (!blob) {
            throw new Error("Failed to generate image blob");
          }

          if (action === "download" || action === "both") {
            const dataUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "pnl-image.png";
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(dataUrl);
            // toast.custom((t) => (
            //   <CustomToast
            //     tVisibleState={t.visible}
            //     message="Image downloaded!"
            //     state="SUCCESS"
            //   />
            // ));
            successToast("Image downloaded!");
          } else if (action === "copy" || action === "both") {
            const item = new ClipboardItem({ "image/png": blob });
            await navigator.clipboard.write([item]);
            // toast.custom((t) => (
            //   <CustomToast
            //     tVisibleState={t.visible}
            //     message="Image copied to clipboard!"
            //     state="SUCCESS"
            //   />
            // ));
            successToast("Image copied to clipboard!");
          }
        } catch (err) {
          console.warn("❌ Error generating static image:", err);
          // toast.custom((t) => (
          //   <CustomToast
          //     tVisibleState={t.visible}
          //     message="Failed to generate image."
          //     state="ERROR"
          //   />
          // ));
          errorToast("Failed to generate image.");
        } finally {
          setIsLoadingDownload(false);
        }
      }
    },
    [selectedBackgroundPnlCard, generateAnimatedPnlGif, setIsLoadingDownload],
  );

  // Add these constants for template dimensions
  const TEMPLATE_WIDTH = 544;
  const TEMPLATE_HEIGHT = 363;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!htmlToCanvasRef.current) return;

    const updateScale = () => {
      const container = htmlToCanvasRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / TEMPLATE_WIDTH;
      const scaleY = containerHeight / TEMPLATE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(htmlToCanvasRef.current);
    updateScale();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div className="flex h-[64px] w-full items-center justify-between gap-x-2 border-b border-border px-4 py-[19px]">
        <h4 className="text-nowrap font-geistSemiBold text-[18px] text-fontColorPrimary">
          P&L Image
        </h4>

        {wallets && setWallets && (
          <WalletSelectionButton
            value={wallets}
            setValue={setWallets}
            isMultipleSelect={true}
            maxWalletShow={10}
            isGlobal={false}
            className="h-10 w-full"
          />
        )}

        {closeElement}
      </div>

      <div className="flex w-full flex-grow flex-col gap-y-3 p-4">
        <>
          <ContextMenu>
            <ContextMenuTrigger>
              <>
                {scrollable ? (
                  width! >= 768 ? (
                    <OverlayScrollbarsComponent
                      defer
                      element="div"
                      className="relative h-fit w-full flex-grow overflow-y-scroll"
                    >
                      <div
                        ref={htmlToCanvasRef}
                        className="relative w-full overflow-hidden rounded-[8px] border border-border"
                        style={{
                          aspectRatio: `${TEMPLATE_WIDTH}/${TEMPLATE_HEIGHT}`,
                          maxWidth: "816px",
                          maxHeight: "545px",
                          margin: "0 auto",
                        }}
                      >
                        <div
                          className="absolute left-0 top-0 origin-top-left"
                          style={{
                            width: TEMPLATE_WIDTH,
                            height: TEMPLATE_HEIGHT,
                            transform: `scale(${scale})`,
                            transformOrigin: "top left",
                          }}
                        >
                          {renderedTemplate}
                        </div>
                      </div>
                    </OverlayScrollbarsComponent>
                  ) : (
                    <OverlayScrollbarsComponent
                      defer
                      element="div"
                      className="relative flex w-full flex-grow"
                      style={{
                        height: TEMPLATE_HEIGHT * scale + 5,
                      }}
                    >
                      <div className="absolute left-0 top-0 h-full w-full">
                        <div
                          ref={htmlToCanvasRef}
                          className="relative h-fit w-full overflow-hidden rounded-[8px] border border-border"
                          style={{
                            aspectRatio: `${TEMPLATE_WIDTH}/${TEMPLATE_HEIGHT}`,
                            maxWidth: "816px",
                            maxHeight: "545px",
                            margin: "0 auto",
                          }}
                        >
                          <div
                            className="absolute left-0 top-0 origin-top-left"
                            style={{
                              width: TEMPLATE_WIDTH,
                              height: TEMPLATE_HEIGHT,
                              transform: `scale(${scale})`,
                              transformOrigin: "top left",
                            }}
                          >
                            {renderedTemplate}
                          </div>
                        </div>
                      </div>
                    </OverlayScrollbarsComponent>
                  )
                ) : (
                  <div
                    ref={htmlToCanvasRef}
                    className="relative w-full overflow-hidden rounded-[8px] border border-border"
                    style={{
                      aspectRatio: `${TEMPLATE_WIDTH}/${TEMPLATE_HEIGHT}`,
                      maxWidth: "816px",
                      maxHeight: "545px",
                      margin: "0 auto",
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 origin-top-left"
                      style={{
                        width: TEMPLATE_WIDTH,
                        height: TEMPLATE_HEIGHT,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      {renderedTemplate}
                    </div>
                  </div>
                )}
              </>
            </ContextMenuTrigger>
            <ContextMenuContent className="gb__white__popover z-[1000] w-56 border border-border bg-background">
              <div
                onClick={() => {
                  if (!isLoadingDownload) {
                    // Create a snapshot of the current data immediately when the button is clicked
                    // This ensures we capture the exact state at the moment of the click
                    const currentSnapshot = {
                      templateData: JSON.parse(JSON.stringify(templateData)),
                      showUSD: showUSD,
                    };
                    handleImageAction("copy", false, currentSnapshot);
                  }
                }}
                className={cn(
                  "inset flex cursor-pointer items-center justify-center bg-shadeTable py-1.5 text-center text-fontColorPrimary transition-colors duration-300",
                  isLoadingDownload
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-shadeTableHover hover:text-fontColorPrimary",
                )}
              >
                <Copy
                  className="mr-2 h-4 w-4 text-fontColorPrimary"
                  size={16}
                />
                {isLoadingDownload ? "Copying..." : "Copy Image"}
              </div>
            </ContextMenuContent>
          </ContextMenu>
        </>

        <PnLCustomImage
          defaultTemplate={
            randomBinary === 0
              ? "/template/assets/pnl-trophy.png"
              : "/template/assets/pnl-rocket.png"
          }
        />

        <div className="grid w-full grid-cols-1 items-center justify-between gap-x-3 gap-y-2 md:grid-cols-3">
          <BaseButton
            disabled={isLoadingDownload}
            isLoading={isLoadingDownload}
            onClick={() => {
              // This ensures we capture the exact state at the moment of the click
              const currentSnapshot = {
                templateData: JSON.parse(JSON.stringify(templateData)),
                showUSD: showUSD,
              };
              handleImageAction("download", true, currentSnapshot);
            }}
            variant="gray"
            className="h-fit md:h-[30px] lg:h-[40px]"
            prefixIcon={
              <div className="relative aspect-square size-4 lg:size-5">
                <Image
                  src="/icons/download.png"
                  alt="Download Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            }
          >
            <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
              Download
            </span>
          </BaseButton>
          <BaseButton
            variant="gray"
            prefixIcon={
              <div className="relative aspect-square size-4 lg:size-5">
                <Image
                  src="/icons/arrows-exchange.svg"
                  alt="Exchange Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            }
            className="h-fit bg-primary/[8%] text-sm text-primary hover:bg-primary/[24%] focus:bg-primary/[24%] md:h-[30px] lg:h-[40px]"
            onClick={() => setShowUSD(!showUSD)}
          >
            Change to {showUSD ? "SOL" : "USD"}
          </BaseButton>
          <BaseButton
            onClick={handleTweet}
            variant="primary"
            className="h-fit md:h-[30px] lg:h-[40px]"
            prefixIcon={
              <div className="relative aspect-square size-4 lg:size-5">
                <Image
                  src="/icons/social/twitter.png"
                  alt="Twitter Icon"
                  fill
                  quality={100}
                  className="object-contain"
                />
              </div>
            }
          >
            <span className="inline-block text-nowrap font-geistSemiBold text-sm text-fontColorPrimary">
              Tweet
            </span>
          </BaseButton>
        </div>
      </div>
    </>
  );
};

export default React.memo(PnLContent);

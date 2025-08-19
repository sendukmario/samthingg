"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";

export const BubbleMaps = ({
  variant,
}: {
  variant: "InsightX" | "BubbleMapsIO" | "CabalSpy";
}) => {
  const params = useParams();

  const [isLoaded, setIsLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsLoaded(false);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [variant]);

  return (
    params?.["mint-address"] && (
      <>
        {variant === "BubbleMapsIO" && (
          <>
            {isLoaded && (
              <div className="absolute bottom-10 left-3 aspect-square size-14 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Nova Logo"
                  fill
                  quality={100}
                  className="object-contain"
                  loading="eager"
                  priority
                />
              </div>
            )}
            <iframe
              src={`https://v2.bubblemaps.io/map?address=${params?.["mint-address"]}&chain=solana&partnerId=regular`}
              className="h-full w-full border-none"
              onLoad={() => {
                timeoutRef.current = setTimeout(() => {
                  setIsLoaded(true);
                }, 2000);
              }}
            />
          </>
        )}
        {variant === "InsightX" && (
          <iframe
            src={`https://app.insightx.network/bubblemaps/solana/${params?.["mint-address"]}?theme=dark`}
            allow="clipboard-write"
            className="h-full w-full border-none"
          ></iframe>
        )}
        {variant === "CabalSpy" && (
          <iframe
            src={`https://widgetnova.cabalspy.xyz:8443/widget?address=${params?.["mint-address"]}`}
            className="h-full w-full border-none"
          ></iframe>
        )}
      </>
    )
  );
};
export const GhostBubbleMaps = () => {
  return <div className="h-full w-full"></div>;
};

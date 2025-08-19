"use client";

// ######## Components 🧩 ########
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Separator from "@/components/customs/Separator";
const WhatsNewButton = dynamic(
  () => import("@/components/customs/buttons/WhatsNewButton"),
);
const QuickClipboard = dynamic(
  () => import("@/components/customs/QuickClipboard"),
);
const GlobalSearchModal = dynamic(
  () => import("@/components/customs/modals/GlobalSearchModal"),
);
const UserWallet = dynamic(() => import("@/components/customs/UserWallet"));
const UserEarningLevel = dynamic(
  () => import("@/components/customs/UserEarningLevel"),
  {
    ssr: false,
  },
);
const UserAccount = dynamic(() => import("@/components/customs/UserAccount"));
const NavLink = dynamic(() => import("@/components/layouts/partials/NavLink"));
// ######## Utils & Helpers 🤝 ########
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/libraries/utils";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { pathnamesWithoutBottomNav } from "@/components/layouts/partials/BottomNavigation";
import { useWindowSizeStore } from "@/stores/use-window-size.store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigationLinks = [
  {
    label: "Cosmo",
    href: "/",
  },
  {
    label: "Ignite",
    href: "/ignite",
  },
  {
    label: "Wallet Tracker",
    href: "/wallet-tracker",
  },
  {
    label: "Monitor",
    href: "/monitor",
  },
  {
    label: "Holdings",
    href: "/holdings",
  },
  {
    label: "Earn",
    href: "/earn",
  },
  {
    label: "Points",
    href: "/points",
  },
];

export default function Header({ isBoarding }: { isBoarding?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const width = useWindowSizeStore((state) => state.width);
  // const [count, setCount] = useState(0);

  const theme = useCustomizeTheme();

  const handleBack = () => {
    const referrer = document.referrer;
    const isExternalReferrer =
      referrer && !referrer.startsWith(window.location.origin);
    if (isExternalReferrer) {
      router.push("/default-page"); // atau show modal
    } else {
      router.back();
    }
  };
  // const sendRewardNotification = async () => {
  //   try {
  //     const response = await axios.post(
  //       "https://api-v2.nova.trade/api-v1/earn/notification",
  //     );
  //   } catch (error) {
  //     console.error("Error sending notification:", error);
  //   }
  // };

  // const handleTestReward = () => {
  //   setCount(count + 1);
  //   sendRewardNotification();
  //
  //   // useRewardNotificationStore.getState().addReward({
  //   //   id: `${count}-id`,
  //   //   message: "You have earned 5 SOL in cashback today!",
  //   //   timestamp: Date.now(),
  //   // });
  // };

  // const state = useWhatsNewStore((state) => state.isShowWhatsNew);

  return (
    <header
      className={cn(
        "sticky top-0 z-[5] border-border max-xl:border-b",
        isBoarding && "pointer-events-none",
      )}
    >
      {/* <Watchlist /> */}

      {/* <Button onClick={handleTestReward}>Test Notification</Button> */}
      <div
        className="flex w-full justify-between px-4 py-2 xl:border-transparent"
        style={theme.background2}
      >
        <div className="flex w-fit items-center gap-x-2.5 2xl:gap-x-4">
          {pathnamesWithoutBottomNav.includes(pathname.split("/")[1]) ? (
            <>
              {width! < 1280 ? (
                <button suppressHydrationWarning onClick={handleBack}>
                  <div className="relative flex aspect-square size-4 flex-shrink-0 xl:hidden">
                    <Image
                      src="/icons/left-arrow.svg"
                      alt="Back Icon"
                      fill
                      quality={100}
                      className="object-contain"
                    />
                  </div>
                </button>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={"/"}
                        prefetch
                        className="relative hidden aspect-square h-8 w-8 flex-shrink-0 xl:flex"
                      >
                        <Image
                          src="/logo.png"
                          alt="Nova Logo"
                          fill
                          quality={100}
                          className="object-contain"
                          priority
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Nova Plus</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          ) : (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={"/"}
                    prefetch
                    className="relative hidden aspect-square h-8 w-8 flex-shrink-0 xl:flex"
                  >
                    <Image
                      src="/logo.png"
                      alt="Nova Logo"
                      fill
                      quality={100}
                      className="object-contain"
                      priority
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Nova Plus</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Separator
            color="#202037"
            orientation="vertical"
            unit="fixed"
            className="hidden xl:block"
            fixedHeight={16}
          />
          <nav
            className={cn(
              "hidden items-center justify-start gap-x-3 xl:flex",
              isBoarding && "gap-x-0",
            )}
          >
            {(navigationLinks || [])?.map((link, index) => (
              <NavLink
                link={link}
                key={index + "-" + link.label}
                prefetch
                scroll={false}
              />
            ))}
          </nav>
        </div>

        <div className="flex w-auto items-center justify-end gap-x-2">
          <QuickClipboard
            parentClassName="flex relative right-0 top-0 translate-y-0"
            wrapperClassName="h-8 pr-1"
          />

          <WhatsNewButton />

          <div className="hidden xl:flex">
            <GlobalSearchModal />
          </div>

          <UserWallet />

          {/* <div className="hidden xl:flex">
            <Notifications />
          </div> */}

          <UserEarningLevel />
          <UserAccount />

          {/*<MobileNav />*/}
        </div>
      </div>

      {/* Bonding Curv, Prior Fee, and Bribe Fee */}
      {/* <FeeSummary variant="header" /> */}
    </header>
  );
}

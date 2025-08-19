import Image from "next/image";
import { ColorPicker } from "../../ColorPicker";
import { useEffect, useState } from "react";
import { useLocalStorage } from "react-use";
import { PopoverClose } from "@radix-ui/react-popover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BaseButton from "../../buttons/BaseButton";
import {
  ColorType,
  useWalletTrackerColor,
} from "@/stores/wallet/use-wallet-tracker-color.store";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IColor = {
  label: string;
  default: string;
  onSelected: (color: string) => void;
};

type WalletCustomizeColorFormProps = {
  handleClose: () => void;
};

type WalletCustomizeColorPopoverProps = {
  buttonVariant?: "default" | "plain";
};

type ColorFieldProps = {
  color: IColor;
  savedColors?: string[];
  onSaveColor: (color: string) => void;
};

const WalletCustomizeColorForm = ({
  handleClose,
}: WalletCustomizeColorFormProps) => {
  const { colors, setColor, resetColors } = useWalletTrackerColor();
  const [selectedColors, setSelectedColors] =
    useState<Record<ColorType, string>>(colors);
  const [savedColors, setSavedColors] = useLocalStorage<string[]>(
    "nova-saved-wallet-tracker-colors",
    [],
  );

  const colorFields: IColor[] = [
    {
      label: "Token",
      default: colors[ColorType.TOKEN],
      onSelected: (color) =>
        setSelectedColors((prev) => ({
          ...prev,
          [ColorType.TOKEN]: color,
        })),
    },
    {
      label: "Wallet Name",
      default: colors[ColorType.WALLET_NAME],
      onSelected: (color) =>
        setSelectedColors((prev) => ({
          ...prev,
          [ColorType.WALLET_NAME]: color,
        })),
    },
    {
      label: "Amount (Buy)",
      default: colors[ColorType.AMOUNT_BUY],
      onSelected: (color) =>
        setSelectedColors((prev) => ({
          ...prev,
          [ColorType.AMOUNT_BUY]: color,
        })),
    },
    {
      label: "Amount (Sell)",
      default: colors[ColorType.AMOUNT_SELL],
      onSelected: (color) =>
        setSelectedColors((prev) => ({
          ...prev,
          [ColorType.AMOUNT_SELL]: color,
        })),
    },
    {
      label: "Market Cap (Buy)",
      default: colors[ColorType.MARKET_CAP_BUY],
      onSelected: (color) =>
        setSelectedColors((prev) => ({
          ...prev,
          [ColorType.MARKET_CAP_BUY]: color,
        })),
    },
    {
      label: "Market Cap (Sell)",
      default: colors[ColorType.MARKET_CAP_SELL],
      onSelected: (color) =>
        setSelectedColors((prev) => ({
          ...prev,
          [ColorType.MARKET_CAP_SELL]: color,
        })),
    },
  ];

  function uniqueArray<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  const onSaveColor = (color: string) => {
    setSavedColors(uniqueArray([...(savedColors || []), color]));
  };

  const onSave = () => {
    Object.entries(selectedColors).forEach(([key, value]) => {
      setColor(Number(key), value);
    });

    handleClose();
  };

  const onReset = () => {
    resetColors();

    handleClose();
  };

  return (
    <>
      <div className="flex w-full items-center justify-start border-b border-border px-4 md:p-4">
        <h4 className="text-nowrap font-geistSemiBold text-[18px] text-fontColorPrimary">
          Customize Color
        </h4>

        {/* Close Component */}
        <PopoverClose className="ml-auto hidden cursor-pointer text-fontColorSecondary md:inline-block">
          <div className="relative aspect-square h-6 w-6 flex-shrink-0 duration-300 hover:opacity-70">
            <Image src="/icons/close.png" alt="Close Icon" fill />
          </div>
        </PopoverClose>
      </div>
      <div className="relative flex w-full flex-grow flex-col p-4 pt-0 md:pt-1">
        {colorFields?.map((e) => (
          <ColorField
            key={e.label}
            color={e}
            savedColors={savedColors}
            onSaveColor={onSaveColor}
          />
        ))}

        <div className="flex gap-x-2">
          <BaseButton variant="primary" className="mt-3 w-1/2" onClick={onSave}>
            Save
          </BaseButton>

          <BaseButton variant="gray" className="mt-3 w-1/2" onClick={onReset}>
            Reset
          </BaseButton>
        </div>
      </div>
    </>
  );
};

const ColorField = ({ color, onSaveColor, savedColors }: ColorFieldProps) => {
  const [openColorPopover, setOpenColorPopover] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color.default);

  useEffect(() => {
    if (color.onSelected) {
      color.onSelected(selectedColor);
    }
  }, [selectedColor]);

  return (
    <Popover open={openColorPopover} onOpenChange={setOpenColorPopover}>
      <>
        <div className="flex items-center justify-between border-b border-white/10 py-3">
          <span className="font-geistSemiBold text-sm text-white">
            {color.label}
          </span>
          <PopoverTrigger asChild>
            <div className="flex cursor-pointer items-center gap-2 rounded-md border border-white/20 px-2 py-1.5">
              <div
                className="h-5 w-5 rounded-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="w-16 text-center font-geistRegular text-sm uppercase text-white">
                {selectedColor.replace("#", "")}
              </span>
            </div>
          </PopoverTrigger>
        </div>
      </>
      <PopoverContent align="end" sideOffset={6} className="z-[1001]">
        <ColorPicker
          color={selectedColor}
          savedColors={savedColors || []}
          onChange={(color) => setSelectedColor(color.hex)}
          onSaveColor={onSaveColor}
        />
      </PopoverContent>
    </Popover>
  );
};

const WalletCustomizeColorPopover = ({
  buttonVariant = "default",
}: WalletCustomizeColorPopoverProps) => {
  const theme = useCustomizeTheme();
  const [openColorPopover, setOpenColorPopover] = useState<boolean>(false);

  return (
    <Popover open={openColorPopover} onOpenChange={setOpenColorPopover}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <div className="cursor-pointer">
                {buttonVariant === "default" && (
                  <BaseButton
                    variant="gray"
                    size="short"
                    className="size-[32px]"
                  >
                    <div className="relative z-30 aspect-square h-4 w-4 flex-shrink-0 text-fontColorSecondary">
                      <Image
                        src="/icons/wallet-tracker/table.svg"
                        alt="Wallet Manager Icon"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </BaseButton>
                )}

                {buttonVariant === "plain" && (
                  <div className="relative aspect-square h-5 w-5 duration-300 hover:opacity-70">
                    <Image
                      src="/icons/wallet-tracker/plain-table.svg"
                      alt="Wallet Manager Icon"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="z-[1000]">
            <p>Customize Color</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="z-[1000] flex h-[490px] flex-col border-2 border-border p-0 shadow-[0_0_20px_0_#000000]"
        style={theme.background2}
      >
        <WalletCustomizeColorForm
          handleClose={() => setOpenColorPopover(false)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default WalletCustomizeColorPopover;

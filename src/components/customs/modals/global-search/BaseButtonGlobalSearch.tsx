import { forwardRef } from "react";
import BaseButton from "../../buttons/BaseButton";
import Image from "next/image";

export const BaseButtonModalGlobalSearch = forwardRef<
  HTMLButtonElement,
  { setOpenDialog: (value: boolean) => void }
>(({ setOpenDialog }, ref) => {
  return (
    <BaseButton
      ref={ref}
      type="button"
      onClick={() => setOpenDialog(true)}
      variant="gray"
      size="long"
      className="flex h-8 w-8 items-center gap-x-2 bg-secondary pl-0 pr-0 focus:bg-white/[6%] min-[1750px]:w-auto min-[1750px]:px-2"
      prefixIcon={
        <div className="relative hidden aspect-square size-6 flex-shrink-0 min-[1750px]:block">
          <Image
            src="/icons/main-search.svg"
            alt="Main Search Logo"
            fill
            quality={100}
            className="object-contain"
          />
        </div>
      }
    >
      <div className="relative mx-auto block aspect-square size-5 flex-shrink-0 min-[1750px]:hidden">
        <Image
          src="/icons/main-search.svg"
          alt="Main Search Logo"
          fill
          quality={100}
          className="object-contain"
        />
      </div>
      <span className="hidden text-nowrap text-start font-geistRegular text-xs text-fontColorSecondary min-[1750px]:inline-block">
        Search by token or LP contract
      </span>
      <div className="hidden rounded-sm bg-[#FFFFFF]/[4%] p-[3px] font-geistRegular text-xs font-bold text-fontColorSecondary min-[1750px]:block">
        <div className="size-4">/</div>
      </div>
    </BaseButton>
  );
});

BaseButtonModalGlobalSearch.displayName = "BaseButtonModalGlobalSearch";

import React, { useCallback, useEffect, useState } from "react";
import { usePnlSettings } from "@/stores/use-pnl-settings.store";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import Separator from "@/components/customs/Separator";
import BaseButton from "@/components/customs/buttons/BaseButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/libraries/utils";

function PnLAddCustomImage() {
  const { handleSaveCustomImageCard, customImageCard } = usePnlSettings();

  const [error, setError] = useState<string | null>(null);
  const [errorName, setErrorName] = useState<string | null>(null);
  const [name, setName] = useState(customImageCard.name || "");
  const [uploadedImage, setUploadedImage] = useState(
    customImageCard.image || "",
  );
  const [isHovered, setIsHovered] = useState(false);
  const [openCustomize, setOpenCustomize] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];

    // Validate file size
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setUploadedImage(base64String);
      setError(null);
    };
    reader.readAsDataURL(uploadedFile);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: false,
  });

  useEffect(() => {
    if (customImageCard.image) {
      setUploadedImage(customImageCard.image);
    }

    if (customImageCard.name) {
      setName(customImageCard.name);
    }
  }, [customImageCard.image, customImageCard.name]);

  const handleSave = () => {
    const finalName = name.trim() !== "" ? name : "";
    const finalImage = uploadedImage !== "" ? uploadedImage : "";

    handleSaveCustomImageCard(finalImage, finalName);
    setOpenCustomize(false);
  };

  return (
    <Popover open={openCustomize} onOpenChange={setOpenCustomize}>
      <PopoverTrigger asChild>
        <div className="w-full text-right">
          <BaseButton
            type="button"
            onClick={() => setOpenCustomize(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            variant="rounded"
            className={cn(
              "relative items-center justify-between gap-x-1 overflow-hidden rounded-[23px] px-3 py-[5px] font-geistBold text-xs duration-100",
              openCustomize || isHovered
                ? "border border-[#DF74FF] bg-[#DF74FF14]"
                : "border border-border bg-white/[4%]",
            )}
          >
            <div className="relative aspect-square size-4 flex-shrink-0">
              <Image
                src={
                  openCustomize || isHovered
                    ? "/icons/customize-active.svg"
                    : "/icons/customize.svg"
                }
                alt="Table Config Icon"
                height={20}
                width={20}
                quality={50}
                className="object-contain"
              />
            </div>
            <span
              className={
                openCustomize || isHovered ? "text-[#DF74FF]" : "text-white"
              }
            >
              Customize
            </span>
          </BaseButton>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="relative z-[1000] h-auto w-[320px] flex-col border border-border bg-card p-0 shadow-[0_10px_20px_0_rgba(0,0,0,1)] lg:flex"
      >
        <div className="flex h-[56px] flex-row items-center justify-between border-b border-border p-3">
          <h4 className="font-geistSemiBold text-lg text-fontColorPrimary">
            Customize
          </h4>
          <button
            title="Close"
            onClick={() => setOpenCustomize((prev) => !prev)}
            className="relative aspect-square h-6 w-6 flex-shrink-0"
          >
            <Image
              src="/icons/close.png"
              alt="Close Icon"
              fill
              quality={100}
              className="object-contain"
            />
          </button>
        </div>

        <div className="flex w-full flex-col gap-y-2">
          <div className="flex w-full">
            <div className="flex w-full flex-col items-center justify-center gap-y-1 px-0">
              <>
                <div className="mb-3 mt-4 flex w-full items-center gap-x-3.5 px-3">
                  <div>
                    <div
                      {...getRootProps()}
                      className="flex size-[100px] cursor-pointer justify-center rounded-[8px] border border-dashed border-border text-center text-[#9191A4] transition-colors duration-200 hover:bg-white/[6%] hover:bg-opacity-10"
                    >
                      <input {...getInputProps()} />
                      {uploadedImage ? (
                        <div className="relative size-[100px]">
                          <button
                            type="button"
                            className="absolute right-1 top-1 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setError(null);
                              setUploadedImage("");
                            }}
                            aria-label="Remove image"
                          >
                            <Image
                              src="/icons/circle-close.svg"
                              alt="Remove"
                              width={24}
                              height={24}
                              className="pointer-events-none"
                            />
                          </button>
                          <Image
                            src={uploadedImage}
                            alt="Uploaded Image"
                            fill
                            className="rounded-[8px] object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center px-4">
                          <Image
                            src="/icons/upload.svg"
                            alt="Add Icon"
                            width={20}
                            height={20}
                            className="mb-2 object-contain"
                          />
                          <div className="text-xs">Upload Profile</div>
                        </div>
                      )}
                    </div>
                    {error && (
                      <div className="mt-2 text-xs text-red-500">{error}</div>
                    )}
                  </div>
                  <div className="text-xs text-[#9191A4]">
                    <div className="mb-2 text-xs text-[#9191A4]">
                      Recommended
                    </div>
                    <div className="pl-1.5">
                      <ul className="ml-[9px] list-disc pl-2">
                        <li>500x500px</li>
                        <li>PNG or JPG</li>
                        <li>Up to 10 MB</li>
                      </ul>
                    </div>
                  </div>
                </div>

             <div className="mb-3 w-full px-3">
               <label className="mb-1 block text-xs font-medium text-[#9191A4]">
                 Name
               </label>
               <Input
                 type="text"
                 value={name}
                 onFocus={() => setErrorName(null)}
                 onChange={(e) => {
                   const value = e.target.value;
                   if (value.length <= 20) setName(value);
                   if (value.length < 4 && value.length > 0) {
                     setErrorName("Name must be at least 4 characters.");
                   } else {
                     setErrorName(null);
                   }
                 }}
                 className="h-10 border border-border placeholder:text-fontColorSecondary focus:outline-none xl:h-[36px]"
                 placeholder="Name"
               />
               {errorName && (
                 <div className="mt-2 text-xs text-red-500">{errorName}</div>
               )}
             </div>
              </>

              <Separator />
              <div className="mb-1 w-full px-3 py-2">
                <BaseButton
                  type="button"
                  onClick={handleSave}
                  variant="primary"
                  className="h-8 w-full px-10"
                  disabled={
                    uploadedImage === "" &&
                    name.trim() === "" &&
                    !customImageCard.image &&
                    !customImageCard.name
                  }
                >
                  <span className="text-sm">Save</span>
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default PnLAddCustomImage;

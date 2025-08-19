import React, { useCallback, useState } from "react";
import Image from "next/image";
import { usePnlSettings } from "@/stores/use-pnl-settings.store";
import { useDropzone } from "react-dropzone";

function PnLCustomImage({ defaultTemplate }: { defaultTemplate: string }) {
  const [error, setError] = useState<string | null>(null);

  const {
    customPnlCardBackground,
    selectedBackgroundPnlCard,
    handleSelectedBackgroundPnlCard,
    handleAddCustomPnlCardBackground,
    handleDeleteCustomPnlCardBackground,
  } = usePnlSettings();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];

    // Validate file size
    if (uploadedFile.size > 1024 * 1024) {
      setError("File size must be under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      handleAddCustomPnlCardBackground(base64String);
      setError(null);
    };
    reader.readAsDataURL(uploadedFile);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/gif": [".gif"] },
    multiple: false,
  });

  return (
    <div className="flex w-full items-center justify-center gap-x-3 p-3 pb-0">
      <div
        className={`relative h-[70px] w-[100px] overflow-hidden rounded-[8px] xl:h-[100px] xl:w-[150px] ${
          selectedBackgroundPnlCard === "" ? "border-2 border-primary" : ""
        }`}
        onClick={() => handleSelectedBackgroundPnlCard("")}
        style={{ cursor: "pointer" }}
      >
        <Image
          src={defaultTemplate}
          alt="Default Template"
          fill
          className="object-cover"
        />
      </div>

      {(customPnlCardBackground || [])?.length > 0 &&
        (customPnlCardBackground || [])?.map((image, index) => (
          <div
            key={index}
            className={`relative h-[70px] w-[100px] overflow-hidden rounded-[8px] xl:h-[100px] xl:w-[150px] ${
              selectedBackgroundPnlCard === image
                ? "border-2 border-primary"
                : ""
            }`}
            onClick={() => handleSelectedBackgroundPnlCard(image)}
            style={{ cursor: "pointer" }}
          >
            <button
              type="button"
              className="absolute right-1 top-1 z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomPnlCardBackground(image);
                handleSelectedBackgroundPnlCard("");
                setError(null);
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
              src={image}
              alt={`Custom Image ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}

      {customPnlCardBackground.length < 4 && (
        <div>
          <div
            {...getRootProps()}
            className="flex h-[70px] w-[100px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-border text-[#9191A4] transition-colors duration-200 hover:bg-white/[6%] hover:bg-opacity-10 xl:h-[100px] xl:w-[150px]"
          >
            <input {...getInputProps()} />
            <div className="relative mb-1 aspect-square size-8">
              <Image
                src="/icons/add.svg"
                alt="Add Icon"
                fill
                className="object-contain"
              />
            </div>
            <div className="font-geistRegular text-sm">Max 5 Images</div>
          </div>
          {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
        </div>
      )}
    </div>
  );
}

export default PnLCustomImage;

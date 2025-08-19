"use client";

import { Textarea } from "@/components/ui/textarea";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import BaseButton from "../../buttons/BaseButton";
import { NovaIconSVG, PinkCheckIconSVG } from "../../ScalableVectorGraphics";
import { useWalletTracker } from "@/hooks/use-wallet-tracker";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { cn } from "@/libraries/utils";

interface WalletUploadFileProps {
  onFileUpload: (result: string) => void;
}

export default function WalletImport() {
  const [input, setInput] = useState("");
  const [rebuild, setRebuild] = useState(1);
  const { updateWallet, isPending } = useWalletTracker();
  const { success, error: errorToast } = useCustomToast();

  const handleImport = () => {
    updateWallet(input, {
      onSuccess: (result) => {
        success(result);
        setInput("");
        setRebuild((prev) => prev + 1);
      },
      onError: (error, classname) =>
        errorToast(error, { className: classname }),
    });
  };

  return (
    <>
      <div className="absolute left-0 top-0 h-full w-[0.5px] bg-border"></div>
      <div className="flex flex-col gap-2">
        <WalletUploadFile
          key={rebuild}
          onFileUpload={(result) => setInput(result)}
        />

        <div className="flex flex-row items-center">
          <div className="h-[1px] w-full bg-border" />
          <p className="w-full text-center text-xs text-foreground">
            or enter manual
          </p>
          <div className="h-[1px] w-full bg-border" />
        </div>

        <div className="rounded-lg bg-secondary">
          <div className="flex w-full items-center justify-start border-b border-border p-4">
            <h4 className="text-nowrap font-geistMedium text-lg text-white xl:text-[18px]">
              Import Wallet
            </h4>
          </div>

          <div className="flex w-full flex-col">
            <div className="flex w-full flex-col gap-y-3 p-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Put your exported wallets here..."
                className={clsx(
                  "min-h-[200px] border border-border font-mono text-foreground focus:outline-none",
                  input.length > 0
                    ? "font-geistMonoRegular"
                    : "font-geistRegular",
                )}
              />
            </div>

            <div className="flex flex-col gap-2 p-4 text-foreground">
              <div className="flex flex-row items-center gap-2">
                <NovaIconSVG />
                <p>Nova supports wallet imports from:</p>
              </div>

              <div className="flex flex-row gap-3">
                <div className="flex flex-row items-center gap-2">
                  <PinkCheckIconSVG className="h-4 w-4" />
                  <p>BullX</p>
                </div>

                <div className="flex flex-row items-center gap-2">
                  <PinkCheckIconSVG className="h-4 w-4" />
                  <p>Axiom</p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-border p-4">
              <BaseButton
                variant="custom"
                className={cn(
                  "h-[32px] w-full max-xl:h-10",
                  "bg-[#DF74FF] hover:bg-[#DF74FF]/90",
                )}
                onClick={handleImport}
                disabled={isPending}
              >
                <span className="inline-block whitespace-nowrap font-geistMedium text-sm">
                  {isPending ? "Submitting..." : "Submit"}
                </span>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const WalletUploadFile = ({ onFileUpload }: WalletUploadFileProps) => {
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    // clear previous error
    setError(null);

    // Validate file size
    if (uploadedFile.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;

      if (typeof text === "string") {
        onFileUpload(text);
      }

      setFilename(uploadedFile.name);
    };
    reader.readAsText(uploadedFile);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"] },
    multiple: false,
  });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-secondary transition hover:border-gray-400"
      >
        <input {...getInputProps()} />
        {filename ? (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-[8px] bg-black bg-opacity-50">
            <p className="text-sm text-foreground">Click to change file</p>
            <p className="text-sm text-white">{filename}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-sm">
            <p className="text-white">
              Drag and drop your files here or
              <span className="font-medium text-purple-400"> Select File</span>
            </p>

            <p className="text-foreground">Maximum size: 5MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

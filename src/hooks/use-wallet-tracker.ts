import {
  TrackedWallet,
  updateTrackedWallets,
} from "@/apis/rest/wallet-tracker";
import { useWalletTrackerMessageStore } from "@/stores/footer/use-wallet-tracker-message.store";
import { isValidSolanaAddress } from "@/utils/walletValidation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ImportedWallet {
  name: string;
  address?: string;
  trackedWalletAddress?: string;
  emoji: string;
  tags?: string[];
}

export function useWalletTracker() {
  const queryClient = useQueryClient();

  const existingWallets = useWalletTrackerMessageStore(
    (state) => state.trackedWallets,
  );

  const getUniqueWalletName = (
    baseName: string,
    existingNames: string[],
  ): string => {
    let counter = 1;
    let newName = baseName;

    while (existingNames.includes(newName)) {
      newName = `${baseName}${counter}`;
      counter++;
    }

    return newName;
  };

  const updateWalletsMutation = useMutation({
    mutationFn: updateTrackedWallets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-tracker"] });
    },
  });

  const updateWallet = async (
    jsonInput: string,
    {
      onSuccess,
      onError,
    }: {
      onSuccess: (result: string) => void;
      onError: (error: string, classname?: string) => void;
    },
  ) => {
    try {
      // Preprocess JSON input to handle various JSON format issues
      let processedInput = jsonInput.trim();

      // Handle partial array fragments (objects separated by commas)
      if (!processedInput.startsWith("[") && !processedInput.startsWith("{")) {
        // Input might be invalid, we'll try to fix it later
      }
      // Handle array fragments that start with an object and have trailing commas
      else if (processedInput.startsWith("{")) {
        // Check if it's an incomplete array fragment with trailing comma
        if (processedInput.endsWith(",")) {
          processedInput = processedInput.slice(0, -1); // Remove trailing comma
        }

        // Wrap the object(s) in array brackets
        processedInput = `[${processedInput}]`;
      }
      // Handle proper arrays with trailing commas
      else if (processedInput.startsWith("[")) {
        // Clean up any trailing commas before the closing bracket
        if (processedInput.includes("},]")) {
          processedInput = processedInput.replace(/},]/g, "}]");
        }
      }

      // Try to parse, and if it fails, attempt additional corrections
      let importedWallets: ImportedWallet[];
      try {
        importedWallets = JSON.parse(processedInput);
      } catch (parseError) {
        // Advanced recovery for broken JSON formats

        // Try to handle comma-separated objects without brackets
        if (
          !processedInput.startsWith("[") &&
          !processedInput.startsWith("{")
        ) {
          // Check if it might be objects separated by newlines
          const potentialObjects = processedInput.split(/\n(?=\s*{)/);

          if (potentialObjects.length > 0) {
            // Join with commas and wrap in array brackets
            processedInput = `[${potentialObjects.join(",")}]`;

            // Remove any trailing commas inside the array
            processedInput = processedInput.replace(/,\s*]/g, "]");

            try {
              importedWallets = JSON.parse(processedInput);
            } catch (error) {
              throw new Error("Invalid JSON format");
            }
          } else {
            throw new Error("Invalid JSON format");
          }
        } else {
          // Try one more fix: handle multiple objects without commas between them
          // This turns "{...}{...}" into "[{...},{...}]"
          const objectPattern = /{[^{}]*}/g;
          const matches = processedInput.match(objectPattern);

          if (matches && matches.length > 0) {
            processedInput = `[${matches.join(",")}]`;
            try {
              importedWallets = JSON.parse(processedInput);
            } catch (error) {
              throw new Error("Invalid JSON format");
            }
          } else {
            throw new Error("Invalid JSON format");
          }
        }
      }

      // Ensure we're working with an array
      if (!Array.isArray(importedWallets)) {
        importedWallets = [importedWallets];
      }

      // Validate that each wallet includes the required fields and an emoji
      if ((importedWallets ?? [])?.some((w) => !w.emoji)) {
        throw new Error("Wallet should have emoji");
      }
      if (
        !(importedWallets ?? [])?.every(
          (w) => w.name && (w.address || w.trackedWalletAddress),
        )
      ) {
        throw new Error("Invalid JSON format");
      }

      // Validate addresses and collect invalid ones
      const invalidWallets: string[] = [];

      // First filter invalid addresses
      const validWallets = (importedWallets ?? [])?.filter((wallet) => {
        const address = wallet.address || wallet.trackedWalletAddress;

        if (!isValidSolanaAddress(address as string)) {
          invalidWallets.push(wallet.name);
          return false;
        }

        return true;
      });

      // Then transform the valid wallets to the correct format
      const normalizedWallets = (validWallets ?? [])?.map((wallet) => {
        const address = wallet.address || wallet.trackedWalletAddress;
        return {
          ...wallet,
          address: address,
          trackedWalletAddress: undefined,
        };
      });

      importedWallets = normalizedWallets;

      // Show error for invalid addresses
      if (invalidWallets.length > 0) {
        const message =
          invalidWallets.length === 1
            ? `Invalid address for wallet name: ${invalidWallets[0]}`
            : `Invalid addresses for wallet names: ${invalidWallets.join(", ")}`;

        onError(message);
      }

      // Convert to tracked wallet format
      const existingWalletsNames: string[] = [];
      const newWallets = (importedWallets ?? [])
        ?.map((w) => {
          const importedWalletsWithoutCurrent = (importedWallets ?? [])?.filter(
            (iw) =>
              !(
                iw.name === w.name &&
                iw.address === w.address &&
                iw.emoji === w.emoji
              ),
          );
          const existingAndImportedWallets = [
            ...existingWallets,
            ...importedWalletsWithoutCurrent,
          ];

          // Check for duplicate names
          const isExistName = (existingAndImportedWallets ?? [])?.some(
            (ew) => ew.name === w.name,
          );

          if (isExistName) {
            const uniqueName = getUniqueWalletName(
              w.name,
              (existingAndImportedWallets ?? [])?.map((ew) => ew.name),
            );
            w.name = uniqueName;
          }

          // Check for duplicate addresses
          const isExistAddress = (existingAndImportedWallets ?? [])?.some(
            (ew) => ew.address === w.address,
          );

          if (isExistAddress) {
            existingWalletsNames.push(w.name); // Store name instead of address
          }

          // Check for exact duplicates
          const oldImportedWallet = (existingWallets ?? [])?.filter(
            (ew) =>
              ew.address === w.address &&
              ew.emoji === w.emoji &&
              ew.name === w.name,
          );

          const isExistImportWallet = oldImportedWallet.length > 0;

          return isExistAddress || isExistImportWallet
            ? undefined
            : {
                name: w.name,
                address: w.address,
                emoji: w.emoji,
              };
        })
        ?.filter((w) => !!w) as TrackedWallet[];

      if (existingWalletsNames.length > 0) {
        onError(
          `Wallets with name ${existingWalletsNames.join(", ")} already exist`,
          "h-full",
        );
      }

      // Merge with existing wallets, avoiding duplicates
      if (newWallets.length === 0) return;
      const mergedWallets = [...existingWallets, ...newWallets];

      // Update wallets
      await updateWalletsMutation.mutateAsync(mergedWallets as TrackedWallet[]);

      onSuccess("Wallets imported successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid JSON format";

      onError(message);
    }
  };

  return { updateWallet, isPending: updateWalletsMutation.isPending };
}

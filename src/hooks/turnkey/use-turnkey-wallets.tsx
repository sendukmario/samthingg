import { getWallets, registerWallet, Wallet } from "@/apis/rest/wallet-manager";
import { useQuickAmountStore } from "@/stores/dex-setting/use-quick-amount.store";
import { useWalletTrackerStore } from "@/stores/footer/use-wallet-tracker.store";
import { useTurnkeyWalletsStore } from "@/stores/turnkey/use-turnkey-wallets.store";
import { useTurnkeyStore } from "@/stores/turnkey/use-turnkey.store";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { initializeTurnkeyClient } from "@/utils/turnkey/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { decryptCredentialBundle, decryptExportBundle, encryptPrivateKeyToBundle, generateP256KeyPair } from "@turnkey/crypto";
import { useEffect, useState } from "react";
import { TurnkeyClient } from "@turnkey/http";
import { handleWithdraw as withdraw } from "ts-keys";
import { useConnection } from "@solana/wallet-adapter-react";
import { useBlockhashStore } from "@/stores/use-blockhash.store";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import useAuth from "../use-auth";
import { useCustomToast } from "../use-custom-toast";
import * as solanaWeb3 from "@solana/web3.js";
const removeNotFoundWallets = ({
  currentWallts = [],
  existWallets = [],
  setCurrentWallets,
}: {
  currentWallts: Wallet[];
  setCurrentWallets: (walletList: Wallet[] | null) => void;
  existWallets: Wallet[];
}) => {
  const existWalletsAddresses = existWallets.filter((w) => !w.archived).map((wallet) => wallet.address);
  const fallbackWallet = existWallets.find((w) => w.selected) || existWallets?.[0];
  const filteredWallets = currentWallts?.filter((wallet) =>
    existWalletsAddresses.includes(wallet.address),
  );
  const finalWallets = filteredWallets.length > 0 ? filteredWallets : [fallbackWallet];
  if (filteredWallets.length !== currentWallts.length || filteredWallets.length === 0) {
    setCurrentWallets(finalWallets);
  }
};

const useTurnkeyWallets = (isMain?: boolean) => {
  const queryClient = useQueryClient();
  const { connection } = useConnection();
  const { blockhash } = useBlockhashStore();

  // --======================= WALLETS STATE📅 =======================--
  const {
    selectedMultipleActiveWallet,
    selectedMultipleActiveWalletBuySell,
    selectedMultipleActiveWalletCosmo,
    selectedMultipleActiveWalletHoldings,
    selectedMultipleActiveWalletSniper,
    selectedMultipleActiveWalletTrending,
    selectedMultipleActiveWalletToken,
    balance,
    setActiveWallet,
    setIsLoading,
    isLoading,
    setSelectedMultipleActiveWallet,
    setSelectedMultipleActiveWalletBuySell,
    setSelectedMultipleActiveWalletCosmo,
    setSelectedMultipleActiveWalletHoldings,
    setSelectedMultipleActiveWalletSniper,
    setSelectedMultipleActiveWalletTrending,
    setSelectedMultipleActiveWalletToken,
    setWalletFullList,
    setBalance
  } = useUserWalletStore();
  const { trackerWalletsQuick, setTrackerWalletsQuick } =
    useWalletTrackerStore();
  const { setCosmoWallets, cosmoWallets } =
    useQuickAmountStore();
  const {
    setEBundles,
    client,
    eBundlesSize,
    organizationId,
    setPkPb,
    getPkPb,
    getEBundles,
    setClient,
    pkBundle,
    bundle,
    eBundles,
    pbBundle
  } = useTurnkeyWalletsStore();
  const { user } = useTurnkeyStore()
  const { logOut } = useAuth();
  const { error: errorToast } = useCustomToast();

  const [generateWalletLoading, setGenerateWalletLoading] = useState(false);
  const [importWalletLoading, setImportWalletLoading] = useState(false);
  const [exportPivKeyLoading, setExportPivKeyLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false)


  // --======================= REINIT🗽 =======================--
  useEffect(() => {
    if (!Boolean(pkBundle &&
      bundle &&
      pbBundle)) return;
    const decryptedCredentials = decryptCredentialBundle(
      bundle!,
      pkBundle!,
    );

    const turnkeyClient = initializeTurnkeyClient({
      apiPrivateKey: decryptedCredentials,
      apiPublicKey: pbBundle!,
    });

    setClient(turnkeyClient!);
  }, [pkBundle,
    bundle,
    pbBundle])

  // --======================= GET WALLETS AND PRIVATE KEY🔑 =======================--
  const getEBundle = async (
    address: string,
    pbParam: string,
    privKeyId: string | undefined,
    client: TurnkeyClient | null,
  ): Promise<{
    address: string;
    exportBundle: string | null;
  }> => {
    if (!client?.exportWalletAccount) return { address, exportBundle: null }

    let exported: any;
    try {
      if (privKeyId) {
        exported = await client?.exportPrivateKey({
          organizationId: organizationId!,
          parameters: {
            privateKeyId: privKeyId,
            targetPublicKey: pbParam,
          },
          timestampMs: Date.now().toString(),
          type: "ACTIVITY_TYPE_EXPORT_PRIVATE_KEY",
        });
        if (!exported?.activity?.result?.exportPrivateKeyResult?.exportBundle) throw new Error("Pending export");
      } else {
        exported = await client?.exportWalletAccount({
          organizationId: organizationId!,
          parameters: {
            address: address as string,
            targetPublicKey: pbParam,
          },
          timestampMs: Date.now().toString(),
          type: "ACTIVITY_TYPE_EXPORT_WALLET_ACCOUNT",
        });
        if (!exported?.activity?.result?.exportWalletAccountResult?.exportBundle) throw new Error("Pending export");
      }
    } catch (error) {
      // Properly await the polling operation
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const finalExported = await client.getActivity({
          organizationId: organizationId!,
          activityId: exported?.activity?.id as string,
        });

        exported = finalExported;

        if ((!(exported?.activity?.result?.exportPrivateKeyResult?.exportBundle) && privKeyId) || (!(exported?.activity?.result?.exportWalletAccountResult?.exportBundle) && !privKeyId)) {
          console.error("Error exporting wallet:", error);
          throw new Error("Failed to export wallet account.");
        }
      } catch (pollError) {
        console.error("Error during polling:", pollError);
        throw new Error("Failed to export wallet account after polling.");
      }
    }

    return {
      address: address as string,
      exportBundle: (privKeyId ? exported?.activity?.result?.exportPrivateKeyResult?.exportBundle : exported?.activity?.result?.exportWalletAccountResult?.exportBundle) as string || null,
    };
  };

  const getWalletAccounts = async () => {
    const wallets = await getWallets()
    if (!wallets) return []

    const res = (wallets || [])?.map((wallet) => ({
      ...wallet,
      balance: String(balance[wallet.address] || "0"),
    }));
    setWalletFullList(res);

    const selectedWallet = (res || [])?.find((w) => w.selected) || res[0];
    if (!selectedWallet) return
    setActiveWallet(selectedWallet);
    // ########## Global🌐 ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: selectedMultipleActiveWallet ?? [],
      setCurrentWallets: setSelectedMultipleActiveWallet,
    });
    // ########## Cosmo3️⃣ ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: selectedMultipleActiveWalletCosmo ?? [],
      setCurrentWallets: setSelectedMultipleActiveWalletCosmo,
    });
    // ########## Trending3️⃣ ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: selectedMultipleActiveWalletTrending ?? [],
      setCurrentWallets: setSelectedMultipleActiveWalletTrending,
    });
    // ########## Holdings✊ ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: selectedMultipleActiveWalletHoldings ?? [],
      setCurrentWallets: setSelectedMultipleActiveWalletHoldings,
    });
    // ########## Token🪙 ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: selectedMultipleActiveWalletToken ?? [],
      setCurrentWallets: setSelectedMultipleActiveWalletToken,
    });
    // ########## BuySell🔄 ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: selectedMultipleActiveWalletBuySell ?? [],
      setCurrentWallets: setSelectedMultipleActiveWalletBuySell,
    });
    // ########## Sniper🎯 ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: selectedMultipleActiveWalletSniper ?? [],
      setCurrentWallets: setSelectedMultipleActiveWalletSniper,
    });
    // ########## Tracker🔍 ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: trackerWalletsQuick ?? [],
      setCurrentWallets: setTrackerWalletsQuick as any,
    });
    // ########## Cosmo3️⃣ ##########
    removeNotFoundWallets({
      existWallets: res,
      currentWallts: cosmoWallets ?? [],
      setCurrentWallets: setCosmoWallets as any,
    });
    return wallets
  }

  useQuery({
    queryKey: ["get-private-key", "wallets", client],
    queryFn: async () => {
      if (Boolean(!client)) return null;
      const embeddedKeyPair = generateP256KeyPair();
      const embeddedPK = embeddedKeyPair.privateKey;
      const embeddedUncompressedPB = embeddedKeyPair.publicKeyUncompressed;
      setPkPb(embeddedPK, embeddedUncompressedPB);
      const wallets = await getWalletAccounts();
      const privateKeyList = (await client?.getPrivateKeys({
        organizationId: organizationId!,
      }))?.privateKeys
      const getExportedBundle = async () => {
        const exportedWallets = await Promise.all(
          wallets?.map(async (wallet) => {
            try {
              const privateKeyId = privateKeyList?.find((pk) => pk.addresses[0]?.address === wallet.address)?.privateKeyId
              const result = await getEBundle(wallet.address, embeddedUncompressedPB, privateKeyId ? privateKeyId : undefined, client);
              return result.exportBundle ? result : null;
            } catch (error) {
              console.error("Error exporting wallet for", wallet.address, ":", error);
              return null;
            }
          }) || []
        );

        // Filter out failed exports if needed
        const validExportedWallets = exportedWallets.filter(wallet => wallet !== null);

        const newEBundles = new Map<string, string | null>(
          validExportedWallets.map((wallet) => [
            wallet.address as string,
            wallet.exportBundle ?? null,
          ]),
        );
        if (newEBundles.size > 0) {
          const res = (validExportedWallets || [])?.map((wallet, i) => {
            const currWallet = wallets?.find((w) => w.address === wallet.address);
            return {
              balance: String(balance[wallet.address] || "0"),
              address: wallet.address,
              selected: currWallet?.selected || false,
              name: currWallet?.name || `W${i + 1}`,
              archived: currWallet?.archived || false,
              hasExported: currWallet?.hasExported || false,
              createdAt: currWallet?.createdAt as number,
            }
          });
          setWalletFullList(res);

          const selectedWallet = (res || [])?.find((w) => w.selected) || res[0];
          if (!selectedWallet) return
          setActiveWallet(selectedWallet);
          // ########## Global🌐 ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: selectedMultipleActiveWallet ?? [],
            setCurrentWallets: setSelectedMultipleActiveWallet,
          });
          // ########## Cosmo3️⃣ ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: selectedMultipleActiveWalletCosmo ?? [],
            setCurrentWallets: setSelectedMultipleActiveWalletCosmo,
          });
          // ########## Trending3️⃣ ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: selectedMultipleActiveWalletTrending ?? [],
            setCurrentWallets: setSelectedMultipleActiveWalletTrending,
          });
          // ########## Holdings✊ ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: selectedMultipleActiveWalletHoldings ?? [],
            setCurrentWallets: setSelectedMultipleActiveWalletHoldings,
          });
          // ########## Token🪙 ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: selectedMultipleActiveWalletToken ?? [],
            setCurrentWallets: setSelectedMultipleActiveWalletToken,
          });
          // ########## BuySell🔄 ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: selectedMultipleActiveWalletBuySell ?? [],
            setCurrentWallets: setSelectedMultipleActiveWalletBuySell,
          });
          // ########## Sniper🎯 ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: selectedMultipleActiveWalletSniper ?? [],
            setCurrentWallets: setSelectedMultipleActiveWalletSniper,
          });
          // ########## Tracker🔍 ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: trackerWalletsQuick ?? [],
            setCurrentWallets: setTrackerWalletsQuick as any,
          });
          // ########## Cosmo3️⃣ ##########
          removeNotFoundWallets({
            existWallets: res,
            currentWallts: cosmoWallets ?? [],
            setCurrentWallets: setCosmoWallets as any,
          });
          setEBundles(newEBundles);
          setPkPb(
            embeddedPK,
            embeddedUncompressedPB,
          )
        }
        return newEBundles;
      };
      return await getExportedBundle();
    },
    staleTime: 0,

  })
  useEffect(() => {
    if (!isMain) return;
    setIsLoading(true);
  }, []);
  useEffect(() => {
    if (!isMain) return;
    let loadingTimeout: NodeJS.Timeout;
    if (!isLoading) {
      loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [isLoading]);

  // --======================= GENERATE WALLET🔑 =======================--
  const generateWallet = async (walletName: string): Promise<void> => {
    setGenerateWalletLoading(true);
    try {
      if (!organizationId) {
        errorToast("Organization ID not found, please login again");
        setGenerateWalletLoading(false);
        return;
      };

      // Get the list of existing wallets (assuming you have them cached in queryClient)
      const existingWallets = queryClient.getQueryData<any[]>(["wallets"]) || [];
      const nameExists = existingWallets.some(
        (wallet) => wallet.name?.trim().toLowerCase() === walletName.trim().toLowerCase()
      );

      if (nameExists) {
        errorToast(`A wallet with the name "${walletName}" already exists`);
        setGenerateWalletLoading(false);
        throw new Error("Wallet name already exists");
      }

      const resTk = await client?.createWallet({
        type: "ACTIVITY_TYPE_CREATE_WALLET",
        timestampMs: String(Date.now()),
        organizationId: organizationId,
        parameters: {
          walletName,
          accounts: [
            {
              curve: "CURVE_ED25519",
              pathFormat: "PATH_FORMAT_BIP32",
              path: "m/44'/501'/0'/0'",
              addressFormat: "ADDRESS_FORMAT_SOLANA",
            },
          ],
        },
      });
      const walletId = resTk?.activity?.result?.createWalletResult?.walletId
      const walletAddress = resTk?.activity?.result?.createWalletResult?.addresses?.[0]

      // make sure turnkey successfully created wallet
      if (!walletId || !walletAddress) throw new Error("Failed to create wallet");

      await registerWallet({
        address: walletAddress,
        name: walletName,
      })
      queryClient.refetchQueries({
        queryKey: ["wallets"],
      });
      queryClient.refetchQueries({
        queryKey: ["wallets-balance"],
      });
    } catch (error) {
      console.error("Error generating wallet:", error);
      throw new Error("Failed to generate wallet.");
    } finally {
      setGenerateWalletLoading(false);
    }
  };

  // --======================= IMPORT WALLET⬆️ =======================--
  const importWallet = async ({
    privateKey: privKeyParam,
    privateKeyName,
  }: { privateKeyName: string, privateKey: string }): Promise<void> => {
    const privateKey = privKeyParam.trim()
    setImportWalletLoading(true);

    if (!organizationId) {
      errorToast("Organization ID not found, please login again")
      setImportWalletLoading(false);
      return;
    }

    if (!user?.userId) {
      errorToast("User ID not found, please login again")
      setImportWalletLoading(false);
      return;
    }

    try {
      // First, initialize the import process
      const initResult = await client?.initImportPrivateKey({
        type: "ACTIVITY_TYPE_INIT_IMPORT_PRIVATE_KEY",
        timestampMs: String(Date.now()),
        organizationId: organizationId,
        parameters: {
          userId: user?.userId, // You'll need the user ID
        },
      });

      if (!initResult?.activity?.result?.initImportPrivateKeyResult?.importBundle) {
        errorToast("Failed to import wallet")
        setImportWalletLoading(false);
        return;
      }

      // Then encrypt the private key using the import bundle
      const encryptedBundle = await encryptPrivateKeyToBundle({
        privateKey,
        keyFormat: "SOLANA", // or "solana" for Solana keys
        importBundle: initResult?.activity?.result?.initImportPrivateKeyResult?.importBundle,
        userId: user?.userId,
        organizationId: organizationId,
      });

      try {
        // Finally, import the encrypted private key
        const importResult = await client?.importPrivateKey({
          type: "ACTIVITY_TYPE_IMPORT_PRIVATE_KEY",
          timestampMs: String(Date.now()),
          organizationId: organizationId,
          parameters: {
            userId: user?.userId,
            privateKeyName,
            encryptedBundle,
            curve: "CURVE_ED25519", // Use CURVE_SECP256K1 for Ethereum
            addressFormats: ["ADDRESS_FORMAT_SOLANA"], // Use ADDRESS_FORMAT_ETHEREUM for Ethereum
          },
        });

        const walletAddress = importResult?.activity?.result?.importPrivateKeyResult?.addresses?.[0].address

        if (walletAddress) {
          await registerWallet({
            address: walletAddress,
            name: privateKeyName,
          });
          queryClient.refetchQueries({
            queryKey: ["wallets"],
          });
        } else {
          console.error("No wallet address returned from import.");
          throw new Error("No wallet address returned from import.");
        }
      } catch (error) {
        console.error("Error importing private key:", error, JSON.stringify(error), JSON.stringify(error).includes(`"code":6`));
        if (JSON.stringify(error).includes(`"code":6`)) {
          try {
            let secretKeyBytes: Uint8Array;
            
            // Handle different private key formats
            if (typeof privateKey === 'string') {
              // Try base58 decode first (most common format)
              try {
                secretKeyBytes = bs58.decode(privateKey);
              } catch {
                // If base58 fails, try parsing as comma-separated numbers
                try {
                  const keyArray = privateKey.replace(/[\[\]]/g, '').split(',').map(num => parseInt(num.trim()));
                  secretKeyBytes = new Uint8Array(keyArray);
                } catch {
                  // If that fails, try hex decode
                  if (privateKey.startsWith('0x')) {
                    const hex = privateKey.slice(2);
                    secretKeyBytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
                  } else {
                    throw new Error("Invalid private key format");
                  }
                }
              }
            } else if (Array.isArray(privateKey)) {
              secretKeyBytes = new Uint8Array(privateKey);
            } else {
              throw new Error("Unsupported private key type");
            }

            // Validate the secret key size
            if (secretKeyBytes.length !== 64 && secretKeyBytes.length !== 32) {
              throw new Error(`Invalid secret key size: ${secretKeyBytes.length}. Expected 32 or 64 bytes.`);
            }

            // If it's 32 bytes, we need to derive the full 64-byte keypair
            const walletAddressTuple = secretKeyBytes.length === 32 
              ? solanaWeb3.Keypair.fromSeed(secretKeyBytes)
              : solanaWeb3.Keypair.fromSecretKey(secretKeyBytes);
              
            const walletAddress = walletAddressTuple.publicKey.toBase58();
            
            await registerWallet({
              address: walletAddress,
              name: privateKeyName,
            });
            queryClient.refetchQueries({
              queryKey: ["wallets"],
            });
          } catch (parseError) {
            console.error("Error parsing private key:", parseError);
            throw new Error("Invalid private key format. Please ensure you're using a valid Solana private key.");
          }
        } else {
          throw new Error("Failed to import private key.");
        }
      }

    } catch (error: any) {
      console.error("Error importing private key:", error);
      if (JSON.stringify(error).includes("Failed to register wallet.")) throw new Error("Failed to register wallet.");
      throw new Error("Failed to import private key.");
    } finally {
      setImportWalletLoading(false);
    }
  };

  const exportWallet = async (walletAddress: string): Promise<string | null> => {
    try {
      setExportPivKeyLoading(true);
      const { pk } = await getPkPb();
      const eBundle = await getEBundles();
      const privateKeyWallet = await decryptExportBundle({
        exportBundle: eBundle.get(walletAddress as string)!,
        embeddedKey: pk,
        organizationId: organizationId!,
        returnMnemonic: false,
        keyFormat: "SOLANA",
      });
      return privateKeyWallet;
    } catch (error) {
      console.error("Error exporting wallet:", error);

      // remove wallet from list if export fails
      // setWalletFullList((prev) => prev.filter((w) => w.address !== walletAddress));
      throw new Error("Failed to export wallet.");
    } finally {
      setExportPivKeyLoading(false);
    }
  }

  const handleWithdraw = async ({
    amount,
    recipient,
    walletAddress,
    max,
  }: { walletAddress: string, amount: number, recipient: string, max: boolean }) => {
    if (!walletAddress || !amount || !recipient) {
      throw new Error("Invalid parameters for withdrawal.");
    }
    try {
      setWithdrawLoading(true);
      const { pk } = await getPkPb();
      const eBundle = await getEBundles();
      const privateKeyWallet = await decryptExportBundle({
        exportBundle: eBundle.get(walletAddress)!,
        embeddedKey: pk,
        organizationId: organizationId!,
        returnMnemonic: false,
        keyFormat: "SOLANA",
      });
      const secretKeyBytes = bs58.decode(privateKeyWallet); // ← This gives you real bytes
      const signer = Keypair.fromSecretKey(
        Uint8Array.from(secretKeyBytes),
        { skipValidation: true },
      );
      const signedTx = await withdraw(
        connection,
        blockhash!,
        signer,
        new PublicKey(recipient),
        amount,
        max
      );
      return signedTx;
    } catch (error) {
      console.error("Error withdrawing from wallet:", error);
      throw new Error("Failed to withdraw from wallet.");
    } finally {
      setWithdrawLoading(false);
    }
  }

  return {
    exportWallet,
    exportPivKeyLoading,
    importWallet,
    importWalletLoading,
    generateWallet,
    generateWalletLoading,
    getEBundle,
    handleWithdraw,
    withdrawLoading,
  }
}

export default useTurnkeyWallets;

import { useLutStore } from "@/stores/use-lut.store";
import { getLUT, JUP_LUT_ADDRESS } from "@/utils/lut/lut"
import { useConnection } from "@solana/wallet-adapter-react";
import * as solana from "@solana/web3.js"
import bs58 from "bs58";
import { useEffect } from "react";

const useLut = () => {
  const {
    setLut
  } = useLutStore()
  const connection = useConnection().connection

  useEffect(() => {
    const fetchLUT = async () => {
      const lutAccount = await getLUT(
        connection,
        JUP_LUT_ADDRESS,
      )
      if (!lutAccount) {
        console.error("Failed to fetch LUT account");
        return;
      }
      console.warn("💵 LUT Account:", lutAccount);
      setLut(lutAccount);
    }
    fetchLUT().catch((error) => {
      console.error("💵Error fetching LUT:", error);
    });
  }, [])
}

export default useLut
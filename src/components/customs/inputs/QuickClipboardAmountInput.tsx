"use client";

import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/libraries/utils";
import { useQuickClipboardAmountStore } from "@/stores/use-quick-clipboard-amount.store";
import Image from "next/image";
import { FaPen } from "react-icons/fa";

const QuickClipboardAmountInput = () => {
  const { quickClipboardAmount, setQuickClipboardAmount } = useQuickClipboardAmountStore();
  const [displayValue, setDisplayValue] = useState(quickClipboardAmount.toString());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(quickClipboardAmount.toString());
  }, [quickClipboardAmount]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setDisplayValue(value);
      const newAmount = parseFloat(value);
      if (!isNaN(newAmount)) {
        setQuickClipboardAmount(newAmount);
      }
    }
  };

  const handleBlur = () => {
    const newAmount = parseFloat(displayValue);
    if (isNaN(newAmount) || newAmount <= 0) {
      setQuickClipboardAmount(quickClipboardAmount);
      setDisplayValue(quickClipboardAmount.toString());
    } else {
      setQuickClipboardAmount(newAmount);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button onClick={() => setIsEditing(true)} className="w-[26px] h-[26px] p-[7px] rounded-full hover:bg-white/[12%] transition-colors">
        <FaPen className="text-white text-xs" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center">
      <Image
        src={"/icons/solana.svg"}
        alt="solana"
        width={12}
        height={12}
        className="absolute left-3 z-10"
      />
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          "border-quaternary h-[24px] w-[90px] rounded-md border bg-transparent pl-7 pr-2 text-xs text-white transition-all duration-300 ease-in-out focus:border-blue-500 focus:ring-0",
        )}
        placeholder="Amount"
      />
    </div>
  );
};

export default QuickClipboardAmountInput;

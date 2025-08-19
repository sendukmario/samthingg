import { Input } from "@/components/ui/input";
import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { cn } from "@/libraries/utils";

import { SearchIcon } from "lucide-react";
import React from "react";

interface WalletTradeSearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const WalletTradeSearchInput: React.FC<WalletTradeSearchInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
}) => {
  const theme = useCustomizeTheme();
  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fontColorSecondary" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        className="focus:ring-grey-500 h-9 rounded-lg border-border pl-9 focus:ring-1"
        style={{ backgroundColor: theme.background.backgroundColor }}
      />
    </div>
  );
};

export default WalletTradeSearchInput;

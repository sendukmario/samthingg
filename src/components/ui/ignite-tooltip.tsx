import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface IgniteTooltipProps {
  label: string;
  icon?: React.ReactElement;
  children: React.ReactElement;
}

const IgniteTooltip: React.FC<IgniteTooltipProps> = ({
  label,
  children,
  icon,
}) => (
  <TooltipProvider>
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        showTriangle={false}
        sideOffset={10}
        className="!border-none !bg-transparent !p-0 !shadow-none"
      >
        <div className="gb__white__tooltip flex min-w-fit flex-col items-center justify-center gap-1 rounded-[8px] border border-[#242436] bg-[#272730] p-3 text-center shadow-[0_10px_20px_0_#000]">
          <div className="flex w-fit items-center justify-start gap-1">
            <span className="font-geist text-nowrap text-center text-[12px] font-semibold leading-4 text-fontColorPrimary">
              {label}
            </span>
            {icon}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default IgniteTooltip;

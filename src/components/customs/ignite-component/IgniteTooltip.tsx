const IgniteTooltip: React.FC = () => {
  return (
    <div className="absolute z-10 flex items-center gap-2 rounded-md bg-[#2A2A3E] px-3 py-2 text-sm text-white shadow-lg">
      {/* Icon */}
      <div className="flex h-5 w-5 items-center justify-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2L6.5 6H2L5.5 8.5L4 12L8 10L12 12L10.5 8.5L14 6H9.5L8 2Z"
            fill="#9191A4"
          />
        </svg>
      </div>

      {/* Text */}
      <span className="whitespace-nowrap font-medium text-[#E1E1E6]">
        Dev holding
      </span>

      {/* Arrow pointing down */}
      <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#2A2A3E]"></div>
    </div>
  );
};

export default IgniteTooltip;

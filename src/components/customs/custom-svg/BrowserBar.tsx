import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { useMemo } from "react";

export default function BrowserBar() {
  const theme = useCustomizeTheme();

  const customizedSettingPresets = useCustomizeSettingsStore(
    (state) => state.presets,
  );

  const customizedSettingActivePreset = useCustomizeSettingsStore(
    (state) => state.activePreset,
  );

  const currentTheme = useMemo(
    () =>
      customizedSettingPresets[customizedSettingActivePreset].themeSetting ||
      "original",
    [customizedSettingPresets, customizedSettingActivePreset],
  );

  const fillColorByTheme: Record<string, string> = {
    original: "#0C0F12",
    "solid-light": "#1A1A25",
    "gradient-light": "#1A1A25",
    "solid-even-lighter": "#262634",
    "gradient-even-lighter": "#262634",
    cupsey: "#262634",
  };

  return (
    <svg
      width="535"
      height="53"
      viewBox="0 0 535 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 10C0 4.47715 4.47715 0 10 0H1430C1435.52 0 1440 4.47715 1440 10V53H0V10Z"
        fill={theme.background2 as string}
      />
      <g clip-path="url(#clip0_87_8880)">
        <path
          d="M153.264 32.9878L146.682 26.563C146.524 26.4053 146.441 26.2144 146.441 26.0068C146.441 25.791 146.532 25.5835 146.69 25.4507L153.264 19.0176C153.405 18.8765 153.588 18.7935 153.804 18.7935C154.235 18.7935 154.559 19.1255 154.559 19.5571C154.559 19.7563 154.476 19.9556 154.343 20.0967L148.3 26.0068L154.343 31.917C154.476 32.0581 154.559 32.249 154.559 32.4565C154.559 32.8882 154.235 33.2119 153.804 33.2119C153.588 33.2119 153.405 33.1289 153.264 32.9878Z"
          fill="#999C9F"
        />
        <path
          d="M180.196 33.2202C180.412 33.2202 180.595 33.1372 180.736 32.9961L187.318 26.563C187.476 26.4053 187.559 26.2144 187.559 26.0068C187.559 25.791 187.476 25.5918 187.318 25.4507L180.744 19.0259C180.595 18.8765 180.412 18.7935 180.196 18.7935C179.765 18.7935 179.441 19.1255 179.441 19.5571C179.441 19.7563 179.524 19.9556 179.657 20.0967L185.7 26.0068L179.657 31.917C179.524 32.0581 179.441 32.249 179.441 32.4565C179.441 32.8882 179.765 33.2202 180.196 33.2202Z"
          fill="#3D4043"
        />
      </g>
      <path
        d="M101.32 33.6602H115.68C117.423 33.6602 118.287 32.7969 118.287 31.0869V20.9517C118.287 19.2417 117.423 18.3784 115.68 18.3784H101.32C99.585 18.3784 98.7134 19.2334 98.7134 20.9517V31.0869C98.7134 32.8052 99.585 33.6602 101.32 33.6602ZM101.336 32.3237C100.506 32.3237 100.05 31.8838 100.05 31.0205V21.0181C100.05 20.1548 100.506 19.7148 101.336 19.7148H105.039V32.3237H101.336ZM115.664 19.7148C116.485 19.7148 116.95 20.1548 116.95 21.0181V31.0205C116.95 31.8838 116.485 32.3237 115.664 32.3237H106.342V19.7148H115.664ZM103.437 22.7944C103.694 22.7944 103.91 22.5703 103.91 22.3296C103.91 22.0806 103.694 21.8647 103.437 21.8647H101.66C101.411 21.8647 101.187 22.0806 101.187 22.3296C101.187 22.5703 101.411 22.7944 101.66 22.7944H103.437ZM103.437 24.9443C103.694 24.9443 103.91 24.7202 103.91 24.4712C103.91 24.2222 103.694 24.0146 103.437 24.0146H101.66C101.411 24.0146 101.187 24.2222 101.187 24.4712C101.187 24.7202 101.411 24.9443 101.66 24.9443H103.437ZM103.437 27.0859C103.694 27.0859 103.91 26.8784 103.91 26.6294C103.91 26.3804 103.694 26.1646 103.437 26.1646H101.66C101.411 26.1646 101.187 26.3804 101.187 26.6294C101.187 26.8784 101.411 27.0859 101.66 27.0859H103.437Z"
        fill="#999C9F"
      />
      <g filter="url(#filter0_i_87_8880)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M27 32C30.3137 32 33 29.3137 33 26C33 22.6863 30.3137 20 27 20C23.6863 20 21 22.6863 21 26C21 29.3137 23.6863 32 27 32Z"
          fill="#EE6A5F"
        />
      </g>
      <path
        d="M27 20.25C30.1756 20.25 32.75 22.8244 32.75 26C32.75 29.1756 30.1756 31.75 27 31.75C23.8244 31.75 21.25 29.1756 21.25 26C21.25 22.8244 23.8244 20.25 27 20.25Z"
        stroke="#CE5347"
        stroke-width="0.5"
      />
      <g filter="url(#filter1_i_87_8880)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M47 32C50.3137 32 53 29.3137 53 26C53 22.6863 50.3137 20 47 20C43.6863 20 41 22.6863 41 26C41 29.3137 43.6863 32 47 32Z"
          fill="#F5BD4F"
        />
      </g>
      <path
        d="M47 20.25C50.1756 20.25 52.75 22.8244 52.75 26C52.75 29.1756 50.1756 31.75 47 31.75C43.8244 31.75 41.25 29.1756 41.25 26C41.25 22.8244 43.8244 20.25 47 20.25Z"
        stroke="#D6A243"
        stroke-width="0.5"
      />
      <g filter="url(#filter2_i_87_8880)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M67 32C70.3137 32 73 29.3137 73 26C73 22.6863 70.3137 20 67 20C63.6863 20 61 22.6863 61 26C61 29.3137 63.6863 32 67 32Z"
          fill="#61C454"
        />
      </g>
      <path
        d="M67 20.25C70.1756 20.25 72.75 22.8244 72.75 26C72.75 29.1756 70.1756 31.75 67 31.75C63.8244 31.75 61.25 29.1756 61.25 26C61.25 22.8244 63.8244 20.25 67 20.25Z"
        stroke="#58A942"
        stroke-width="0.5"
      />
      <g clip-path="url(#clip1_87_8880)">
        <path
          d="M399 34.6147C399.133 34.6147 399.349 34.5649 399.556 34.4487C404.279 31.8008 405.898 30.6802 405.898 27.6504V21.3003C405.898 20.4287 405.524 20.1548 404.819 19.856C403.839 19.4492 400.677 18.312 399.697 17.9717C399.473 17.897 399.232 17.8472 399 17.8472C398.768 17.8472 398.527 17.9136 398.311 17.9717C397.332 18.2539 394.161 19.4575 393.181 19.856C392.484 20.1465 392.102 20.4287 392.102 21.3003V27.6504C392.102 30.6802 393.729 31.7925 398.444 34.4487C398.66 34.5649 398.867 34.6147 399 34.6147ZM399.332 19.2583C400.585 19.7563 403.018 20.6362 404.304 21.0762C404.528 21.1592 404.578 21.2754 404.578 21.5576V27.3433C404.578 29.9082 403.35 30.5806 399.515 32.9131C399.274 33.0625 399.141 33.104 399.008 33.1123V19.1836C399.091 19.1836 399.199 19.2085 399.332 19.2583Z"
          fill="#999C9F"
        />
        <rect
          x="424.5"
          y="12"
          width="591"
          height="28"
          rx="6"
          fill={fillColorByTheme[currentTheme] ?? ""}
        />
      </g>
      <defs>
        <filter
          id="filter0_i_87_8880"
          x="21"
          y="20"
          width="12"
          height="12"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.92549 0 0 0 0 0.427451 0 0 0 0 0.384314 0 0 0 1 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_87_8880"
          />
        </filter>
        <filter
          id="filter1_i_87_8880"
          x="41"
          y="20"
          width="12"
          height="12"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.960784 0 0 0 0 0.768627 0 0 0 0 0.317647 0 0 0 1 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_87_8880"
          />
        </filter>
        <filter
          id="filter2_i_87_8880"
          x="61"
          y="20"
          width="12"
          height="12"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.407843 0 0 0 0 0.8 0 0 0 0 0.345098 0 0 0 1 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_87_8880"
          />
        </filter>
        <clipPath id="clip0_87_8880">
          <rect
            width="66"
            height="28"
            fill="white"
            transform="translate(134 12)"
          />
        </clipPath>
        <clipPath id="clip1_87_8880">
          <rect
            width="675"
            height="28"
            fill="white"
            transform="translate(382.5 12)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

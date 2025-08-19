import { ThemeSetting } from "@/apis/rest/settings/settings";
import { useCustomizeSettingsStore } from "@/stores/setting/use-customize-settings.store";
import { CSSProperties, useEffect, useState } from "react";

type IThemeColor = {
  background: CSSProperties;
  backgroundCosmo: CSSProperties;
  background2: CSSProperties;
  cosmoCard1: {
    header: CSSProperties;
    content: CSSProperties;
  };
  cosmoCard2: {
    header: CSSProperties;
    content: CSSProperties;
  };
  cosmoCardDiscord1: {
    header: CSSProperties;
    content: CSSProperties;
  };
  cosmoCardDiscord2: {
    header: CSSProperties;
    content: CSSProperties;
  };
};

const colors: Record<ThemeSetting, IThemeColor> = {
  original: {
    background: { backgroundColor: "#080811" },
    backgroundCosmo: { backgroundColor: "#080811" },
    background2: { backgroundColor: "#080811" },
    cosmoCard1: {
      header: { backgroundColor: "#1A1A23" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #1A1A23, #080811)",
        backgroundColor: "#080811",
      },
    },
    cosmoCard2: {
      header: { backgroundColor: "#1A1A23" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #1A1A23, #080811)",
        backgroundColor: "#080811",
      },
    },
    cosmoCardDiscord1: {
      header: { backgroundColor: "#191922" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #191922, #080811)",
      },
    },
    cosmoCardDiscord2: {
      header: { backgroundColor: "#191922" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #191922, #080811)",
      },
    },
  },
  "solid-light": {
    background: { backgroundColor: "#12121A" },
    backgroundCosmo: { backgroundColor: "#12121A" },
    background2: { backgroundColor: "#12121A" },
    cosmoCard1: {
      header: { backgroundColor: "#1D1D2D" },
      content: { backgroundColor: "#1D1D2D" },
    },
    cosmoCard2: {
      header: { backgroundColor: "#191927" },
      content: { backgroundColor: "#191927" },
    },
    cosmoCardDiscord1: {
      header: { backgroundColor: "#242436" },
      content: { backgroundColor: "#242436" },
    },
    cosmoCardDiscord2: {
      header: { backgroundColor: "#161620" },
      content: { backgroundColor: "#161620" },
    },
  },
  "gradient-light": {
    background: { backgroundColor: "#12121A" },
    backgroundCosmo: { backgroundColor: "#12121A" },
    background2: { backgroundColor: "#12121A" },
    cosmoCard1: {
      header: { backgroundColor: "#1F1F2F" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #1F1F2F, #12121A)",
        backgroundColor: "#12121A",
      },
    },
    cosmoCard2: {
      header: { backgroundColor: "#1F1F2F" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #1F1F2F, #12121A)",
        backgroundColor: "#12121A",
      },
    },
    cosmoCardDiscord1: {
      header: { backgroundColor: "#191922" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #191922, #080811)",
      },
    },
    cosmoCardDiscord2: {
      header: { backgroundColor: "#191922" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #191922, #080811)",
      },
    },
  },
  "solid-even-lighter": {
    background: { backgroundColor: "#1F1F2B" },
    backgroundCosmo: { backgroundColor: "#1F1F2B" },
    background2: { backgroundColor: "#1F1F2B" },
    cosmoCard1: {
      header: { backgroundColor: "#27273B" },
      content: { backgroundColor: "#27273B" },
    },
    cosmoCard2: {
      header: { backgroundColor: "#1F202B" },
      content: { backgroundColor: "#1F202B" },
    },
    cosmoCardDiscord1: {
      header: { backgroundColor: "#31314A" },
      content: { backgroundColor: "#31314A" },
    },
    cosmoCardDiscord2: {
      header: { backgroundColor: "#1F1F2B" },
      content: { backgroundColor: "#1F1F2B" },
    },
  },
  "gradient-even-lighter": {
    background: { backgroundColor: "#1F1F2B" },
    backgroundCosmo: { backgroundColor: "#1F1F2B" },
    background2: { backgroundColor: "#1F1F2B" },
    cosmoCard1: {
      header: { backgroundColor: "#27273D" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #27273D, #1F1F2B)",
        backgroundColor: "#1F1F2B",
      },
    },
    cosmoCard2: {
      header: { backgroundColor: "#27273D" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #27273D, #1F1F2B)",
        backgroundColor: "#1F1F2B",
      },
    },
    cosmoCardDiscord1: {
      header: { backgroundColor: "#31314A" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #31314A, #1F1F2B)",
      },
    },
    cosmoCardDiscord2: {
      header: { backgroundColor: "#31314A" },
      content: {
        backgroundImage: "linear-gradient(to bottom, #31314A, #1F1F2B)",
      },
    },
  },
  cupsey: {
    background: {
      backgroundColor: "#1f2028",
    },
    backgroundCosmo: {
      backgroundImage: "linear-gradient(165deg, #22232d, #0f1018)",
    },
    background2: {
      backgroundImage:
        "linear-gradient(to right, #2b2c34 3.89%, #21222b 66.42%)",
      // backgroundImage: "linear-gradient(165deg, #22242d 3.89%, #0f1018 66.42%)",
        },
        cosmoCard1: {
      header: {
        backgroundColor: "rgba(255, 255, 255, 0.02)",
      },
      content: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
      },
        },
        cosmoCard2: {
      header: {
        backgroundColor: "rgba(255, 255, 255, 0.04)",
      },
      content: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
      },
        },
        cosmoCardDiscord1: {
      header: {
        backgroundColor: "#14151d",
        // backgroundImage:
        //   "linear-gradient(to right, #252630 3.89%, #20202a 66.42%)",
      },
      content: {
        backgroundColor: "#14151d",
        // backgroundImage:
        //   "linear-gradient(to right, #252630 3.89%, #20202a 66.42%)",
      },
    },
    cosmoCardDiscord2: {
      header: {
        backgroundColor: "#191a21",
        // backgroundImage: "linear-gradient(to right, #272830, #23242b)",
      },
      content: {
        backgroundColor: "#191a21",
        // backgroundImage: "linear-gradient(to right, #272830, #23242b)",
      },
    },
  },
};

export const useCustomizeTheme = () => {
  const [theme, setTheme] = useState<IThemeColor>(colors["original"]);
  const { activePreset, presets } = useCustomizeSettingsStore();

  useEffect(() => {
    const preset = presets[activePreset];
    const color = colors[preset.themeSetting];

    setTheme(color);

    const setCssVariables = () => {
      const root = document.documentElement;
      const scrollerElements = document.querySelectorAll(".nova-scroller");

      root.style.setProperty("--background", "8, 8, 17"); // 240 36% 5%
      root.style.setProperty("--border", "36, 36, 54"); // 240 20% 18%
      root.style.setProperty("--secondary", "23, 23, 31"); // 240 15% 11%
      root.style.setProperty("--card", "8, 8, 17"); // 240 36% 5%
      root.style.setProperty("--font-color-secondary", "145, 145, 164"); // 145, 145, 164
      root.style.setProperty("--destructive", "246, 91, 147"); // 338 90% 66%
      root.style.setProperty("--warning", "240, 166, 100"); // 28 82% 67%
      root.style.setProperty("--success", "133, 214, 177"); // 153 50% 68%
      root.style.setProperty("--shade-table", "18, 18, 26"); // 240 18% 9%
      root.style.setProperty("--shade-table-hover", "23, 23, 31"); // 240 15% 11%
      root.style.setProperty("--shadow", "0, 0, 0"); // 0 0% 0%

      scrollerElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.overflowY = "auto";
        htmlElement.style.scrollbarColor = "#29293d transparent";
        htmlElement.style.scrollbarWidth = "thin";
      });

      switch (preset.themeSetting) {
        case "solid-light":
          root.style.setProperty("--background", "18, 18, 26"); // 240 18% 9%
          root.style.setProperty("--card", "18, 18, 26"); // 240 18% 9%
          root.style.setProperty("--secondary", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shade-table", "29, 29, 46"); // 240 20% 18%
          root.style.setProperty("--shade-table-hover", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shadow", "0, 0, 0"); // 0 0% 0%
          break;
        case "gradient-light":
          root.style.setProperty("--background", "18, 18, 26"); // 240 18% 9%
          root.style.setProperty("--card", "18, 18, 26"); // 240 18% 9%
          root.style.setProperty("--secondary", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shade-table", "25, 25, 34"); // 240 15% 12%
          root.style.setProperty("--shade-table-hover", "31, 31, 42"); // 240 16% 15%
          root.style.setProperty("--shadow", "0, 0, 0"); // 0 0% 0%
          break;
        case "solid-even-lighter":
          root.style.setProperty("--background", "31, 31, 42"); // 240 16% 15%
          root.style.setProperty("--card", "31, 31, 42"); // 240 16% 15%
          root.style.setProperty("--secondary", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shade-table", "39, 39, 59"); // 240 20% 24%
          root.style.setProperty("--shade-table-hover", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shadow", "18, 18, 18"); // 0 0% 7%
          break;
        case "gradient-even-lighter":
          root.style.setProperty("--background", "31, 31, 42"); // 240 16% 15%
          root.style.setProperty("--card", "31, 31, 42"); // 240 16% 15%
          root.style.setProperty("--secondary", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shade-table", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shade-table-hover", "18, 18, 26"); // 240 18% 9%
          root.style.setProperty("--shadow", "18, 18, 18"); // 0 0% 7%
          break;
        case "cupsey":
          root.style.setProperty("--background", "30, 30, 38"); // 233 13% 14%
          root.style.setProperty("--border", "46, 46, 56"); // 20 -5% 20% (adjusted negative saturation)
          root.style.setProperty("--secondary", "36, 36, 46"); // 228 12% 17%
          root.style.setProperty("--card", "22, 22, 29"); // 233 16% 10%
          root.style.setProperty("--font-color-secondary", "180, 182, 217"); // 180, 182, 217
          root.style.setProperty("--destructive", "255, 84, 138"); // 336 100% 65%
          root.style.setProperty("--warning", "219, 158, 104"); // 29 68% 72%
          root.style.setProperty("--success", "76, 176, 120"); // 176 65% 54%
          root.style.setProperty("--shade-table", "18, 18, 26"); // 240 18% 9%
          root.style.setProperty("--shade-table-hover", "23, 23, 31"); // 240 15% 11%
          root.style.setProperty("--shadow", "18, 18, 18"); // 0 0% 7%

          scrollerElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            htmlElement.style.overflowY = "auto";
            htmlElement.style.scrollbarColor = "#67686b transparent";
            htmlElement.style.scrollbarWidth = "thin";
          });
          break;
      }
    };
    setCssVariables();
  }, [activePreset, presets]);

  return theme;
};

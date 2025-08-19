interface Feature {
  id: number;
  title: string;
  description: string;
  video: string;
}

export const newFeatures: Feature[] = [
  {
    id: 1,
    title: "Custom PNL Card",
    description: "Personalize your PnL card, choose any background.",
    video: '/videos/new-features/custom-pnl.mp4',
  },
  {
    id: 2,
    title: "Earn Page",
    description: "Track and claim your trade cashback and referral earnings effortlessly.",
    video: '/videos/new-features/earn-page2.mp4',
  },
  {
    id: 3,
    title: "Multi Wallet Panel",
    description: "Trade effortlessly across multiple wallets using our new multi-wallet panel.",
    video: '/videos/new-features/multi-wallet.mp4',
  },
  {
    id: 4,
    title: "Token Age",
    description: "Instantly check token age on both wallet tracker and token pages.",
    video: '/videos/new-features/token-age.mp4',
  },
];

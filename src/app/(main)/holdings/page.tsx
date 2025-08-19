// ######## Components 🧩 ########
import NoScrollLayout from "@/components/layouts/NoScrollLayout";

// ######## Utils & Helpers 🤝 ########
import { generateMetadata } from "@/utils/generateMetadata";
import HoldingsClient from "@/components/customs/HoldingsClient";

export const metadata = generateMetadata({
  title: "Holdings",
});

export default async function HoldingsPage() {
  return (
    <NoScrollLayout>
      <HoldingsClient />
    </NoScrollLayout>
  );
}

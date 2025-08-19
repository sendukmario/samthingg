import { generateMetadata } from "@/utils/generateMetadata";
import EarnClient from "@/components/customs/EarnClient";

export const metadata = generateMetadata({
  title: "Earn",
});

export default async function EarnPage() {
  return <EarnClient />;
}

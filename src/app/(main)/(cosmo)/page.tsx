import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateMetadata } from "@/utils/generateMetadata";
import CosmoClientWrapper from "@/components/customs/wrappers/CosmoClientWrapper";

export const metadata = generateMetadata({
  title: "Cosmo",
});

export default async function Home() {
  const isNew = (await cookies()).get("isNew")?.value === "true";
  if (isNew) {
    redirect("/login");
  }
  const initialIsNewUser =
    (await cookies()).get("_is_new_user")?.value === "true";

  return <CosmoClientWrapper initialIsNewUser={initialIsNewUser} />;
}

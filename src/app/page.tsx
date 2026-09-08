import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <AuthForm />;
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Log In - StockFlow",
  description: "Access your organization's dashboard and manage your inventory with StockFlow.",
};

export default async function LoginPage() {
  const session = await getSession();

  // If already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}

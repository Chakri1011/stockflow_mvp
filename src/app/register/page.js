import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";

export const metadata = {
  title: "Register - StockFlow",
  description: "Create a new organization and start managing your inventory with StockFlow.",
};

export default async function RegisterPage() {
  const session = await getSession();

  // If already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}

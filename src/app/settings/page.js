import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import SettingsForm from "./SettingsForm";

export const metadata = {
  title: "Settings - StockFlow",
  description: "Manage your StockFlow organization settings.",
};

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
  });

  if (!org) {
    redirect("/login");
  }

  return (
    <div className="app-layout">
      <Navbar session={session} />
      <main className="container main-content">
        <SettingsForm defaultThreshold={org.defaultLowStockThreshold} />
      </main>
    </div>
  );
}

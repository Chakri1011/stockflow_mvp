import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard - StockFlow",
  description: "StockFlow inventory metrics overview and alert pane.",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch all products for the current organization
  const products = await db.product.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
  });

  const org = await db.organization.findUnique({
    where: { id: session.organizationId },
  });

  if (!org) {
    redirect("/login");
  }

  const defaultThreshold = org.defaultLowStockThreshold;

  // Calculate metrics
  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantityOnHand, 0);

  // Filter low stock items
  const lowStockItems = products.filter((p) => {
    const threshold = p.lowStockThreshold !== null ? p.lowStockThreshold : defaultThreshold;
    return p.quantityOnHand <= threshold;
  }).map(p => ({
    ...p,
    costPrice: p.costPrice ? Number(p.costPrice) : null,
    sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
    resolvedThreshold: p.lowStockThreshold !== null ? p.lowStockThreshold : defaultThreshold
  }));

  return (
    <div className="app-layout">
      <Navbar session={session} />
      <main className="container main-content">
        <DashboardClient
          session={session}
          totalProducts={totalProducts}
          totalQuantity={totalQuantity}
          lowStockItems={lowStockItems}
        />
      </main>
    </div>
  );
}

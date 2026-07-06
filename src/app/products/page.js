import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "Products - StockFlow",
  description: "Manage your StockFlow inventory catalog, adjust pricing, and track SKU levels.",
};

export default async function ProductsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch all products for this organization
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

  return (
    <div className="app-layout">
      <Navbar session={session} />
      <main className="container main-content">
        <ProductsClient 
          initialProducts={products} 
          defaultLowStockThreshold={org.defaultLowStockThreshold} 
        />
      </main>
    </div>
  );
}

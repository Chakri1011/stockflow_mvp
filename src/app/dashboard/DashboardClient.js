"use client";

import { useState } from "react";
import { adjustStockAction } from "../actions";
import { useRouter } from "next/navigation";
import { Package, BarChart3, AlertTriangle, CheckCircle2, ChevronRight, CornerDownRight, Loader } from "lucide-react";
import Link from "next/link";

export default function DashboardClient({ session, totalProducts, totalQuantity, lowStockItems }) {
  const router = useRouter();
  
  // Local state for stock adjustments: { [productId]: { amount: string, note: string } }
  const [adjustments, setAdjustments] = useState({});
  const [loadingIds, setLoadingIds] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleInputChange = (productId, field, value) => {
    setAdjustments((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleAdjustStock = async (productId) => {
    const adj = adjustments[productId];
    const amount = adj?.amount ? parseInt(adj.amount, 10) : 0;
    const note = adj?.note || "";

    if (!amount || isNaN(amount)) {
      setErrorMsg("Please enter a valid non-zero adjustment value.");
      return;
    }

    setLoadingIds((prev) => ({ ...prev, [productId]: true }));
    setErrorMsg("");
    setSuccessMsg("");

    const res = await adjustStockAction(productId, amount, note);
    setLoadingIds((prev) => ({ ...prev, [productId]: false }));

    if (res.success) {
      setSuccessMsg(`Stock updated successfully.`);
      // Reset inputs
      setAdjustments((prev) => ({
        ...prev,
        [productId]: { amount: "", note: "" },
      }));
      router.refresh();
    } else {
      setErrorMsg(res.error || "Failed to adjust stock.");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-welcome">
        <h1>Welcome back, {session.name}</h1>
        <p>Here is your inventory snapshot for today.</p>
      </div>

      {/* Alert Notifications */}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Metrics Section */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon-bg">
            <Package size={24} className="metric-icon" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Unique Products</span>
            <span className="metric-value">{totalProducts}</span>
          </div>
          <Link href="/products" className="metric-link" title="Manage products">
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-bg success-bg-icon">
            <BarChart3 size={24} className="metric-icon success-color" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Items in Stock</span>
            <span className="metric-value">{totalQuantity}</span>
          </div>
        </div>
      </div>

      {/* Alerts Pane */}
      <div className="alerts-section">
        <div className="section-header">
          <AlertTriangle size={20} className="warning-color" />
          <h2>Low Stock Alerts</h2>
          <span className="alert-count">{lowStockItems.length}</span>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="clean-state glass-panel">
            <CheckCircle2 size={48} className="clean-icon" />
            <h3>Your Stock is Healthy</h3>
            <p>All items in your catalog are currently above their low-stock thresholds.</p>
            <Link href="/products" className="btn btn-primary btn-sm" style={{ marginTop: "16px" }}>
              View Product Catalog
            </Link>
          </div>
        ) : (
          <div className="glass-panel alert-card-container">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Current Quantity</th>
                    <th>Threshold</th>
                    <th>Quick Stock Load / Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => {
                    const adjValue = adjustments[item.id]?.amount || "";
                    const adjNote = adjustments[item.id]?.note || "";
                    const isPending = !!loadingIds[item.id];

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="product-title-cell">
                            <span className="product-name-txt">{item.name}</span>
                            {item.description && <span className="product-desc-txt">{item.description}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="sku-badge">{item.sku}</span>
                        </td>
                        <td>
                          <span className="badge badge-low-stock">
                            {item.quantityOnHand} units
                          </span>
                        </td>
                        <td>
                          <span className="threshold-txt">{item.resolvedThreshold} units</span>
                        </td>
                        <td>
                          <div className="adjust-form">
                            <div className="adjust-inputs">
                              <input
                                type="number"
                                className="form-control adj-qty-input"
                                placeholder="+/- units"
                                value={adjValue}
                                onChange={(e) => handleInputChange(item.id, "amount", e.target.value)}
                                disabled={isPending}
                              />
                              <input
                                type="text"
                                className="form-control adj-note-input"
                                placeholder="Note (e.g. 'restock')"
                                value={adjNote}
                                onChange={(e) => handleInputChange(item.id, "note", e.target.value)}
                                disabled={isPending}
                              />
                            </div>
                            <button
                              onClick={() => handleAdjustStock(item.id)}
                              className="btn btn-success btn-sm btn-adj"
                              disabled={isPending || !adjValue}
                            >
                              {isPending ? (
                                <Loader size={12} className="spinner" />
                              ) : (
                                "Apply"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

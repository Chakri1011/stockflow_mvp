"use client";

import { useState, useTransition } from "react";
import { createProductAction, updateProductAction, deleteProductAction } from "../actions";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, ShieldCheck, HelpCircle, Loader } from "lucide-react";

export default function ProductsClient({ initialProducts, defaultLowStockThreshold }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means "Add" mode
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form Submission Error/Success State
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formPending, setFormPending] = useState(false);

  // Filter products by search query
  const filteredProducts = initialProducts.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    );
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormPending(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    
    let res;
    if (editingProduct) {
      res = await updateProductAction(editingProduct.id, formData);
    } else {
      res = await createProductAction(null, formData);
    }

    setFormPending(false);

    if (res.success) {
      setSuccessMsg(editingProduct ? "Product updated successfully." : "Product created successfully.");
      setTimeout(() => {
        setModalOpen(false);
        router.refresh();
      }, 1000);
    } else {
      setErrorMsg(res.error || "An error occurred.");
    }
  };

  const handleDelete = async (id) => {
    setFormPending(true);
    const res = await deleteProductAction(id);
    setFormPending(false);
    setDeleteConfirmId(null);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to delete product.");
    }
  };

  // Format Helper
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
  };

  const isLowStock = (product) => {
    const threshold = product.lowStockThreshold !== null ? product.lowStockThreshold : defaultLowStockThreshold;
    return product.quantityOnHand <= threshold;
  };

  const getThresholdDisplay = (product) => {
    if (product.lowStockThreshold !== null) {
      return `${product.lowStockThreshold} (custom)`;
    }
    return `${defaultLowStockThreshold} (default)`;
  };

  return (
    <div className="products-container">
      {/* Header and Add Action */}
      <div className="products-header">
        <div>
          <h1>Product Catalog</h1>
          <p>Create, update, and manage your inventory catalog items.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filter-bar glass-panel">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search products by Name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="glass-panel table-panel">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <HelpCircle size={48} className="empty-icon" />
            <h3>No Products Found</h3>
            <p>
              {searchQuery
                ? "No products match your search query."
                : "Your inventory catalog is currently empty. Get started by adding a product."}
            </p>
            {!searchQuery && (
              <button onClick={openAddModal} className="btn btn-primary btn-sm" style={{ marginTop: "16px" }}>
                Add First Product
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Threshold</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const low = isLowStock(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="product-title-cell">
                          <span className="product-name-txt">{product.name}</span>
                          {product.description && <span className="product-desc-txt">{product.description}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="sku-badge">{product.sku}</span>
                      </td>
                      <td>
                        <strong className="qty-value">{product.quantityOnHand}</strong>
                      </td>
                      <td>
                        {low ? (
                          <span className="badge badge-low-stock">
                            <AlertTriangle size={12} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <ShieldCheck size={12} />
                            Healthy
                          </span>
                        )}
                      </td>
                      <td>{formatPrice(product.costPrice)}</td>
                      <td>{formatPrice(product.sellingPrice)}</td>
                      <td>
                        <span className="threshold-txt">{getThresholdDisplay(product)}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => openEditModal(product)} className="action-btn edit-btn" title="Edit product">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(product.id)} className="action-btn delete-btn" title="Delete product">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setModalOpen(false)} className="modal-close">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="alert alert-error">
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success">
                <ShieldCheck size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Product Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="form-control"
                  defaultValue={editingProduct?.name || ""}
                  placeholder="e.g. Wireless Mouse"
                  disabled={formPending}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sku">SKU *</label>
                <input
                  id="sku"
                  name="sku"
                  type="text"
                  required
                  className="form-control"
                  defaultValue={editingProduct?.sku || ""}
                  placeholder="e.g. WM-012"
                  disabled={formPending}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="2"
                  className="form-control"
                  defaultValue={editingProduct?.description || ""}
                  placeholder="Optional product description..."
                  disabled={formPending}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="quantityOnHand">Quantity on Hand</label>
                  <input
                    id="quantityOnHand"
                    name="quantityOnHand"
                    type="number"
                    min="0"
                    className="form-control"
                    defaultValue={editingProduct?.quantityOnHand !== undefined ? editingProduct.quantityOnHand : "0"}
                    disabled={formPending}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lowStockThreshold">Low Stock Threshold</label>
                  <input
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    className="form-control"
                    defaultValue={editingProduct?.lowStockThreshold !== null ? editingProduct?.lowStockThreshold : ""}
                    placeholder="Use org default"
                    disabled={formPending}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="costPrice">Cost Price ($)</label>
                  <input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    defaultValue={editingProduct?.costPrice !== null ? editingProduct?.costPrice : ""}
                    placeholder="e.g. 5.99"
                    disabled={formPending}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sellingPrice">Selling Price ($)</label>
                  <input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    defaultValue={editingProduct?.sellingPrice !== null ? editingProduct?.sellingPrice : ""}
                    placeholder="e.g. 14.99"
                    disabled={formPending}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" disabled={formPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formPending}>
                  {formPending ? <Loader size={16} className="spinner" /> : (editingProduct ? "Save Changes" : "Add Product")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <h3>Confirm Delete</h3>
            <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>
              Are you sure you want to delete this product? This action will remove the product and all associated stock logs permanently.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary" disabled={formPending}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="btn btn-danger" disabled={formPending}>
                {formPending ? <Loader size={16} className="spinner" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

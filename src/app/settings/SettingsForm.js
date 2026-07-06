"use client";

import { useActionState, startTransition, useState } from "react";
import { updateSettingsAction } from "../actions";
import { ShieldCheck, ShieldAlert, Loader, Sliders } from "lucide-react";

export default function SettingsForm({ defaultThreshold }) {
  const [successMsg, setSuccessMsg] = useState("");

  const [state, formAction, isPending] = useActionState(async (prevState, formData) => {
    setSuccessMsg("");
    const threshold = formData.get("defaultThreshold");
    const res = await updateSettingsAction(threshold);
    if (res.success) {
      setSuccessMsg("Settings saved successfully.");
    }
    return res;
  }, null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <Sliders size={24} className="header-icon" />
        <h1>System Settings</h1>
      </div>
      <p className="settings-desc">Configure global parameters for your inventory catalog.</p>

      <div className="settings-card glass-panel">
        <h3 className="section-title">Threshold Parameters</h3>
        <p className="section-desc">
          Set the default benchmark for your products. If a product does not specify its own individual threshold, 
          the system will flag it as "Low Stock" when its stock count reaches or drops below this default.
        </p>

        {state?.error && (
          <div className="alert alert-error">
            <ShieldAlert size={18} />
            <span>{state.error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success">
            <ShieldCheck size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label className="form-label" htmlFor="defaultThreshold">
              Default Low Stock Threshold
            </label>
            <input
              id="defaultThreshold"
              name="defaultThreshold"
              type="number"
              min="0"
              required
              className="form-control"
              defaultValue={defaultThreshold}
              placeholder="e.g. 5"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? (
              <>
                <Loader size={16} className="spinner" />
                <span>Saving settings...</span>
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </form>
      </div>

    </div>
  );
}

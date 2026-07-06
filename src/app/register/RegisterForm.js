"use client";

import { useActionState, startTransition } from "react";
import { registerAction } from "../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Store, Mail, Lock, ShieldAlert, Loader } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(async (prevState, formData) => {
    // Client-side validations
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    const result = await registerAction(prevState, formData);
    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    }
    return result;
  }, null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="logo-icon">SF</div>
          <h1>Create Your Account</h1>
          <p>Get started with StockFlow SaaS Inventory Manager</p>
        </div>

        {state?.error && (
          <div className="alert alert-error">
            <ShieldAlert size={18} />
            <span>{state.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={16} className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-control with-icon"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="orgName">Organization / Store Name</label>
            <div className="input-icon-wrapper">
              <Store size={16} className="input-icon" />
              <input
                id="orgName"
                name="orgName"
                type="text"
                required
                className="form-control with-icon"
                placeholder="Acme Store"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="form-control with-icon"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-control with-icon"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="form-control with-icon"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
            {isPending ? (
              <>
                <Loader size={16} className="spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login" className="auth-link">Log In</Link>
        </div>
      </div>
    </div>
  );
}

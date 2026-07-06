"use client";

import { useActionState, startTransition } from "react";
import { loginAction } from "../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ShieldAlert, Loader } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(async (prevState, formData) => {
    const result = await loginAction(prevState, formData);
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
          <h1>Welcome Back</h1>
          <p>Log in to access your StockFlow dashboard</p>
        </div>

        {state?.error && (
          <div className="alert alert-error">
            <ShieldAlert size={18} />
            <span>{state.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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

          <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
            {isPending ? (
              <>
                <Loader size={16} className="spinner" />
                <span>Logging In...</span>
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link href="/register" className="auth-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

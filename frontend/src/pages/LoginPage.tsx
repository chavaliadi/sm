import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "@/api/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@sagarmala.gov.in");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginUser(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Portal Branding Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Sagarmala 2.0 Portal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ministry of Ports, Shipping and Waterways
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Sign in to your account
          </h2>

          {/* Inline Error State Banner */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sagarmala.gov.in"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full justify-center rounded-md bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Role Credentials Reference Hint */}
          <div className="mt-6 border-t border-gray-100 pt-4 text-center text-[11px] text-gray-400">
            Default Admin: <span className="font-mono text-gray-600">admin@sagarmala.gov.in</span> / <span className="font-mono text-gray-600">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

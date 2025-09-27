"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        router.push("/news");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-black px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="text-xl font-normal hover:underline">
            lift
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-6 py-16">
        <div className="border border-black p-8">
          <h1 className="mb-6 text-2xl font-normal">sign in</h1>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm">
                email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black px-4 py-2 text-sm focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm">
                password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black px-4 py-2 text-sm focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="border border-black bg-gray-50 p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-black bg-black px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
            >
              {loading ? "signing in..." : "sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-black pt-6 text-sm">
            <p>
              don&apos;t have an account?{" "}
              <Link href="/signup" className="underline hover:no-underline">
                sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          <Link href="/" className="hover:underline">
            ← back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
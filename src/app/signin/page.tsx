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
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-black dark:border-gray-700 px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="text-xl font-normal hover:underline dark:text-white">
            lift.news
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-6 py-16">
        <div className="border border-black dark:border-gray-700 p-8">
          <h1 className="mb-6 text-2xl font-normal dark:text-white">sign in</h1>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm dark:text-gray-200">
                email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black dark:border-gray-700 dark:bg-gray-800 dark:text-white px-4 py-2 text-sm focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm dark:text-gray-200">
                password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black dark:border-gray-700 dark:bg-gray-800 dark:text-white px-4 py-2 text-sm focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="border border-black dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm dark:text-white">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-black dark:border-gray-700 bg-black dark:bg-gray-700 px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {loading ? "signing in..." : "sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-black dark:border-gray-700 pt-6 text-sm dark:text-gray-200">
            <p>
              don&apos;t have an account?{" "}
              <Link href="/signup" className="underline hover:no-underline">
                sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:underline">
            ← back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
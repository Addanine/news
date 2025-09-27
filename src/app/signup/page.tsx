"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "~/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!recaptchaToken) {
      setError("please complete the recaptcha");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/news");
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to sign up");
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
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
          <h1 className="mb-6 text-2xl font-normal">sign up</h1>

          {success ? (
            <div className="border border-black bg-gray-50 p-6 text-sm">
              <p className="mb-2 font-normal">account created successfully!</p>
              <p className="text-xs text-gray-600">
                redirecting you to the news feed...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
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
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-600">
                  must be at least 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm">
                  confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-black px-4 py-2 text-sm focus:outline-none"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
                  onChange={handleRecaptchaChange}
                  theme="light"
                />
              </div>

              {error && (
                <div className="border border-black bg-gray-50 p-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !recaptchaToken}
                className="w-full border border-black bg-black px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
              >
                {loading ? "creating account..." : "sign up"}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-black pt-6 text-sm">
            <p>
              already have an account?{" "}
              <Link href="/signin" className="underline hover:no-underline">
                sign in
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
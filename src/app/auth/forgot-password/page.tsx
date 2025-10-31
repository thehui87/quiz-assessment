// app/auth/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // Your Supabase client
import { Header } from "@/components/Header";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    // Supabase will send a reset link to this email
    // NOTE: You must configure the redirect URL in your Supabase project settings.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      // Replace with your actual password update page URL
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Password reset link sent! Check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="admin@quizstack.com"
              />
            </div>

            {/* Status Messages */}
            {error && (
              <div className="p-3 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                Error: {error}
              </div>
            )}
            {message && (
              <div className="p-3 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-lg">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors 
                ${
                  loading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }`}
            >
              {loading ? "Sending Link..." : "Send Reset Link"}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center text-sm mt-4">
            <Link
              href="/auth/login"
              className="font-medium text-gray-600 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors"
            >
              &larr; Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

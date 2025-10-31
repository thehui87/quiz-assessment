// components/admin/UserInviteForm.tsx
"use client";

import { useState } from "react";

export function UserInviteForm() {
  const [email, setEmail] = useState("");
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, isAdminInvite }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage({ type: "success", text: `Invitation sent to ${email}!` });
      setEmail("");
      setIsAdminInvite(false);
    } else {
      setMessage({ type: "error", text: data.error || "Failed to send invitation." });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-indigo-600 dark:text-indigo-400">
        Invite New User
      </h2>

      {message && (
        <div
          className={`p-3 mb-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="invite-email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            User Email
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="new.user@organization.com"
          />
        </div>

        <div className="flex items-center">
          <input
            id="is-admin"
            type="checkbox"
            checked={isAdminInvite}
            onChange={e => setIsAdminInvite(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="is-admin" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Grant Admin Access
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className={`w-full flex justify-center py-2 px-4 rounded-lg shadow-sm text-sm font-medium text-white transition-colors 
            ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
        >
          {loading ? "Sending..." : "Send Invitation Email"}
        </button>
      </form>
    </div>
  );
}

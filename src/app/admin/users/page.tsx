"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

// Define a type for the user data we're fetching
type AdminUser = {
  id: string;
  is_admin: boolean;
  users: {
    email: string | null;
    last_sign_in_at: string | null;
  } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);

      // --- FIX START: Use two separate queries to bypass PostgREST foreign key error ---

      // 1. Fetch all profiles (id and admin status)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`id, is_admin`);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setError("Failed to load user profiles.");
        setLoading(false);
        return;
      }

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Extract all profile IDs
      const userIds = profilesData.map(p => p.id);

      // 2. Fetch corresponding user details (email/sign-in) from the 'users' table/view.
      // This assumes RLS is correctly configured to allow admins to view this data.
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(`id, email, last_sign_in_at`)
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching auth users:", usersError);
        // We still show the profiles, but mark the user data as unavailable
        setError("Warning: Could not fetch user emails/status details.");
      }

      // 3. Merge the data
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      const mappedUsers: AdminUser[] = profilesData.map(profile => {
        const authUser = usersMap.get(profile.id);

        return {
          id: profile.id as string,
          is_admin: profile.is_admin as boolean,
          users: authUser
            ? {
                email: authUser.email,
                last_sign_in_at: authUser.last_sign_in_at,
              }
            : null,
        };
      });

      setUsers(mappedUsers);
      // --- FIX END ---

      setLoading(false);
    }

    fetchUsers();
  }, []);

  const formatStatus = (isoDate: string | null) => {
    if (!isoDate) return <span className="text-gray-500">Never</span>;
    return new Date(isoDate).toLocaleString();
  };

  const formatAdminStatus = (isAdmin: boolean) => {
    return isAdmin ? (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Admin
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        User
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
        User Management
      </h1>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status (Last Sign In)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {user.users?.email || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatAdminStatus(user.is_admin)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatStatus(user.users?.last_sign_in_at || null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center p-6 text-gray-500 dark:text-gray-400">No users found.</div>
      )}
    </div>
  );
}

// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Your Supabase client
import { AdminSidebar } from "@/components/AdminSidebar"; // Component needed below

// Utility to check if the user is logged in AND has the 'is_admin' flag
// NOTE: This client-side check is for UX (immediate redirection).
// Server-side RLS is the true security measure.
async function isAdminCheck(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Check the 'profiles' table for the admin flag
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin === true;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndAdmin() {
      const isUserAdmin = await isAdminCheck();

      if (!isUserAdmin) {
        // 🛑 CRITICAL: If not admin, redirect immediately to login
        router.replace("/auth/login?redirected=true");
      } else {
        setIsAdmin(true);
      }
      setIsLoading(false);
    }
    checkAuthAndAdmin();
  }, [router]);

  if (isLoading) {
    // Show a loading spinner or skeleton while checking authentication
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-indigo-500">Checking Permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    // This state should theoretically be skipped due to the redirect,
    // but acts as a final safeguard.
    return null;
  }

  // If the user IS an admin, render the protected content with the sidebar
  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for Admin Navigation */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg md:hidden"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          // "X" (Close) Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-gray-900 dark:text-white"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // "Menu" (Hamburger) Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-gray-900 dark:text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      <div
        className={`fixed md:block inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* We assume AdminSidebar fills its parent (e.g., has h-full) */}
        <AdminSidebar />
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <main className="overflow-y-auto p-4 pt-16 md:p-8 md:pt-8 md:ml-64 mx-auto w-full">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

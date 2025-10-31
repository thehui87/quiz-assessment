// components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/admin/quiz/create", label: "Create Quiz", icon: "📝" },
  { href: "/admin/quiz", label: "View/Edit Quizzes", icon: "🔎" },
  { href: "/admin/users", label: "Manage Users", icon: "👥" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="w-64 h-full flex-shrink-0 bg-gray-800 dark:bg-gray-950 text-white p-4 shadow-2xl">
      <h1 className="text-2xl font-bold mb-8 text-indigo-400">QuizStack Admin</h1>

      <nav className="space-y-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center p-3 rounded-lg transition-colors 
              ${
                pathname === item.href
                  ? "bg-indigo-600 dark:bg-indigo-700 font-semibold"
                  : "hover:bg-gray-700 dark:hover:bg-gray-800"
              }`}
          >
            <span className="mr-3">{item.icon}</span> {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 pt-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center cursor-pointer justify-center p-3 rounded-lg text-sm text-red-400 bg-gray-700 hover:bg-red-600 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

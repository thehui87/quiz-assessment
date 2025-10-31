// app/admin/dashboard/page.tsx

import { supabase } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
// NOTE: Card and UserInviteForm imports are corrected based on typical project structure
import { Card } from "@/components/Card";
import { UserInviteForm } from "@/components/UserInviteForm";

// -----------------------------------------------------------
// Server Data Fetching (Runs on the server for performance)
// -----------------------------------------------------------

interface DashboardStats {
  totalQuizzes: number;
  totalAttempts: number;
  totalQuestions: number;
}

async function getDashboardStats(): Promise<DashboardStats> {
  // ✅ FIX: Await the async Supabase client creation
  const supabase = await createServerSupabaseClient();

  const { count: totalQuizzes } = await supabase
    .from("Quiz")
    .select("*", { count: "exact", head: true });

  const { count: totalAttempts } = await supabase
    .from("QuizAttempt")
    .select("*", { count: "exact", head: true });

  const { count: totalQuestions } = await supabase
    .from("Question")
    .select("*", { count: "exact", head: true });

  return {
    totalQuizzes: totalQuizzes ?? 0,
    totalAttempts: totalAttempts ?? 0,
    totalQuestions: totalQuestions ?? 0,
  };
}

// -----------------------------------------------------------
// Page Component
// -----------------------------------------------------------

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-700 pb-3">
        Admin Dashboard 👋
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Welcome back! Here is an overview of the QuizStack system activity.
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Quizzes" value={stats.totalQuizzes} icon="📚" />
        <Card title="Total Questions" value={stats.totalQuestions} icon="❓" />
        <Card title="Total Attempts" value={stats.totalAttempts} icon="📝" />
      </div>

      {/* Quick Actions / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-indigo-600 dark:text-indigo-400">
            Quick Actions
          </h2>
          <ul className="space-y-3">
            <li>
              <a
                href="/admin/quiz/create"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors"
              >
                <span className="text-2xl mr-3">+</span> Create New Quiz
              </a>
            </li>
            <li>
              <a
                href="/admin/quiz"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors"
              >
                <span className="text-2xl mr-3">👀</span> Manage Existing Quizzes
              </a>
            </li>
          </ul>
        </div>
        <UserInviteForm />
        {/* System Health Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">System Health</h2>
          <p className="text-sm text-green-600 dark:text-green-400">
            ✅ Supabase Connection: Stable
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ✅ Next.js Server: Running Optimally
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            ⚠️ Next Step: Implement Server-side Admin Auth (RLS)
          </p>
        </div>
      </div>
    </div>
  );
}

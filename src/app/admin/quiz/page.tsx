import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import QuizActions from "@/components/QuizActions";

// Define the type for the data fetched from the database
interface Quiz {
  id: string;
  created_at: string;
  title: string;
  description: string;
  created_by: string;
}

// -----------------------------------------------------------
// Server Data Fetching
// -----------------------------------------------------------

async function getQuizzes(): Promise<Quiz[]> {
  const supabase = await createServerSupabaseClient();

  // Fetch all quizzes, ordered by creation date
  const { data, error } = await supabase
    .from("Quiz")
    .select("id, created_at, title, description, created_by")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quizzes:", error);
    // In a production app, you might want to throw an error or handle it more gracefully
    return [];
  }

  return data as Quiz[];
}

// -----------------------------------------------------------
// Page Component (Server Component)
// -----------------------------------------------------------

export default async function AdminManageQuizzesPage() {
  const quizzes = await getQuizzes();

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Manage Quizzes ({quizzes.length})
        </h1>
        <Link
          href="/admin/quiz/create"
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors transform hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5 mr-2" /> New Quiz
        </Link>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        View, edit, and manage all quizzes in the system.
      </p>

      {quizzes.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-gray-400 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
          <BookOpen className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">No Quizzes Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Start by clicking &quot;New Quiz&quot; to create your first quiz.
          </p>
        </div>
      ) : (
        // Quizzes Table
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell"
                >
                  Created At
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {quizzes.map(quiz => (
                <tr
                  key={quiz.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {quiz.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate hidden sm:table-cell">
                    {quiz.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Client Component for interactive actions (edit/delete) */}
                    <QuizActions quizId={quiz.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

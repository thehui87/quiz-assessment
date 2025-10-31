// app/quiz/browse/page.tsx
import Link from "next/link";
// Assuming Header and QuizCard are defined in your components directory
import { Header } from "@/components/Header";
import { QuizCard } from "@/components/QuizCard";
import { supabase } from "@/lib/supabase"; // Your initialized Supabase client

// Define the type for a quiz fetched from the database
interface Quiz {
  id: string;
  title: string;
  description?: string;
  Question: { count: number }[];
  // We'll calculate the question count separately or estimate it
}

// -----------------------------------------------------------
// 1. Data Fetching Function (Simulating Server Component Fetch)
// -----------------------------------------------------------

// In a production Next.js App Router setup, this runs on the server.
async function getQuizzes(): Promise<Quiz[]> {
  try {
    // Fetch all quizzes and join with the question count
    const { data: quizzes, error } = await supabase
      .from("Quiz") // Replace with your actual table name
      .select("id, title, description, Question(count)")
      .limit(20); // Limit the display for performance

    if (error) {
      console.error("Database Error:", error);
      // In a real app, you might throw or handle a redirect here
      return [];
    }

    // Map the fetched data to a simplified Quiz array
    return quizzes.map((quiz: Quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      count: quiz.Question.length > 0 ? quiz.Question[0].count : 0,
      Question: quiz.Question, // Keep it to satisfy type
    }));
  } catch (err) {
    console.error("Server fetch failed:", err);
    return [];
    // Fallback to dummy data for development/testing if fetch fails
    // return DUMMY_QUIZZES.map(q => ({ id: q.id, title: q.title, count: q.count }));
  }
}

export default async function BrowseQuizzesPage() {
  // Fetch data on the server side
  const quizzes = await getQuizzes();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">
          All Available Quizzes
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 border-b pb-4 border-gray-200 dark:border-gray-700">
          Select a quiz below to test your skills!
        </p>

        {/* Quiz Grid - Uses the QuizCard component for consistent UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {quizzes.length > 0 ? (
            quizzes.map(quiz => (
              // Note: You may need to adapt the QuizCard props based on what you pass
              <QuizCard
                key={quiz.id}
                quiz={{
                  id: quiz.id,
                  title: quiz.title,
                  description: quiz.description,
                  count: quiz.Question.length > 0 ? quiz.Question[0].count : 0,
                }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                No quizzes available yet. Check back soon!
              </p>
              <Link
                href="/auth/login"
                className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Are you an admin? Create a quiz now.
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Reusable Footer component would go here */}
    </div>
  );
}

// -----------------------------------------------------------
// 3. Reusable QuizCard Component (Re-defined for context)
// -----------------------------------------------------------

// NOTE: You must still define your actual Header component in '@/components/layout/Header.tsx'

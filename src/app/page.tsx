// app/page.tsx
import Link from "next/link";

// Assume you have a reusable Header component
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
// import { QuizCard } from "@/components/quiz/QuizCard";

// --- DUMMY DATA for MVP ---
// const DUMMY_QUIZZES = [
//   {
//     id: "1",
//     title: "The Next.js Fundamentals",
//     description: "Test your core knowledge of the framework.",
//     count: 10,
//   },
//   {
//     id: "2",
//     title: "PostgreSQL & Prisma Basics",
//     description: "A dive into database and ORM concepts.",
//     count: 5,
//   },
//   {
//     id: "3",
//     title: "CSS & Tailwind Mastery",
//     description: "See if you truly know your utility classes.",
//     count: 8,
//   },
// ];

interface Quiz {
  id: string;
  title: string;
  Question: { count: number }[];
  // We'll calculate the question count separately or estimate it
}

async function getQuizzes(): Promise<Quiz[]> {
  try {
    // Fetch all quizzes and join with the question count
    const { data: quizzes, error } = await supabase
      .from("Quiz") // Replace with your actual table name
      .select("id, title, Question(count)")
      .limit(3); // Limit the display for performance

    if (error) {
      console.error("Database Error:", error);
      // In a real app, you might throw or handle a redirect here
      return [];
    }

    // Map the fetched data to a simplified Quiz array
    return quizzes.map((quiz: Quiz) => ({
      id: quiz.id,
      title: quiz.title,
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

export default async function HomePage() {
  const quizzes = await getQuizzes();

  return (
    // Outer container with a subtle dark mode feel
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* 1. Header (Assumed component) */}
      <Header />

      <main className="container mx-auto px-4 py-16">
        {/* 2. Hero Section: Catchy Title and CTA */}
        <section className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl mb-16 border border-gray-200 dark:border-gray-700">
          <h1 className="text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
            QuizStack Pro
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            The platform for modern tech assessments. Create, manage, and take production-ready
            quizzes on Next.js, Tailwind, and Supabase.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/login"
              className="px-8 py-3 text-lg font-semibold rounded-full border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </section>

        {/* 3. Featured Quizzes Section */}
        <section className="py-8">
          <h2 className="text-3xl font-bold mb-8 border-b-2 border-indigo-500 pb-2">
            Browse Quizzes
          </h2>

          {/* Quiz Grid - Responsive layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quizzes.map(quiz => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/quiz/browse" // Link to a future dedicated browse page
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-lg font-medium transition-colors"
            >
              View All Quizzes &rarr;
            </Link>
          </div>
        </section>
      </main>

      {/* 4. Footer (Minimal) */}
      <footer className="w-full text-center py-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} QuizStack Pro. Built with Next.js, Tailwind v4, &
        Supabase.
      </footer>
    </div>
  );
}

// --- Placeholder Components (You would define these in separate files) ---

const QuizCard = ({ quiz }: { quiz: Quiz }) => (
  <Link href={`/quiz/${quiz.id}`} className="block">
    <div className="p-6 h-full bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500">
      <h3 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
        {quiz.title}
      </h3>
      {/* <p className="text-gray-600 dark:text-gray-300 mb-4">{quiz.description}</p> */}
      <span className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          {/* Star Icon (for visual interest) */}
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {quiz.Question.length > 0 ? quiz.Question[0].count : 0} Questions
      </span>
    </div>
  </Link>
);

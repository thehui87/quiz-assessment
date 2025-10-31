import Link from "next/link";
// Assume this component is in '@/components/quiz/QuizCard.tsx'
interface QuizCardProps {
  quiz: { id: string; title: string; description?: string; count: number };
}

export const QuizCard = ({ quiz }: QuizCardProps) => (
  <Link href={`/quiz/${quiz.id}`} className="block group">
    <div
      className="p-6 h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 
                group-hover:shadow-2xl group-hover:border-indigo-500 dark:group-hover:border-indigo-500 group-hover:scale-[1.02]"
    >
      <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
        {quiz.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">
        {quiz.description}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {quiz.count} Questions
        </span>
        <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center">
          Start Quiz
          <svg
            className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            ></path>
          </svg>
        </span>
      </div>
    </div>
  </Link>
);

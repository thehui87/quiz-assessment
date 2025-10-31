// app/quiz/[quizId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type QuestionType = "single_choice" | "true_false" | "text";

// --- Types based on MVP Schema ---
interface Question {
  id: string;
  text: string;
  options: string[];
  type: "single_choice" | "true_false" | "text";
  // correctOptionIndex is NOT exposed to the client for security
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

type QuizStatus = "LOADING" | "TAKING" | "FINISHED" | "ERROR";

// Store user answers: { [questionId]: optionIndex }
type UserAnswers = { [key: string]: number | string };

export default function PublicQuizPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [status, setStatus] = useState<QuizStatus>("LOADING");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // -----------------------------------------------------------
  // 1. Data Fetching (Get Quiz)
  // -----------------------------------------------------------
  useEffect(() => {
    async function fetchQuiz() {
      // 🚨 SECURITY NOTE: We must ensure RLS only returns questions without the 'correctOptionIndex'
      // Fetch quiz metadata and nested questions + their answer options (only text)
      const { data, error } = await supabase
        .from("Quiz")
        .select(
          `
          id,
          title,
          Question (id, text, type, options:AnswerOption(id, text))
        `
        )
        .eq("id", quizId)
        .single();

      if (error || !data) {
        console.error("Failed to fetch quiz:", error);
        setStatus("ERROR");
        return;
      }

      // Map nested AnswerOption objects to simple string arrays to avoid exposing correct answers
      const questionsRaw =
        (data.Question as unknown as Array<{
          id: string;
          text: string;
          type: string;
          options: Array<{ id: string; text: string }>;
        }>) || [];

      const quizData: QuizData = {
        id: data.id,
        title: data.title,
        questions: questionsRaw
          .map(q => ({
            id: q.id,
            text: q.text,
            type: q.type as QuestionType,
            options: (q.options || []).map(o => o.text),
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      };

      setQuiz(quizData);
      setStatus("TAKING");
    }
    fetchQuiz();
  }, [quizId]);

  // -----------------------------------------------------------
  // 2. Quiz Interaction Handlers
  // -----------------------------------------------------------

  const handleAnswerSelect = useCallback((questionId: string, optionIndex: string | number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }, []);

  const handleNext = () => {
    if (quiz && currentQIndex < quiz.questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  // -----------------------------------------------------------
  // 3. Submission and Scoring
  // -----------------------------------------------------------

  const handleSubmit = async () => {
    if (!quiz) return;
    setLoading(true);
    setStatus("LOADING"); // Show loading state during submission

    // Call the dedicated Next.js API route to handle SCORING and saving the attempt
    // This is crucial for security (grading MUST happen on the server)
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: userAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Server scoring failed.");
      }

      const result = await response.json();

      // Update state with the final score from the server
      setScore(result.score);
      setStatus("FINISHED");
    } catch (err) {
      console.error("Submission error:", err);
      // Fallback to error state but allow user to try again
      setScore(null);
      setStatus("ERROR");
      setError("Could not submit quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // 4. Render Logic
  // -----------------------------------------------------------

  if (status === "LOADING") {
    return (
      <QuizLayout title="Loading Quiz...">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Fetching quiz questions...</p>
        </div>
      </QuizLayout>
    );
  }

  if (status === "ERROR") {
    return (
      <QuizLayout title="Quiz Error">
        <div className="text-center py-10 text-red-600 dark:text-red-400">
          <p className="text-lg">Could not load the quiz or process submission.</p>
          <p className="mt-2 text-sm">{error}</p>
          <Link href="/quiz/browse" className="mt-4 inline-block text-indigo-600 hover:underline">
            Go back to Browse
          </Link>
        </div>
      </QuizLayout>
    );
  }

  if (status === "FINISHED" && quiz && score !== null) {
    return <ResultsView quiz={quiz} score={score} totalQuestions={quiz.questions.length} />;
  }

  // Render TAKING state
  const currentQuestion = quiz?.questions[currentQIndex];
  const totalQuestions = quiz?.questions.length ?? 0;
  const isLastQuestion = currentQIndex === totalQuestions - 1;
  const selectedAnswerIndex = userAnswers[currentQuestion?.id ?? ""] ?? -1;

  return (
    <QuizLayout title={quiz?.title || "Quiz"}>
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Progress Tracker */}
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
          Question {currentQIndex + 1} of {totalQuestions}
        </p>

        {/* Question Text */}
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          {currentQuestion?.text}
        </h2>

        {/* Options */}
        <div className="space-y-4">
          {currentQuestion?.type === "text" ? (
            <input
              type="text"
              value={(userAnswers[currentQuestion.id] as string) || ""}
              onChange={e => handleAnswerSelect(currentQuestion.id, e.target.value)}
              className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type your answer here..."
            />
          ) : (
            currentQuestion?.options.map((optionText, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 
          ${
            selectedAnswerIndex === index
              ? "bg-indigo-500 text-white shadow-md"
              : "bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
          }`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                {optionText}
              </button>
            ))
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 border-t pt-4 border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={currentQIndex === 0}
            className="px-6 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            &larr; Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {(status as QuizStatus) === "LOADING" ? "Submitting..." : "Finish & Score"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={selectedAnswerIndex === -1} // Require an answer before moving on
              className="px-6 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Next Question &rarr;
            </button>
          )}
        </div>
      </div>
    </QuizLayout>
  );
}

// -----------------------------------------------------------
// Helper Components
// -----------------------------------------------------------

// A simple layout wrapper
const QuizLayout = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-12">
    <div className="container mx-auto px-4 max-w-3xl">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-900 dark:text-white">
        {title}
      </h1>
      {children}
    </div>
  </div>
);

// Results View Component
const ResultsView = ({
  score,
  totalQuestions,
}: {
  quiz: QuizData;
  score: number;
  totalQuestions: number;
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = score > totalQuestions / 2; // Simple pass/fail logic

  return (
    <QuizLayout title="Quiz Results">
      <div
        className={`p-8 rounded-xl text-center shadow-2xl ${
          passed ? "bg-green-50 dark:bg-green-900/50" : "bg-red-50 dark:bg-red-900/50"
        } border-4 ${passed ? "border-green-400" : "border-red-400"}`}
      >
        <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {passed ? "🎉 Congratulations!" : "😟 Try Again"}
        </h2>
        <p
          className={`text-6xl font-extrabold mb-6 ${
            passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {score} / {totalQuestions}
        </p>
        <p className="text-xl text-gray-700 dark:text-gray-300">Your score: **{percentage}%**</p>

        <div className="mt-8 space-x-4">
          <Link
            href={`/quiz/browse`}
            className="px-6 py-3 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Take Another Quiz
          </Link>
          <Link
            href={`/`}
            className="px-6 py-3 rounded-lg text-sm font-medium border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </QuizLayout>
  );
};

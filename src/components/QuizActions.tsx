"use client";

import { Edit, Trash2, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface QuizActionsProps {
  quizId: string;
}

// NOTE: This component is currently a placeholder for client-side interactions
// such as confirming deletion, submitting the delete request, and redirecting for edit.

export default function QuizActions({ quizId }: QuizActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Deleting the quiz cascades through the foreign keys (Question, AnswerOption)
      const { error } = await supabase.from("Quiz").delete().eq("id", quizId);

      if (error) {
        throw new Error(error.message);
      }

      setDeleted(true);
      // Force a refresh of the server component data
      router.refresh();
      // Optionally, wait a moment before clearing the confirmation
      setTimeout(() => setDeleted(false), 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to delete quiz: ${err.message}`);
      } else {
        setError("Failed to delete quiz: Unknown error");
      }
    } finally {
      setLoading(false);
      setIsConfirming(false); // Hide the confirmation state
    }
  };

  const handleEdit = () => {
    // Navigate to a dedicated edit page (which we haven't created yet)
    router.push(`/admin/quiz/edit/${quizId}`);
  };

  if (error) {
    return <span className="text-red-500 text-xs italic">{error}</span>;
  }

  if (loading) {
    return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
  }

  if (deleted) {
    return <CheckCircle className="w-5 h-5 text-green-500" values="Deleted" />;
  }

  return (
    <div className="flex justify-end space-x-2">
      {/* Edit Button */}
      <button
        onClick={handleEdit}
        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
        title="Edit Quiz"
      >
        <Edit className="w-5 h-5" />
      </button>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-full hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
        title="Delete Quiz"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

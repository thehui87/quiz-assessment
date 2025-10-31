"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Check, Save, Loader2, RefreshCw } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// Define the shape of a single answer option, including its database ID
interface AnswerOption {
  id?: string; // Optional for new options
  text: string;
  is_correct: boolean;
  question_id?: string;
}

// Define the shape of a single question, including its database ID
interface Question {
  id?: string; // Optional for new questions
  text: string;
  type: "single_choice";
  options: AnswerOption[];
  tempId: number;
}

// Define the shape of the entire quiz state
interface QuizState {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

// --- Utility Components (Reused/Adapted from Create Page) ---

/**
 * Renders a single answer option input with a correct/incorrect toggle.
 */
const AnswerInput: React.FC<{
  option: AnswerOption;
  qIndex: number;
  oIndex: number;
  updateOption: (qIndex: number, oIndex: number, option: Partial<AnswerOption>) => void;
  removeOption: (qIndex: number, oIndex: number) => void;
  canRemove: boolean;
}> = ({ option, qIndex, oIndex, updateOption, removeOption, canRemove }) => (
  <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
    {/* Correct Answer Toggle */}
    <button
      type="button"
      onClick={() => updateOption(qIndex, oIndex, { is_correct: !option.is_correct })}
      className={`p-2 rounded-full transition-colors duration-200 flex-shrink-0 ${
        option.is_correct
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200"
      }`}
      aria-label={option.is_correct ? "Mark as Incorrect" : "Mark as Correct"}
    >
      <Check className="w-4 h-4" />
    </button>

    {/* Answer Text Input */}
    <input
      type="text"
      required
      value={option.text}
      onChange={e => updateOption(qIndex, oIndex, { text: e.target.value })}
      placeholder={`Option ${oIndex + 1} text`}
      className="flex-grow px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
    />

    {/* Remove Option Button */}
    {canRemove && (
      <button
        type="button"
        onClick={() => removeOption(qIndex, oIndex)}
        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full"
        aria-label="Remove option"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

/**
 * Renders the full question editor.
 */
const QuestionEditor: React.FC<{
  question: Question;
  qIndex: number;
  updateQuestion: (qIndex: number, qUpdate: Partial<Question>) => void;
  updateOption: (qIndex: number, oIndex: number, option: Partial<AnswerOption>) => void;
  addOption: (qIndex: number) => void;
  removeOption: (qIndex: number, oIndex: number) => void;
  removeQuestion: (qIndex: number) => void;
}> = props => {
  const { question, qIndex, updateQuestion, addOption, removeOption } = props;
  const canRemoveOption = question.options.length > 2; // Must have at least two options

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border-t-4 border-indigo-500 dark:border-indigo-400 space-y-4">
      <div className="flex justify-between items-start border-b pb-3">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Question {qIndex + 1}
        </h3>
        <button
          type="button"
          onClick={() => props.removeQuestion(qIndex)}
          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label={`Remove Question ${qIndex + 1}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Question Text Input */}
      <div>
        <label
          htmlFor={`q-text-${question.tempId}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Question Text
        </label>
        <textarea
          id={`q-text-${question.tempId}`}
          required
          value={question.text}
          onChange={e => updateQuestion(qIndex, { text: e.target.value })}
          rows={3}
          placeholder="Type the quiz question here..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
        />
      </div>

      {/* Answer Options Section */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Answer Options (Mark the correct answer)
        </h4>
        {question.options.map((option, oIndex) => (
          <AnswerInput
            key={option.id || oIndex} // Use database ID or index as fallback
            option={option}
            qIndex={qIndex}
            oIndex={oIndex}
            updateOption={props.updateOption}
            removeOption={removeOption}
            canRemove={canRemoveOption}
          />
        ))}

        {/* Add Option Button */}
        <button
          type="button"
          onClick={() => addOption(qIndex)}
          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors mt-2"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Option
        </button>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function AdminQuizEditPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [dbQuestionIds, setDbQuestionIds] = useState<string[]>([]); // All original question IDs
  const [dbOptionIds, setDbOptionIds] = useState<string[]>([]); // All original option IDs

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // --- Data Fetching ---

  useEffect(() => {
    async function fetchQuizData() {
      if (!quizId) {
        setError("Invalid Quiz ID.");
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        // 1. Fetch Quiz Metadata
        const { data: quizMeta, error: quizError } = await supabase
          .from("Quiz")
          .select("id, title, description")
          .eq("id", quizId)
          .single();

        if (quizError || !quizMeta) throw new Error(quizError?.message || "Quiz not found.");

        // 2. Fetch Questions and Answer Options
        const { data: questionsData, error: questionsError } = await supabase
          .from("Question")
          .select(`id, text, type, options:AnswerOption(id, text, is_correct)`)
          .eq("quiz_id", quizId)
          .order("created_at", { foreignTable: "AnswerOption", ascending: true })
          .order("created_at", { ascending: true }); // Order questions

        if (questionsError) throw new Error(questionsError.message);

        // Map and structure data for state
        const initialQuestions: Question[] = questionsData.map((q, index) => ({
          id: q.id,
          text: q.text,
          type: q.type as "single_choice",
          options: q.options as AnswerOption[],
          tempId: Date.now() + index, // Assign temp ID for local keying
        }));

        // Store all original IDs for cleanup later
        const originalQIds = initialQuestions.map(q => q.id!).filter(Boolean);
        const originalOIds = initialQuestions
          .flatMap(q => q.options.map(o => o.id!))
          .filter(Boolean);

        setQuiz({
          id: quizMeta.id,
          title: quizMeta.title,
          description: quizMeta.description,
          questions: initialQuestions,
        });
        setDbQuestionIds(originalQIds);
        setDbOptionIds(originalOIds);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Fetch Error:", err);
          setError(`Failed to load quiz: ${err.message}`);
        } else {
          setError("An unknown error occurred while loading the quiz");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchQuizData();
  }, [quizId]);

  // --- Quiz Management Handlers (FIXED: Using functional updates and empty dependency array) ---

  const addQuestion = useCallback(() => {
    setQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: [
          ...prev.questions,
          {
            tempId: Date.now() + prev.questions.length,
            text: "",
            type: "single_choice",
            options: [
              { text: "", is_correct: true },
              { text: "", is_correct: false },
            ],
          },
        ],
      };
    });
  }, []); // Dependency array is now empty

  const removeQuestion = useCallback((qIndex: number) => {
    setQuiz(prev => {
      if (!prev) return null;

      if (prev.questions.length > 1) {
        return {
          ...prev,
          questions: prev.questions.filter((_, i) => i !== qIndex),
        };
      } else {
        // NOTE: Setting error outside of state update, but this logic is sound.
        setError("A quiz must have at least one question.");
        return prev;
      }
    });
  }, []); // Dependency array is now empty

  const updateQuestion = useCallback((qIndex: number, qUpdate: Partial<Question>) => {
    setQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map((q, i) => (i === qIndex ? { ...q, ...qUpdate } : q)),
      };
    });
  }, []); // Dependency array is now empty

  const addOption = useCallback((qIndex: number) => {
    setQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === qIndex
            ? {
                ...q,
                // FIX: q.options is clearly an array here,
                // the issue was due to prior type confusion which this pattern resolves.
                options: [...q.options, { text: "", is_correct: false }],
              }
            : q
        ),
      };
    });
  }, []); // Dependency array is now empty

  const removeOption = useCallback((qIndex: number, oIndex: number) => {
    setQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map((q, i) => {
          if (i === qIndex && q.options.length > 2) {
            const newOptions = q.options.filter((_, j) => j !== oIndex);
            // Ensure at least one option remains correct if the correct one was removed
            if (!newOptions.some(o => o.is_correct)) {
              newOptions[0].is_correct = true;
            }
            return { ...q, options: newOptions };
          }
          return q;
        }),
      };
    });
  }, []); // Dependency array is now empty

  const updateOption = useCallback(
    (qIndex: number, oIndex: number, optionUpdate: Partial<AnswerOption>) => {
      setQuiz(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.map((q, i) => {
            if (i === qIndex) {
              const newOptions = q.options.map((o, j) => {
                if (j === oIndex) {
                  return { ...o, ...optionUpdate };
                }
                // If marking one correct, ensure all others are incorrect (single choice logic)
                if (optionUpdate.is_correct === true) {
                  return { ...o, is_correct: false };
                }
                return o;
              });
              return { ...q, options: newOptions };
            }
            return q;
          }),
        };
      });
    },
    []
  ); // Dependency array is now empty

  // --- Validation (Reused) ---

  const isFormValid = useMemo(() => {
    if (!quiz) return false;
    if (!quiz.title.trim() || !quiz.description.trim()) return false;

    for (const question of quiz.questions) {
      if (!question.text.trim()) return false;
      const correctOptions = question.options.filter(o => o.is_correct);

      // Must have exactly one correct option, and all options must have text
      if (correctOptions.length !== 1 || question.options.some(o => !o.text.trim())) {
        return false;
      }
    }
    return true;
  }, [quiz]);

  // --- Submission Handler (Complex Update/Upsert Logic) ---

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSaving || !quiz) return;

    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      // 1. Update Quiz Metadata
      const { error: quizError } = await supabase
        .from("Quiz")
        .update({
          title: quiz.title,
          description: quiz.description,
        })
        .eq("id", quiz.id);

      if (quizError) throw new Error(quizError.message || "Failed to update quiz metadata.");

      // --- Prep for Question/Option Upsert ---

      const currentQIds = quiz.questions.map(q => q.id).filter(Boolean) as string[];
      const deletedQIds = dbQuestionIds.filter(id => !currentQIds.includes(id));

      const currentOIds = quiz.questions
        .flatMap(q => q.options.map(o => o.id))
        .filter(Boolean) as string[];
      const deletedOIds = dbOptionIds.filter(id => !currentOIds.includes(id));

      // 2. Delete Removed Questions and Options
      if (deletedQIds.length > 0) {
        const { error: deleteQError } = await supabase
          .from("Question")
          .delete()
          .in("id", deletedQIds);
        if (deleteQError) console.error("Question Deletion Error:", deleteQError.message);
      }

      if (deletedOIds.length > 0) {
        const { error: deleteOError } = await supabase
          .from("AnswerOption")
          .delete()
          .in("id", deletedOIds);
        if (deleteOError) console.error("Option Deletion Error:", deleteOError.message);
      }

      // 3. Upsert Questions (Update existing or Insert new ones)
      const questionsToUpsert = quiz.questions.map(q => ({
        id: q.id, // null/undefined for new questions, ID for existing
        quiz_id: quiz.id,
        text: q.text,
        type: q.type,
      }));

      const { data: upsertedQuestions, error: upsertQError } = await supabase
        .from("Question")
        .upsert(questionsToUpsert, { onConflict: "id" })
        .select("id, text"); // Need IDs for the next step

      if (upsertQError || !upsertedQuestions)
        throw new Error(upsertQError?.message || "Failed to upsert questions.");

      // 4. Upsert Answer Options

      // Map temporary IDs to their new permanent database IDs
      const questionIdMap = new Map<string | number, string>();
      upsertedQuestions.forEach((dbQ, index) => {
        // Find the corresponding question in the state using the text (safe bet for matching)
        const originalQ = quiz.questions.find(stateQ => stateQ.text === dbQ.text);
        if (originalQ) {
          questionIdMap.set(originalQ.id || originalQ.tempId, dbQ.id);
        }
      });

      const optionsToUpsert = quiz.questions.flatMap(stateQ => {
        const dbQId = questionIdMap.get(stateQ.id || stateQ.tempId);
        if (!dbQId) return [];

        return stateQ.options.map(o => ({
          id: o.id, // null/undefined for new options, ID for existing
          question_id: dbQId,
          text: o.text,
          is_correct: o.is_correct,
        }));
      });

      const { error: upsertOError } = await supabase
        .from("AnswerOption")
        .upsert(optionsToUpsert, { onConflict: "id" });

      if (upsertOError) throw new Error(upsertOError.message || "Failed to upsert answer options.");

      setMessage("Quiz updated successfully!");
      // Re-fetch data to sync the state with new database IDs
      router.refresh();
      setTimeout(() => router.push("/admin/quiz"), 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Quiz Update Error:", err.message);
        setError(err.message);
      } else {
        setError("An unknown error occurred during quiz update.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mr-3" />
        <p className="text-xl text-gray-700 dark:text-gray-300">Loading Quiz Data...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-10">
        <X className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Error Loading Quiz</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        <button
          onClick={() => router.push("/admin/quiz")}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Go Back to Quiz List
        </button>
      </div>
    );
  }

  if (!quiz) return null; // Should be handled by loading/error, but defensive check

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Edit Quiz: &quot;{quiz.title}&quot;
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {quiz.id}</p>
        </div>

        {message && (
          <div className="p-4 mb-6 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-lg border border-green-300 dark:border-green-900 flex items-center">
            <Check className="w-5 h-5 mr-2" /> {message}
          </div>
        )}
        {error && (
          <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-900">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-10">
          {/* --- Quiz Metadata Section --- */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-6">
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              Quiz Details
            </h2>
            <div>
              <label
                htmlFor="quiz-title"
                className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Quiz Title
              </label>
              <input
                id="quiz-title"
                type="text"
                required
                value={quiz.title}
                onChange={e => setQuiz({ ...quiz, title: e.target.value })}
                placeholder="e.g., Introduction to Tailwind CSS"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-xl focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="quiz-description"
                className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="quiz-description"
                required
                value={quiz.description}
                onChange={e => setQuiz({ ...quiz, description: e.target.value })}
                rows={4}
                placeholder="A short summary of what the quiz covers."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>

          {/* --- Questions Section --- */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Questions ({quiz.questions.length})
            </h2>
            {quiz.questions.map((question, qIndex) => (
              <QuestionEditor
                key={question.id || question.tempId}
                question={question}
                qIndex={qIndex}
                updateQuestion={updateQuestion}
                updateOption={updateOption}
                addOption={addOption}
                removeOption={removeOption}
                removeQuestion={removeQuestion}
              />
            ))}

            {/* Add New Question Button */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full flex items-center justify-center py-3 px-4 border border-indigo-300 dark:border-indigo-700 rounded-xl shadow-lg text-lg font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              disabled={isSaving}
            >
              <Plus className="w-5 h-5 mr-2" /> Add New Question
            </button>
          </div>

          {/* --- Submit Button --- */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={!isFormValid || isSaving}
              className={`w-full flex items-center justify-center py-3 px-6 rounded-xl shadow-xl text-xl font-bold transition-all duration-300
                ${
                  !isFormValid || isSaving
                    ? "bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transform hover:scale-[1.01]"
                }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6 mr-2" /> Update Quiz
                </>
              )}
            </button>
            {!isFormValid && (
              <p className="mt-3 text-center text-sm text-red-500 dark:text-red-400">
                Please ensure the quiz has a title, description, and every question has text and
                exactly one correct option.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

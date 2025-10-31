"use client";

import React, { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Check, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { QuestionType } from "@/types/types";

// Define the shape of a single answer option
interface AnswerOption {
  text: string;
  is_correct: boolean;
}

// Define the shape of a single question
interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: AnswerOption[]; // Optional (only used for choice-based questions)
}

// Define the shape of the entire quiz state
interface QuizState {
  title: string;
  description: string;
  questions: Question[];
}

// --- Utility Components ---

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
 * Renders the full question editor, including question text and answer options.
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
  const canRemoveOption = (question.options?.length ?? 0) > 2; // Must have at least two options

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
          htmlFor={`q-text-${qIndex}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Question Text
        </label>
        <textarea
          id={`q-text-${qIndex}`}
          required
          value={question.text}
          onChange={e => updateQuestion(qIndex, { text: e.target.value })}
          rows={3}
          placeholder="Type the quiz question here..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
        />
      </div>

      {/* Question Type Selector */}
      <div>
        <label
          htmlFor={`q-type-${qIndex}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Answer Type
        </label>
        <select
          id={`q-type-${qIndex}`}
          value={question.type}
          onChange={e => updateQuestion(qIndex, { type: e.target.value as QuestionType })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="single_choice">Multiple Choice</option>
          <option value="true_false">True / False</option>
          <option value="text">Text Answer</option>
        </select>
      </div>

      {/* Answer Options Section */}
      {question.type === "single_choice" && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Answer Options (Mark the correct answer)
          </h4>
          {question.options?.map((option, oIndex) => (
            <AnswerInput
              key={oIndex}
              option={option}
              qIndex={qIndex}
              oIndex={oIndex}
              updateOption={props.updateOption}
              removeOption={props.removeOption}
              canRemove={(question.options?.length ?? 0) > 2}
            />
          ))}

          <button
            type="button"
            onClick={() => props.addOption(qIndex)}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors mt-2"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Option
          </button>
        </div>
      )}

      {question.type === "true_false" && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">True / False</h4>
          {["True", "False"].map((text, i) => (
            <div
              key={text}
              className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <input
                type="radio"
                id={`${qIndex}-${text}`}
                name={`tf-${qIndex}`}
                checked={question.options?.[i]?.is_correct ?? false}
                onChange={() =>
                  props.updateOption(qIndex, i, {
                    text,
                    is_correct: true,
                  })
                }
              />
              <label htmlFor={`${qIndex}-${text}`} className="text-gray-800 dark:text-gray-200">
                {text}
              </label>
            </div>
          ))}
        </div>
      )}

      {question.type === "text" && (
        <div>
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expected Answer (optional)
          </h4>
          <input
            type="text"
            placeholder="Example: Tailwind CSS"
            value={question.options?.[0]?.text ?? ""}
            onChange={e =>
              props.updateOption(qIndex, 0, { text: e.target.value, is_correct: true })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};

// --- Main Page Component ---

export default function AdminQuizCreatePage() {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizState>({
    title: "",
    description: "",
    questions: [
      {
        id: Date.now(),
        text: "",
        type: "single_choice",
        options: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
        ],
      },
    ],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Quiz Management Handlers ---

  const addQuestion = useCallback(() => {
    setQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now() + prev.questions.length, // Unique ID for keying
          text: "",
          type: "single_choice",
          options: [
            { text: "", is_correct: true },
            { text: "", is_correct: false },
          ],
        },
      ],
    }));
  }, []);

  const removeQuestion = useCallback(
    (qIndex: number) => {
      if (quiz.questions.length > 1) {
        setQuiz(prev => ({
          ...prev,
          questions: prev.questions.filter((_, i) => i !== qIndex),
        }));
      } else {
        setError("A quiz must have at least one question.");
      }
    },
    [quiz.questions.length]
  );

  const updateQuestion = useCallback((qIndex: number, qUpdate: Partial<Question>) => {
    setQuiz(prev => {
      // FIX: Return prev if null to satisfy SetStateAction<QuizState | null> type
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q, i) => {
          if (i !== qIndex) return q;

          const newType = qUpdate.type;
          const updatedQ = { ...q, ...qUpdate };

          // Fix: Ensure options are initialized to a valid state when question type changes.
          // This prevents validation errors (e.g., if switching from 'text' to 'single_choice'
          // where the options array might be too short or incorrectly formatted).
          if (newType && newType !== q.type) {
            let newOptions: AnswerOption[] = [];

            switch (newType) {
              case "single_choice":
                // Single-choice needs at least 2 options, with exactly one correct.
                newOptions = [
                  { text: "Option 1", is_correct: true },
                  { text: "Option 2", is_correct: false },
                ];
                break;
              case "true_false":
                // True/False needs exactly two options, with exactly one correct.
                newOptions = [
                  { text: "True", is_correct: true }, // Default correct
                  { text: "False", is_correct: false },
                ];
                break;
              case "text":
                // Text needs one option for the expected answer, marked correct.
                newOptions = [{ text: "", is_correct: true }];
                break;
            }
            updatedQ.options = newOptions;
          }

          return updatedQ;
        }),
      };
    });
  }, []);

  const addOption = useCallback((qIndex: number) => {
    setQuiz(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === qIndex
            ? {
                ...q,
                options: [...(q.options || []), { text: "", is_correct: false }],
              }
            : q
        ),
      };
    });
  }, []);

  const removeOption = useCallback((qIndex: number, oIndex: number) => {
    setQuiz(prev => {
      // FIX: Return prev if null to satisfy SetStateAction<QuizState | null> type
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q, i) => {
          if (i === qIndex) {
            // CRITICAL FIX 2: Ensure options exists before filtering
            const currentOptions = q.options || [];

            if (currentOptions.length > 2) {
              const newOptions = currentOptions.filter((_, j) => j !== oIndex);

              // Fix: If the only correct option was removed, set the first remaining one as correct.
              // This is essential for single_choice validation (exactly one correct).
              if (!newOptions.some(o => o.is_correct)) {
                if (newOptions.length > 0) {
                  newOptions[0] = { ...newOptions[0], is_correct: true };
                }
              }
              return { ...q, options: newOptions };
            }
          }
          return q;
        }),
      };
    });
  }, []);

  const updateOption = useCallback(
    (qIndex: number, oIndex: number, optionUpdate: Partial<AnswerOption>) => {
      setQuiz(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q, i) => {
            if (i === qIndex) {
              // 1. Initialize options array if it's undefined
              let currentOptions = q.options || [];

              // 2. Handle initialization for 'text' type if array is empty
              if (oIndex === 0 && currentOptions.length === 0 && q.type === "text") {
                currentOptions = [{ text: "", is_correct: true }];
              }

              // 3. Prevent update if index is out of bounds
              if (oIndex >= currentOptions.length) {
                return q;
              }

              const newOptions = currentOptions.map((o, j) => {
                if (j === oIndex) {
                  // Apply the update to the target option
                  // Since 'o' is of type AnswerOption, spreading 'o' ensures 'is_correct' is present.
                  return { ...o, ...optionUpdate };
                }

                // 4. Single-Correct Enforcement (applies to single_choice and true_false)
                // If the target option (in the current update) is being marked as correct, de-correct all others.
                // We check for 'true' explicitly to ensure this is a boolean, resolving the type error.
                if (
                  (q.type === "single_choice" || q.type === "true_false") &&
                  optionUpdate.is_correct === true
                ) {
                  return { ...o, is_correct: false };
                }
                return o;
              });

              // 5. Special handling for Text type (cleanup/reset)
              let finalOptions = newOptions;
              if (q.type === "text") {
                // Ensure only the first option exists and is marked correct (for answer text storage)
                // This ensures is_correct is always true for the text answer option.
                finalOptions = newOptions.slice(0, 1).map(o => ({ ...o, is_correct: true }));
              }
              // NOTE: The previous special True/False logic block was removed as the single-correct check
              // in step 4 correctly handles the radio button input (which always passes is_correct: true).

              return { ...q, options: finalOptions };
            }
            return q;
          }),
        };
      });
    },
    []
  );

  // --- Validation ---

  const isFormValid = useMemo(() => {
    if (!quiz.title.trim() || !quiz.description.trim()) return false;

    for (const question of quiz.questions) {
      if (!question.text.trim()) return false;

      if (question.type === "single_choice") {
        const correctOptions = question.options?.filter(o => o.is_correct);
        if (
          !question.options?.length ||
          correctOptions?.length !== 1 ||
          question.options.some(o => !o.text.trim())
        )
          return false;
      } else if (question.type === "true_false") {
        const correct = question.options?.some(o => o.is_correct);
        if (!correct) return false;
      } else if (question.type === "text") {
        if (!question.options?.[0]?.text.trim()) return false;
      }
    }
    return true;
  }, [quiz]);

  // --- Submission Handler ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Insert Quiz Metadata
      const { data: quizData, error: quizError } = await supabase
        .from("Quiz")
        .insert({
          title: quiz.title,
          description: quiz.description,
          // created_by is handled by RLS/database triggers on the server
        })
        .select()
        .single();

      if (quizError || !quizData) {
        throw new Error(quizError?.message || "Failed to create quiz.");
      }

      const quizId = quizData.id;

      // 2. Prepare Questions and Answers for bulk insert
      const questionsToInsert = quiz.questions.map(q => ({
        quiz_id: quizId,
        text: q.text,
        type: q.type,
      }));

      // 2a. Insert Questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("Question")
        .insert(questionsToInsert)
        .select("id"); // Select the new question IDs

      if (questionsError || !questionsData) {
        // NOTE: In a real app, we'd roll back the quiz insert here (e.g., via functions/transactions)
        throw new Error(questionsError?.message || "Failed to insert questions.");
      }

      // 2b. Map the new IDs back to the original quiz structure to associate options
      const questionIdMap = new Map(
        quiz.questions.map((q, index) => [q.id, questionsData[index].id])
      );

      const optionsToInsert = quiz.questions.flatMap(q => {
        const questionDbId = questionIdMap.get(q.id);

        if (q.type === "single_choice" || q.type === "true_false") {
          return q.options!.map(o => ({
            question_id: questionDbId,
            text: o.text,
            is_correct: o.is_correct,
          }));
        }

        if (q.type === "text") {
          return [
            {
              question_id: questionDbId,
              text: q.options?.[0]?.text || "",
              is_correct: true,
            },
          ];
        }

        return [];
      });

      // 2c. Insert Options
      const { error: optionsError } = await supabase.from("AnswerOption").insert(optionsToInsert);

      if (optionsError) {
        throw new Error(optionsError.message || "Failed to insert answer options.");
      }

      // Success
      alert(`Quiz "${quiz.title}" created successfully!`); // Use alert for simplicity, but a proper modal is preferred
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Quiz Creation Error:", err.message);
        setError(err.message);
      } else {
        setError("An unknown error occurred during quiz creation");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 border-b pb-4">
          Create New Quiz
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Design your quiz by providing a title, description, and at least one question with
          multiple choice options.
        </p>

        {error && (
          <div className="p-4 mb-6 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-900">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
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
                key={question.id}
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
              disabled={loading}
            >
              <Plus className="w-5 h-5 mr-2" /> Add New Question
            </button>
          </div>

          {/* --- Submit Button --- */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full flex items-center justify-center py-3 px-6 rounded-xl shadow-xl text-xl font-bold transition-all duration-300
                ${
                  !isFormValid || loading
                    ? "bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transform hover:scale-[1.01]"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Saving Quiz...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6 mr-2" /> Publish Quiz
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

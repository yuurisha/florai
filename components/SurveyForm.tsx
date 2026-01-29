'use client';

import React, { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { auth } from "@/lib/firebaseConfig";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

type QuestionType = 'text' | 'mcq' | 'rating';

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
}

// Note: user is not guaranteed to be defined here on first render
// const user = auth.currentUser; 

interface SurveyFormProps {
  onSurveySaved?: () => void;
  survey?: {
    id?: string;
    title: string;
    description: string;
    isPublished: boolean;
    isVisible: boolean;
    questions: Question[];
  }; onCancelEdit?: () => void;
}

export default function SurveyForm({ onSurveySaved, survey, onCancelEdit }: SurveyFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<{ title?: string; description?: string; questions?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (survey) {
      setTitle(survey.title || '');
      setDescription(survey.description || '');
      // Ensure questions have an id for keying/deletion if they don't from firestore (though typically they would)
      const mappedQuestions = survey.questions.map(q => ({
        ...q,
        id: q.id || Date.now() + Math.random(), // Add a temporary ID if missing
      }));
      setQuestions(mappedQuestions || []);
    }
  }, [survey]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setQuestions([]);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), text: '', type: 'text', options: [] },
    ]);
  };

  const updateQuestion = (index: number, updated: Partial<Question>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updated };
    setQuestions(updatedQuestions);
  };
  
  // New function to remove a question
  const removeQuestion = (qIndex: number) => {
    setQuestions(questions.filter((_, index) => index !== qIndex));
  };

  const updateMCQOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const options = updated[qIndex].options || [];
    options[optIndex] = value;
    updated[qIndex].options = options;
    setQuestions(updated);
  };

  const addMCQOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = [...(updated[qIndex].options || []), ''];
    setQuestions(updated);
  };

  // New function to remove an MCQ option
  const removeMCQOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const options = updated[qIndex].options || [];
    updated[qIndex].options = options.filter((_, index) => index !== optIndex);
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Filter out any questions that are empty (optional cleanup)
  const validQuestions = questions.filter(q => q.text.trim() !== '');
  const nextErrors: { title?: string; description?: string; questions?: string } = {};
  if (!title.trim()) nextErrors.title = "Title is required.";
  if (!description.trim()) nextErrors.description = "Description is required.";
  if (validQuestions.length === 0) nextErrors.questions = "Add at least 1 question.";
  if (Object.keys(nextErrors).length > 0) {
    setErrors(nextErrors);
    setBanner("Please complete all required fields before saving.");
    return;
  }

  const newSurvey = {
    title,
    description,
    isPublished: survey?.isPublished || false,
    isVisible: survey?.isVisible || false,
    questions: validQuestions, // Use validated questions
  };

  try {
    if (survey?.id) {
      // Update existing survey
      const docRef = doc(db, "surveys", survey.id);
      await updateDoc(docRef, newSurvey);
      toast.success("Survey updated!");
    } else {
      // Create new survey with createdAt and createdBy
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated.");

      await addDoc(collection(db, "surveys"), {
        ...newSurvey,
        createdAt: serverTimestamp(),
        isFavorite: false,
        createdBy: currentUser.uid,
      });

      toast.success("Survey created!");
    }

    resetForm();
    setErrors({});
    setBanner(null);
    if (onSurveySaved) onSurveySaved();
  } catch (error) {
    console.error("Error saving survey:", error);
    toast.error("Failed to save survey.");
  }
};


  return (
  <form
    className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    onSubmit={handleSubmit}
  >
    {banner ? (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {banner}
      </div>
    ) : null}

    <div>
      <label className="block mb-1 font-medium text-gray-800">Survey Title</label>
      <input
        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (errors.title) {
            setErrors((prev) => ({ ...prev, title: undefined }));
          }
          if (banner) setBanner(null);
        }}
        required
      />
    </div>

    <div>
      <label className="block mb-1 font-medium text-gray-800">Description</label>
      <textarea
        className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          if (errors.description) {
            setErrors((prev) => ({ ...prev, description: undefined }));
          }
          if (banner) setBanner(null);
        }}
        required
        rows={4}
      />
    </div>

    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">Questions</h3>

      {questions.map((q, i) => (
        <div key={q.id} className="border border-gray-100 p-5 rounded-2xl bg-[#fbfdfb] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-semibold text-gray-900">Question {i + 1}</h4>

            <button
              type="button"
              onClick={() => removeQuestion(i)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>

          <input
            className="w-full border border-gray-200 px-4 py-2 rounded-xl"
            placeholder={`Question ${i + 1} text`}
            value={q.text}
            onChange={(e) => updateQuestion(i, { text: e.target.value })}
            required
          />

          <select
            className="border border-gray-200 px-3 py-2 rounded-xl text-sm"
            value={q.type}
            onChange={(e) =>
              updateQuestion(i, {
                type: e.target.value as QuestionType,
                options: e.target.value === "mcq" ? (q.options || [""]) : [],
              })
            }
          >
            <option value="text">Open-ended Text</option>
            <option value="mcq">Multiple Choice</option>
            <option value="rating">Rating Scale (1–5)</option>
          </select>

          {q.type === "mcq" && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <p className="font-medium text-sm text-gray-700">Options</p>

              {(q.options || []).map((opt, optIndex) => (
                <div key={optIndex} className="flex gap-2 items-center">
                  <input
                    className="flex-grow border border-gray-200 px-3 py-2 rounded-xl"
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) => updateMCQOption(i, optIndex, e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeMCQOption(i, optIndex)}
                    className="text-red-500 hover:text-red-700 px-2"
                    aria-label={`Remove option ${optIndex + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addMCQOption(i)}
                className="text-green-700 text-sm font-medium hover:underline"
              >
                + Add Option
              </button>
            </div>
          )}

          {q.type === "rating" && (
            <p className="text-gray-600 text-sm">
              Users will select a rating from 1 to 5.
            </p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
      >
        + Add Question
      </button>
    </div>

    {/* Buttons row */}
    <div className="flex flex-wrap gap-3 pt-2">
      <button
        type="submit"
        className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
      >
        {survey?.id ? "Update Survey" : "Save Survey"}
      </button>

    </div>
  </form>
);

}

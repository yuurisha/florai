'use client';

import React, { useState, useEffect } from 'react';
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

const user = auth.currentUser;

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

  useEffect(() => {
    if (survey) {
      setTitle(survey.title || '');
      setDescription(survey.description || '');
      setQuestions(survey.questions || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newSurvey = {
    title,
    description,
    isPublished: survey?.isPublished || false,
    isVisible: survey?.isVisible || false,
    questions,
  };

  try {
    if (survey?.id) {
      // Update existing survey
      const docRef = doc(db, "surveys", survey.id);
      await updateDoc(docRef, newSurvey);
      alert("✅ Survey updated!");
    } else {
      // Create new survey with createdAt and createdBy
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated.");

      await addDoc(collection(db, "surveys"), {
        ...newSurvey,
        createdAt: serverTimestamp(), // or serverTimestamp()
        createdBy: currentUser.uid,
      });
      alert("✅ Survey created!");
    }

    resetForm();
    if (onSurveySaved) onSurveySaved();
  } catch (error) {
    console.error("Error saving survey:", error);
    alert("❌ Failed to save survey.");
  }
};


  return (
    <form className="space-y-4 bg-white p-6 border rounded shadow" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 font-medium">Survey Title</label>
        <input
          className="w-full border px-3 py-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          className="w-full border px-3 py-2 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Questions</h3>
        {questions.map((q, i) => (
          <div key={q.id} className="border p-4 rounded space-y-2 bg-gray-50">
            <input
              className="w-full border px-2 py-1 rounded"
              placeholder={`Question ${i + 1}`}
              value={q.text}
              onChange={(e) => updateQuestion(i, { text: e.target.value })}
              required
            />
            <select
              className="border px-2 py-1 rounded"
              value={q.type}
              onChange={(e) => updateQuestion(i, { type: e.target.value as QuestionType })}
            >
              <option value="text">Open-ended Text</option>
              <option value="mcq">Multiple Choice</option>
              <option value="rating">Rating Scale (1–5)</option>
            </select>

            {q.type === 'mcq' && (
              <div className="space-y-2">
                {(q.options || []).map((opt, optIndex) => (
                  <input
                    key={optIndex}
                    className="w-full border px-2 py-1 rounded"
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) => updateMCQOption(i, optIndex, e.target.value)}
                    required
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addMCQOption(i)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Add Option
                </button>
              </div>
            )}

            {q.type === 'rating' && (
              <p className="text-gray-600 text-sm">Users will select a rating from 1 to 5.</p>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          + Add Question
        </button>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {survey?.id ? 'Update Survey' : 'Save Survey'}
        </button>

        {survey?.id && (
          <button
          type="button"
          onClick={() => {
            resetForm();
            if (onCancelEdit) onCancelEdit(); // <-- Tell parent to unset editing
          }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
}
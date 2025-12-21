"use client";

import React from "react";
import Link from "next/link";

interface Question {
  id: number;
  text: string;
  type: string;
  options?: string[];
}

interface Survey {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  isVisible: boolean;
  questions: Question[];
  createdAt?: any;
}

type SurveyTableProps = {
  surveys: Survey[];
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, currentStatus: boolean) => void;
  onEdit: (survey: Survey) => void;
  sortOrder: "latest" | "oldest";
};

export default function SurveyTable({
  surveys,
  onDelete,
  onTogglePublish,
  onEdit,
  sortOrder,
}: SurveyTableProps) {
  const sortedSurveys = [...surveys].sort((a, b) => {
    const aTime = a.createdAt?.toDate().getTime() ?? 0;
    const bTime = b.createdAt?.toDate().getTime() ?? 0;
    return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className="overflow-x-auto border rounded shadow mt-8 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2 text-center">Published</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedSurveys.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                No surveys found
              </td>
            </tr>
          ) : (
            sortedSurveys.map((survey) => (
              <tr key={survey.id} className="border-t">
                <td className="px-4 py-2 text-green-700 font-medium hover:underline">
                  <Link href={`/manage-survey/preview/${survey.id}`}>
                    {survey.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {survey.createdAt
                    ? survey.createdAt.toDate().toLocaleDateString()
                    : "Unknown"}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() =>
                      onTogglePublish(survey.id, survey.isPublished)
                    }
                    className={`px-2 py-1 rounded text-sm ${
                      survey.isPublished
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {survey.isPublished ? "Hide" : "Publish"}
                  </button>
                </td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => onEdit(survey)}
                    className="px-2 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(survey.id)}
                    className="px-2 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <Link
                    href={`/manage-survey/responses/${survey.id}`}
                    className="px-2 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                  >
                    Responses
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
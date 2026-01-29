"use client";

import React from "react";
import Link from "next/link";
// Import the Heart icon (using a simple SVG path for demonstration)
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline"; 
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid"; 


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
  isFavorite?: boolean; 
}

type SurveyTableProps = {
  surveys: Survey[];
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, currentStatus: boolean) => void;
  onEdit: (survey: Survey) => void;
  sortOrder: "latest" | "oldest";
  // **NEW PROP:** Handler for toggling favorite status
  onToggleFavorite: (id: string, currentStatus: boolean) => void; 
};

export default function SurveyTable({
  surveys,
  onDelete,
  onTogglePublish,
  onEdit,
  sortOrder,
  // Destructure the new prop
  onToggleFavorite,
}: SurveyTableProps) {
  const sortedSurveys = [...surveys].sort((a, b) => {
    // Logic to sort by creation time (existing logic)
    const aTime = a.createdAt?.toDate().getTime() ?? 0;
    const bTime = b.createdAt?.toDate().getTime() ?? 0;
    // Otherwise, sort by date
    return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className="overflow-x-auto text-sm"> {/* Removed border/shadow/bg/mt since they are now in the parent component */}
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
              <tr 
                key={survey.id} 
                className={`border-t `} 
              >
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
                <td className="px-4 py-2 text-center space-x-2 flex items-center justify-center">
                  {/* **NEW FAVORITE BUTTON** */}
                  <button
                    onClick={() => onToggleFavorite(survey.id, survey.isFavorite ?? false)}
                    className="p-1 rounded text-gray-500 hover:text-red-500 transition-colors"
                    title={survey.isFavorite ? "Unfavorite Survey" : "Favorite Survey"}
                  >
                    {/* Render solid heart if favorited, outline if not */}
                    {survey.isFavorite ? (
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500">
                         <path d="M11.645 20.91l-.007.003-.002.001-.002.001-.006.003-1.036.726a2.25 2.25 0 01-2.072 0l-1.036-.726c-.004-.002-.007-.003-.01-.005a18.3 18.3 0 01-3.268-2.61l-.657-.66c-1.58-.93-2.332-2.83-2.332-4.545 0-2.428 1.942-4.417 4.298-4.502a5.955 5.955 0 013.344 1.166 6.003 6.003 0 013.785 0 5.953 5.953 0 013.344-1.166C20.417 6.338 22 8.327 22 10.755c0 1.715-.752 3.615-2.332 4.545l-.657.66c-.958.95-2.094 1.83-3.268 2.61l-.01.005-.002.001-.002.001-.007.003z" />
                       </svg>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.815 3 8.25c0 7.218 8.44 10.975 9.424 11.516a.75.75 0 00.152 0C12.56 19.225 21 15.468 21 8.25z" />
                       </svg>
                    )}
                  </button>
                  {/* Existing Buttons */}
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
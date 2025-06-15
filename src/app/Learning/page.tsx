"use client";

import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";
import { BookOpenText, MessageCircleQuestion, Lightbulb, Calendar } from "lucide-react";

export default function LearningMainPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavBar />
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-center mb-10 text-green-700">Learn with Us!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <Link href="/Learning/resources">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition cursor-pointer text-center h-full flex flex-col">
              <BookOpenText className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Learning Resources</h2>
              <p className="text-sm text-gray-500">Access tips, reading materials and videos.</p>
            </div>
          </Link>

          <Link href="/Learning/forum">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition cursor-pointer text-center h-full flex flex-col">
              <MessageCircleQuestion className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Discussion Forum</h2>
              <p className="text-sm text-gray-500">Join the conversation with peers.</p>
            </div>
          </Link>

          <Link href="/Learning/tips">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition cursor-pointer text-center h-full flex flex-col">
              <Calendar className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Events</h2>
              <p className="text-sm text-gray-500">View sustainable events and activities.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

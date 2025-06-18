"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import TopNavBar2 from "@/components/TopNavBar2";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

interface Survey {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  isVisible: boolean;
  createdAt?: Timestamp;
}

export default function SurveyListPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchSurveys(u);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSurveys = async (user: User) => {
    try {
      const resSnap = await getDocs(
        query(collection(db, "responses"), where("userId", "==", user.uid))
      );
      const takenSurveyIds = resSnap.docs.map((doc) => doc.data().surveyId);

      const surveySnap = await getDocs(collection(db, "surveys"));
      const available = surveySnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Survey))
        .filter(
          (s) => s.isPublished && s.isVisible && !takenSurveyIds.includes(s.id)
        );

      setSurveys(available);
    } catch (error) {
      console.error("Failed to load surveys", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedSurveys = [...surveys].sort((a, b) => {
    const aTime = a.createdAt?.toDate().getTime() ?? 0;
const bTime = b.createdAt?.toDate().getTime() ?? 0;

    return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
  });

  return (
    <>
      <TopNavBar2 />
      <div className="min-h-screen bg-[#f4fbf4] py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-green-800">Available Surveys</h1>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
              className="border border-gray-300 px-3 py-1 rounded text-sm"
            >
              <option value="latest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>

          {loading ? (
            <div className="text-gray-600 text-center mt-20">Loading your surveys...</div>
          ) : !user ? (
            <div className="text-gray-600 text-center mt-20">Please log in to view available surveys.</div>
          ) : sortedSurveys.length === 0 ? (
            <div className="text-gray-600 text-center mt-20">No new surveys available for you.</div>
          ) : (
            <ul className="space-y-4">
              {sortedSurveys.map((survey) => (
                <li
                  key={survey.id}
                  className="bg-white p-5 rounded shadow border hover:shadow-md transition flex justify-between items-start"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {survey.title}
                    </h2>
                    <p className="text-gray-600 mb-2">{survey.description}</p>
                    <p className="text-sm text-gray-500">
                      Created on:{" "}
                      {survey.createdAt
                        ? survey.createdAt.toDate().toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <Link
                    href={`/survey/${survey.id}`}
                    className="ml-4 shrink-0 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Take Survey
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

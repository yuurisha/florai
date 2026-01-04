"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import TopNavBar2 from "@/components/TopNavBar";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

interface Survey {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  isVisible: boolean;
  createdAt?: Timestamp;
}

type SurveyStatus = "available" | "completed";

interface SurveyWithStatus extends Survey {
  status: SurveyStatus;
}

export default function SurveyListPage() {
  const [surveys, setSurveys] = useState<SurveyWithStatus[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [filter, setFilter] = useState<"all" | "available" | "completed">("all");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchSurveys(u);
      } else {
        setLoading(false);
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSurveys = async (user: User) => {
    try {
      // Responses by this user -> determine completed surveys
      const resSnap = await getDocs(
        query(collection(db, "responses"), where("userId", "==", user.uid))
      );
      const takenSurveyIds = new Set(resSnap.docs.map((d) => d.data().surveyId));

      // Load surveys
      const surveySnap = await getDocs(collection(db, "surveys"));
      const all = surveySnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Survey))
        .filter((s) => s.isPublished && s.isVisible)
        .map((s) => ({
          ...s,
          status: takenSurveyIds.has(s.id) ? "completed" : "available",
        })) as SurveyWithStatus[];

      setSurveys(all);
    } catch (error) {
      console.error("Failed to load surveys", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleSurveys = useMemo(() => {
    const filtered =
      filter === "all"
        ? surveys
        : surveys.filter((s) => s.status === filter);

    const sorted = [...filtered].sort((a, b) => {
      const aTime = a.createdAt?.toDate().getTime() ?? 0;
      const bTime = b.createdAt?.toDate().getTime() ?? 0;
      return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
    });

    return sorted;
  }, [surveys, filter, sortOrder]);

  const Badge = ({ status }: { status: SurveyStatus }) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
    if (status === "available") {
      return (
        <span className={`${base} bg-green-50 text-green-700 border-green-200`}>
          Available
        </span>
      );
    }
    return (
      <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>
        Completed
      </span>
    );
  };

  const Pill = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-full text-sm font-medium border transition",
        active
          ? "bg-green-600 text-white border-green-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <>
      <TopNavBar2 />
      <div className="min-h-screen bg-[#f4fbf4] py-10 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header row (Diary-like) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-green-800">
                  Surveys
                </h1>
                
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "latest" | "oldest")
                  }
                  className="border border-gray-200 bg-white px-3 py-2 rounded-lg text-sm"
                >
                  <option value="latest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-5 flex-wrap">
              <Pill
                label="All"
                active={filter === "all"}
                onClick={() => setFilter("all")}
              />
              <Pill
                label="Available"
                active={filter === "available"}
                onClick={() => setFilter("available")}
              />
              <Pill
                label="Completed"
                active={filter === "completed"}
                onClick={() => setFilter("completed")}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-gray-600 text-center mt-10">
              Loading your surveys...
            </div>
          ) : !user ? (
            <div className="text-gray-600 text-center mt-10">
              Please log in to view surveys.
            </div>
          ) : visibleSurveys.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-600">
              No surveys found for this filter.
            </div>
          ) : (
            <ul className="space-y-4">
              {visibleSurveys.map((survey) => (
                <li
                  key={survey.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {survey.title}
                        </h2>
                        <Badge status={survey.status} />
                      </div>

                      <p className="text-gray-600 mt-2 line-clamp-2">
                        {survey.description}
                      </p>

                      <div className="mt-3 text-sm text-gray-500">
                        Created on:{" "}
                        {survey.createdAt
                          ? survey.createdAt.toDate().toLocaleDateString()
                          : "Unknown"}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {survey.status === "available" ? (
                        <Link
                          href={`/survey/${survey.id}`}
                          className="inline-flex items-center justify-center bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                        >
                          Take Survey
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center bg-gray-100 text-gray-500 px-5 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed"
                        >
                          Completed
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

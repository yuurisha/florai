"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import AdminTopNavbar from "@/components/adminTopNavBar";
import Link from "next/link";

export default function SurveyPreviewPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchSurvey = async () => {
      const ref = doc(db, "surveys", id as string);
      const snap = await getDoc(ref);
      if (snap.exists()) setSurvey({ id: snap.id, ...snap.data() });
    };
    fetchSurvey();
  }, [id]);

  const handleChange = (qid: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  if (!survey) return <p className="p-6 text-gray-600">Loading survey preview...</p>;

  return (
    <>
      <AdminTopNavbar />
      <div className="min-h-screen bg-[#f4fbf4] px-6 py-10">
  <div className="max-w-4xl mx-auto space-y-4">
    <div className="flex justify-end">
      <Link
        href="/manage-survey"
        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        ← Back
      </Link>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-2 text-green-800">{survey.title}</h1>
      <p className="text-gray-600 mb-4">{survey.description}</p>

      <form className="space-y-4">
        {survey.questions?.map((q: any, index: number) => (
          <div key={q.id} className="bg-[#fbfdfb] border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-gray-900">
                Q{index + 1}. {q.text}
              </label>
              <span className="text-xs text-gray-500">
                {index + 1} / {survey.questions.length}
              </span>
            </div>

            {q.type === "text" && (
              <textarea
                className="w-full border border-gray-200 px-4 py-3 rounded-xl bg-white"
                rows={4}
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}

            {q.type === "mcq" && (
              <div className="space-y-2">
                {(q.options || []).map((opt: string, i: number) => (
                  <label key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleChange(q.id, opt)}
                    />
                    <span className="text-sm text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "rating" && (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleChange(q.id, num)}
                    className={[
                      "px-4 py-2 rounded-xl border text-sm font-medium",
                      answers[q.id] === num
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </form>
    </div>
  </div>
</div>

    </>
  );
}


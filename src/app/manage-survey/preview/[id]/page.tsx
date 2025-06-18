"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import TopNavBar from "@/components/TopNavBar"; // or TopNavBar2 if preferred

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
      <TopNavBar />
      <div className="min-h-screen bg-[#f4fbf4] p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold mb-2 text-green-800">{survey.title}</h1>
          <p className="text-gray-600 mb-4">{survey.description}</p>

          <form className="space-y-4">
            {survey.questions?.map((q: any, index: number) => (
              <div
                key={q.id}
                className="p-4 border rounded bg-gray-50 space-y-2"
              >
                <label className="block font-semibold text-gray-800">
                  Q{index + 1}: {q.text}
                </label>

                {q.type === "text" && (
                  <textarea
                    className="w-full border px-3 py-2 rounded"
                    rows={3}
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                  />
                )}

                {q.type === "mcq" && (
                  <div className="space-y-1">
                    {(q.options || []).map((opt: string, i: number) => (
                      <label key={i} className="block text-sm">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => handleChange(q.id, opt)}
                          className="mr-2"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "rating" && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <label
                        key={num}
                        className="inline-flex items-center text-sm"
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={num}
                          checked={answers[q.id] === num}
                          onChange={() => handleChange(q.id, num)}
                          className="mr-1"
                        />
                        {num}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* No submit button here */}
          </form>
        </div>
      </div>
    </>
  );
}


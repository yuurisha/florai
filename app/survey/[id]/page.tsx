"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import TopNavBar2 from "@/components/TopNavBar";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import toast from "react-hot-toast";

export default function SurveyAnswerPage() {
  const { id } = useParams();
  const router = useRouter();

  const [survey, setSurvey] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchSurvey(u);
      } else {
        setLoading(false);
        setUser(null);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSurvey = async (user: User) => {
    if (!id) return;

    try {
      // Check if user already submitted
      const resSnap = await getDocs(
        query(
          collection(db, "responses"),
          where("surveyId", "==", id),
          where("userId", "==", user.uid)
        )
      );

      if (!resSnap.empty) {
        // keep it simple but less jarring than alert
        setBanner({ type: "error", msg: "You’ve already submitted this survey." });
        setTimeout(() => router.push("/survey"), 800);
        return;
      }

      const ref = doc(db, "surveys", id as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setSurvey({ id: snap.id, ...snap.data() });
      }
    } catch (err) {
      console.error("Failed to load survey or check response:", err);
      setBanner({ type: "error", msg: "Failed to load survey. Please try again." });
      toast.error("Failed to load survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (qid: string | number, value: any) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const questions = survey?.questions ?? [];
  const total = questions.length;

  const answeredCount = useMemo(() => {
    if (!questions?.length) return 0;
    return questions.reduce((count: number, q: any) => {
      const v = answers[q.id];
      const has =
        v !== undefined &&
        v !== null &&
        !(typeof v === "string" && v.trim() === "");
      return count + (has ? 1 : 0);
    }, 0);
  }, [answers, questions]);

  const canSubmit = total > 0 && answeredCount === total && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!canSubmit) {
      setBanner({ type: "error", msg: "Please answer all questions before submitting." });
      return;
    }

    setSubmitting(true);
    setBanner(null);

    try {
      await addDoc(collection(db, "responses"), {
        surveyId: id,
        userId: user.uid,
        submittedAt: serverTimestamp(),
        answers,
      });

      setBanner({ type: "success", msg: "Responses submitted. Thank you!" });
      toast.success("Responses submitted. Thank you!");
      setTimeout(() => router.push("/survey"), 900);
    } catch (error) {
      console.error("Failed to submit survey:", error);
      setBanner({ type: "error", msg: "Failed to submit. Please try again." });
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-600">Loading survey...</p>;
  if (!survey) return <p className="p-6 text-gray-600">Survey not found.</p>;

  return (
    <>
      <TopNavBar2 />
      <div className="min-h-screen bg-[#f4fbf4] px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
          {/* Banner */}
          {banner && (
            <div
              className={[
                "rounded-2xl border p-4 text-sm",
                banner.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800",
              ].join(" ")}
            >
              {banner.msg}
            </div>
          )}

          {/* Header card (Diary-style) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-2xl font-bold text-green-800">{survey.title}</h1>
            <p className="text-gray-600 mt-2">{survey.description}</p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                Questions: <span className="font-semibold text-gray-700">{total}</span>
              </span>
              <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                Answered: <span className="font-semibold text-gray-700">{answeredCount}/{total}</span>
              </span>
            </div>
          </div>

          {/* Questions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {questions.map((q: any, index: number) => {
              const currentVal = answers[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="block font-semibold text-gray-900">
                      Q{index + 1}. {q.text}
                    </label>
                    <span className="text-xs text-gray-500">
                      {index + 1} / {total}
                    </span>
                  </div>

                  {q.type === "text" && (
                    <textarea
                      className="w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200 px-4 py-3 rounded-xl bg-[#fbfdfb]"
                      rows={4}
                      value={currentVal || ""}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                    />
                  )}

                  {q.type === "mcq" && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt: string, i: number) => (
                        <label
                          key={i}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition"
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={currentVal === opt}
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
                            "px-4 py-2 rounded-xl border text-sm font-medium transition",
                            currentVal === num
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
              );
            })}
          </form>
        </div>

        {/* Sticky submit bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {answeredCount === total
                ? "All questions answered ✅"
                : `Please answer all questions (${answeredCount}/${total}).`}
            </div>

            <button
              type="button"
              onClick={() => router.push("/survey")}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Back
            </button>

            <button
              onClick={(e) => handleSubmit(e as any)}
              className={[
                "px-6 py-2.5 rounded-lg font-medium transition",
                canSubmit
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed",
              ].join(" ")}
              aria-disabled={!canSubmit}
            >
              {submitting ? "Submitting..." : "Submit Survey"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
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
import { db } from "../../../lib/firebaseConfig";
import TopNavBar2 from "../../../components/TopNavBar";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

export default function SurveyAnswerPage() {
  const { id } = useParams();
  const router = useRouter();

  const [survey, setSurvey] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchSurvey(u);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [id]);

  const fetchSurvey = async (user: User) => {
    if (!id) return;

    try {
      // Check if user has already submitted this survey
      const resSnap = await getDocs(
        query(
          collection(db, "responses"),
          where("surveyId", "==", id),
          where("userId", "==", user.uid)
        )
      );

      if (!resSnap.empty) {
        alert("✅ You’ve already submitted this survey.");
        router.push("/survey");
        return;
      }

      // Load the survey
      const ref = doc(db, "surveys", id as string);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSurvey({ id: snap.id, ...snap.data() });
      }
    } catch (err) {
      console.error("Failed to load survey or check response:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (qid: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, "responses"), {
        surveyId: id,
        userId: user.uid,
        submittedAt: serverTimestamp(),
        answers,
      });

      alert("✅ Responses submitted and saved!");
      router.push("/survey"); // Redirect back to list
    } catch (error) {
      console.error("Failed to submit survey:", error);
      alert("❌ Failed to submit survey. Please try again.");
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-600">Loading survey...</p>;
  }

  if (!survey) {
    return <p className="p-6 text-gray-600">Survey not found.</p>;
  }

  return (
    <>
      <TopNavBar2 />
      <div className="min-h-screen bg-[#f4fbf4] p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold mb-2 text-green-800">
            {survey.title}
          </h1>
          <p className="text-gray-600 mb-4">{survey.description}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              Submit Survey
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

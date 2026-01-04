"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import AdminTopNavbar from "@/components/adminTopNavBar";
import Papa from "papaparse";
import Link from "next/link";


export default function ViewResponsesPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState<any | null>(null);
  const [responses, setResponses] = useState<any[]>([]);

  // Fetch survey info (to get questions)
  const fetchSurvey = async () => {
    const ref = doc(db, "surveys", id as string);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setSurvey({ id: snap.id, ...snap.data() });
    }
  };

  // Fetch responses for this survey
  const fetchResponses = async () => {
    const q = query(collection(db, "responses"), where("surveyId", "==", id));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setResponses(data);
  };

  useEffect(() => {
    fetchSurvey();
    fetchResponses();
  }, [id]);

  const exportToCSV = () => {
    if (!survey || responses.length === 0) return;

    const data = responses.map((res, i) => {
      const row: any = { Respondent: `User ${i + 1}` };
      survey.questions.forEach((q: any) => {
        row[q.text] = res.answers[q.id] || "";
      });
      return row;
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${survey.title}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!survey) {
    return <p className="p-6 text-gray-600">Loading survey responses...</p>;
  }

  return (
    <>
      <AdminTopNavbar/>
      <div className="min-h-screen bg-[#f4fbf4] px-6 py-10">
  <div className="max-w-5xl mx-auto space-y-4">
    <div className="flex justify-end">
      <Link
        href="/manage-survey"
        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        ← Back
      </Link>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h1 className="text-2xl font-bold text-green-800 mb-2">
        Responses for: {survey.title}
      </h1>
      <p className="text-gray-600 mb-4">{survey.description}</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={exportToCSV}
          className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium"
        >
          Export to CSV
        </button>
      </div>

      {responses.length === 0 ? (
        <div className="text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
          No responses yet.
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50">
              <tr>
                <th className="border-b border-gray-100 px-4 py-3 text-left">#</th>
                {survey.questions.map((q: any) => (
                  <th key={q.id} className="border-b border-gray-100 px-4 py-3 text-left">
                    {q.text}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((res, i) => (
                <tr key={res.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-3">
                    {i + 1}
                  </td>
                  {survey.questions.map((q: any) => (
                    <td key={q.id} className="border-b border-gray-100 px-4 py-3">
                      {res.answers[q.id] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
</div>

    </>
  );
}

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import TopNavBar from "@/components/TopNavBar";
import Papa from "papaparse";

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
      <TopNavBar/>
      <div className="min-h-screen bg-[#f4fbf4] p-6">
        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Responses for: {survey.title}
          </h1>
          <p className="text-gray-600 mb-4">{survey.description}</p>

          <button
            onClick={exportToCSV}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export to CSV
          </button>

          {responses.length === 0 ? (
            <p className="text-gray-500 mt-10">No responses yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                <thead className="bg-green-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2">#</th>
                    {survey.questions.map((q: any) => (
                      <th key={q.id} className="border border-gray-300 px-4 py-2">
                        {q.text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((res, i) => (
                    <tr key={res.id} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {i + 1}
                      </td>
                      {survey.questions.map((q: any) => (
                        <td key={q.id} className="border border-gray-300 px-4 py-2">
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
    </>
  );
}

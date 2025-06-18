"use client";

import { useState, useEffect } from "react";
import SurveyForm from "@/components/SurveyForm";
import SurveyTable from "@/components/SurveyTable";
import { collection, getDocs, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import TopNavBar3 from "@/components/TopNavBar3";

export default function ManageSurveyPage() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [editingSurvey, setEditingSurvey] = useState<any | null>(null);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  const loadSurveys = async () => {
    const snapshot = await getDocs(collection(db, "surveys"));
    const loaded = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSurveys(loaded);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    const docRef = doc(db, "surveys", id);
    await updateDoc(docRef, {
      isPublished: !currentStatus,
      isVisible: !currentStatus,
    });
    loadSurveys();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "surveys", id));
    loadSurveys();
  };

  const handleEdit = (survey: any) => {
    setEditingSurvey(survey);
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  return (
    <>
      <TopNavBar3 />
      <div className="min-h-screen bg-[#f4fbf4] p-6">
        <h1 className="text-2xl font-bold text-green-800 mb-6">Manage Surveys</h1>

        <SurveyForm
          survey={editingSurvey}
          onSurveySaved={() => {
            loadSurveys();
            setEditingSurvey(null);
          }}
          onCancelEdit={() => setEditingSurvey(null)}
        />

        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-700">Survey List</h2>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
              className="border px-3 py-1 rounded text-sm"
            >
              <option value="latest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>

          <SurveyTable
            surveys={surveys}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
            onEdit={handleEdit}
            sortOrder={sortOrder}
          />
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react"; 
import SurveyForm from "@/components/SurveyForm";
import SurveyTable from "@/components/SurveyTable";
import { collection, getDocs, deleteDoc, updateDoc, doc, Timestamp, getCountFromServer, query, where } from "firebase/firestore"; 
import { db } from "@/lib/firebaseConfig";
import AdminTopNavBar from "@/components/adminTopNavBar";
import Link from "next/link"; // ⭐ Make sure Link is imported for the Favorite List

// Define the possible views
type SurveyView = "list" | "form";

// Define the required interface for type safety (optional but highly recommended)
interface Survey {
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
    isVisible: boolean;
    questions: any[];
    isFavorite?: boolean; 
    createdAt?: Timestamp; 
    [key: string]: any; 
}

// ----------------------------------------------------------------------------


export default function ManageSurveyPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [view, setView] = useState<SurveyView>("list"); 
  
  const [responseCounts, setResponseCounts] = useState<{ [key: string]: number }>({});
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  // Fetches the real count from Firebase
  const getResponsesCount = async (surveyId: string): Promise<number> => {
    const q = query(collection(db, "responses"), where("surveyId", "==", surveyId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  };
  
  const loadSurveys = async () => {
    const snapshot = await getDocs(collection(db, "surveys"));
    const loaded = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
    })) as Survey[];
    
    const surveysWithDefaults = loaded.map(s => ({
        ...s,
        isFavorite: s.isFavorite ?? false, 
    }));
    setSurveys(surveysWithDefaults);
  };

  useEffect(() => {
    if (surveys.length === 0) return;
    
    const fetchAllCounts = async () => {
        setIsLoadingResponses(true);
        const counts: { [key: string]: number } = {};
        
        const surveysToCount = surveys.filter(s => s.isFavorite); 

        await Promise.all(surveysToCount.map(async (survey) => {
            try {
                const count = await getResponsesCount(survey.id);
                counts[survey.id] = count;
            } catch (error) {
                console.error(`Error fetching count for ${survey.id}:`, error);
                counts[survey.id] = 0;
            }
        }));

        setResponseCounts(prev => ({ ...prev, ...counts }));
        setIsLoadingResponses(false);
    };

    fetchAllCounts();
  }, [surveys]);


  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    const docRef = doc(db, "surveys", id);
    await updateDoc(docRef, {
      isPublished: !currentStatus,
      isVisible: !currentStatus,
    });
    loadSurveys();
  };
  
  const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
    const docRef = doc(db, "surveys", id);
    await updateDoc(docRef, {
     isFavorite: !currentStatus,
    });
    setSurveys(prev => prev.map(s => s.id === id ? {...s, isFavorite: !currentStatus} : s));
    
    if (!currentStatus) {
        const count = await getResponsesCount(id);
        setResponseCounts(prev => ({ ...prev, [id]: count }));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "surveys", id));
    loadSurveys();
  };

  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setView("form");
  };
  
  const handleCreateNew = () => {
    setEditingSurvey(null); 
    setView("form");
  };

  const handleSurveySaved = () => {
    loadSurveys();
    setEditingSurvey(null);
    setView("list"); 
  };

  const handleCancelEdit = () => {
    setEditingSurvey(null);
    setView("list"); 
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const favoriteSurveys = useMemo(() => {
    return surveys
      .filter(s => s.isFavorite)
      .map(s => ({
        id: s.id,
        title: s.title,
        responseCount: responseCounts[s.id] ?? (isLoadingResponses ? '...' : 0), 
        survey: s, 
      }));
  }, [surveys, responseCounts, isLoadingResponses]);


  return (
  <><AdminTopNavBar />

    <div className="min-h-screen bg-[#f4fbf4] px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-800">Manage Surveys</h1>
              <p className="text-gray-600 mt-1">
                Create, publish, favorite, and review survey responses.
              </p>
            </div>

            
          </div>
        </div>

        {/* LIST VIEW */}
        {view === "list" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Survey list */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-lg font-semibold text-green-800">Survey List</h2>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                  className="border border-gray-200 bg-white px-3 py-2 rounded-lg text-sm w-fit"
                >
                  <option value="latest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>

              <div className="overflow-auto">
                <SurveyTable
                  surveys={surveys}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                  onEdit={handleEdit}
                  sortOrder={sortOrder}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>

            {/* Right: actions */}
            <div className="w-full lg:w-[360px] space-y-6">
              {/* Create card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 text-center">
                  New Survey
                </h3>

                <div
                  onClick={handleCreateNew}
                  className="flex flex-col items-center justify-center p-8 text-center
                             border-2 border-dashed border-gray-200 rounded-2xl
                             bg-[#fbfdfb] text-gray-600 cursor-pointer
                             hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mb-3 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-lg">Create New Survey</p>
                  <p className="text-sm text-gray-500 mt-1">Click to start building</p>
                </div>
              </div>

              {/* Favorites */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span className="text-red-500">❤️</span> Favorites
                </h3>

                <ul className="space-y-3">
                  {isLoadingResponses && favoriteSurveys.length > 0 ? (
                    <p className="text-sm text-gray-500 italic">Loading response counts...</p>
                  ) : favoriteSurveys.length > 0 ? (
                    favoriteSurveys.map((fav) => (
                      <li key={fav.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className="font-medium text-gray-800 truncate cursor-pointer hover:underline"
                            onClick={() => handleEdit(fav.survey)}
                          >
                            {fav.title}
                          </span>

                          <Link
                            href={`/manage-survey/responses/${fav.id}`}
                            className="text-xs text-gray-600 bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition"
                          >
                            {fav.responseCount} Responses
                          </Link>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No favorite surveys yet. Click the heart icon in the list.
                    </p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Top row with Back */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-800">
                {editingSurvey ? "Edit Survey" : "Create New Survey"}
              </h2>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="
                  px-4 py-2
                  rounded-lg
                  border border-gray-200
                  bg-white
                  text-gray-700
                  hover:bg-gray-50
                  transition
                "
              >
                ← Back
              </button>
            </div>

            <SurveyForm
              survey={editingSurvey ?? undefined}
              onSurveySaved={handleSurveySaved}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        )}
      </div>
    </div>
  </>
);}
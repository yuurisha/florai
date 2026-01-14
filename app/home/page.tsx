"use client";
import * as AuthModule from "../../context/AuthContext";
// console.log("AuthModule:", AuthModule);
import Link from "next/link";
import TopNavBar from "../../components/TopNavBar";
// import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebaseConfig";
import {
  ImagePlus,
  ActivitySquare,
  BellRing,
  SmilePlus,
  Leaf,
  User,
} from "lucide-react";


export default function HomePage() {
const { user, loading } = useAuth();
const [username, setUsername] = useState<string | null>(null);

// Fetch user's full name from Firestore
useEffect(() => {
  if (!user?.uid) return;
  
  // Set initial value from Firebase Auth immediately
  setUsername(user.displayName || "User");
  
  const fetchUserName = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data?.fullName || user.displayName || "User");
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };
  
  fetchUserName();
}, [user]);

// console.log("Auth state:", { user, loading });
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-green-700">
        Checking authentication...
      </div>
    );
  }


  return (
      <div className="min-h-screen bg-gray-100">
        <TopNavBar />
        <main className="max-w-5xl mx-auto px-4 pt-24 pb-12">
          <h1 className="text-3xl font-bold text-green-700 mb-4">
            Welcome back, {username || user?.displayName || "User"}! 👋
          </h1>
          <p className="text-gray-600 mb-10">Here’s what you can do today:</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/Dashboard">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
                <ImagePlus className="h-10 w-10 mx-auto text-green-600 mb-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Upload Plant for Health Check
                </h2>
                <p className="text-sm text-gray-500">
                  Get instant feedback on your plant health.
                </p>
              </div>
            </Link>

            <Link href="/Dashboard">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
                <ActivitySquare className="h-10 w-10 mx-auto text-green-600 mb-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Check Spread Prediction
                </h2>
                <p className="text-sm text-gray-500">
                  See if your area is at risk of invasive spread.
                </p>
              </div>
            </Link>

            <Link href="/notifications">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
                <BellRing className="h-10 w-10 mx-auto text-green-600 mb-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  View Notifications
                </h2>
                <p className="text-sm text-gray-500">
                  Stay informed with important updates.
                </p>
              </div>
            </Link>

            <Link href="/Learning/tips">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
                <SmilePlus className="h-10 w-10 mx-auto text-green-600 mb-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Read Daily Tips
                </h2>
                <p className="text-sm text-gray-500">
                  Practical habits for greener living.
                </p>
              </div>
            </Link>

            <Link href="/plants">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
                <Leaf className="h-10 w-10 mx-auto text-green-600 mb-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Explore Native Plants
                </h2>
                <p className="text-sm text-gray-500">
                  Learn about native & invasive plants in Malaysia.
                </p>
              </div>
            </Link>

            <Link href="/Learning/forum">
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
                <User className="h-10 w-10 mx-auto text-green-600 mb-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Join Community Forum
                </h2>
                <p className="text-sm text-gray-500">
                  Discuss, share, and ask questions with others.
                </p>
              </div>
            </Link>
          </div>
        </main>
      </div>
  );
}

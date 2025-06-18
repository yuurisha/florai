"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";

import TopNavBar from "@/components/TopNavBar";
import {
  ImagePlus,
  ActivitySquare,
  BellRing,
  SmilePlus,
  Leaf,
  User,
} from "lucide-react";

export default function HomePage() {
  const [username, setUsername] = useState("User");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName || "User");
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavBar />
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          Welcome back, {username}! 👋
        </h1>
        <p className="text-gray-600 mb-10">Here’s what you can do today:</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/diagnosis/upload">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
              <ImagePlus className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Upload Plant for Health Check</h2>
              <p className="text-sm text-gray-500">Get instant feedback and health suggestions.</p>
            </div>
          </Link>

          <Link href="/Dashboard">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
              <ActivitySquare className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Check Spread Prediction</h2>
              <p className="text-sm text-gray-500">See if your area is at risk of invasive spread.</p>
            </div>
          </Link>

          <Link href="/notifications">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
              <BellRing className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">View Notifications</h2>
              <p className="text-sm text-gray-500">Stay informed with important updates.</p>
            </div>
          </Link>

          <Link href="/Learning/tips">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
              <SmilePlus className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Read Daily Tips</h2>
              <p className="text-sm text-gray-500">Practical habits for greener living.</p>
            </div>
          </Link>

          <Link href="/plants">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
              <Leaf className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Explore Native Plants</h2>
              <p className="text-sm text-gray-500">Learn about native & invasive plants in Malaysia.</p>
            </div>
          </Link>

          <Link href="/Learning/forum">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md hover:bg-green-50 transition text-center min-h-[220px] flex flex-col justify-between cursor-pointer">
              <User className="h-10 w-10 mx-auto text-green-600 mb-2" />
              <h2 className="text-lg font-semibold text-gray-800">Join Community Forum</h2>
              <p className="text-sm text-gray-500">Discuss, share, and ask questions with others.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

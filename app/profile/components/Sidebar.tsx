"use client";
import { Settings, User, KeyRound, LogOut } from "lucide-react";
import { Button } from "../../../components/button";
import { signOut } from "firebase/auth";
import { auth } from "../../../lib/firebaseConfig";
import { useRouter } from "next/navigation";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {

 const router = useRouter();

  // 🔐 handleLogout logic
  const handleLogout = async () => {
    try {
      await signOut(auth); // ✅ Firebase sign-out
      router.push("/login"); // ✅ Redirect user to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className="w-64 bg-white shadow p-6 hidden md:block">
      <h2 className="text-xl font-bold text-green-700 mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5" /> Manage Account
      </h2>

      <ul className="space-y-2 text-sm font-medium text-gray-700">
        <li>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded transition 
              ${activeTab === "profile" ? "bg-green-50 text-green-700 font-semibold" : "hover:bg-gray-100 hover:text-green-700"}`}
          >
            <User className="w-4 h-4" /> Edit Profile
          </button>
        </li>

        <li>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded transition 
              ${activeTab === "credentials" ? "bg-green-50 text-green-700 font-semibold" : "hover:bg-gray-100 hover:text-green-700"}`}
          >
            <KeyRound className="w-4 h-4" /> Edit Credentials
          </button>
        </li>

        <li>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded transition hover:bg-red-50 hover:text-red-600 mt-4 text-red-500"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </li>
      </ul>
    </aside>
  );
}

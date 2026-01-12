// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";

// import Image from "next/image";
// import Link from "next/link";
// import {
//   User,
//   KeyRound,
//   LogOut,
//   Settings,
// } from "lucide-react";
// import {Button} from "@/components/button";
// import { Input } from "@/components/input";
// import { Label } from "@/components/label";
// import { auth } from "@/lib/firebaseConfig";
// import {
//   updateEmail,
//   updatePassword,
//   updateProfile,
//   onAuthStateChanged,
//   signOut,
// } from "firebase/auth";
// import { handleProfilePicChange } from "@/controller/profileController";
// import { doc, updateDoc } from "firebase/firestore";
// import { db } from "@/lib/firebaseConfig";


// import TopNavBar from "@/components/TopNavBar"; // ✅ import here

// export default function ProfilePage() {
//   const router = useRouter();

//   const [activeTab, setActiveTab] = useState<"profile" | "credentials">("profile");
//   const [profilePic, setProfilePic] = useState<string>("");
//   const fileInputRef = useRef<HTMLInputElement | null>(null); 
//   const [fullName, setFullName] = useState("");
//   const [username, setUsername] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [saved, setSaved] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setFullName(user.displayName || "");
//         setEmail(user.email || "");
//         setUsername(user.displayName || "");
//         setProfilePic(user.photoURL || "");
//       } else {
//         router.push("/login");
//       }
//     });
//     return () => unsubscribe();
//   }, [router]);

//   const handleSave = async () => {
//     const user = auth.currentUser;
//     if (!user) return;

//     try {
//     if (user.displayName !== fullName) {
//     await updateProfile(user, { displayName: fullName });
//      }
//      const userDocRef = doc(db, "users", user.uid);
//   await updateDoc(userDocRef, {
//     fullName,
//   });
//       if (user.email !== email) {
//         await updateEmail(user, email);
//       }
//       if (password && password.length >= 6 && password !== "********") {
//         await updatePassword(user, password);
//       }
//       setSaved(true);
//       setTimeout(() => setSaved(false), 3000);
//     } catch (error) {
//       console.error("Update failed:", error);
//     }
//   };

//   const handleLogout = async () => {
//     await signOut(auth);
//     router.push("/login");
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <TopNavBar /> {/* ✅ navbar injected here */}

//       <div className="flex pt-20"> {/* Adjusted to allow space for fixed navbar */}
//         {/* Sidebar */}
//         <aside className="w-64 bg-white shadow p-6 hidden md:block">
//           <h2 className="text-xl font-bold text-green-700 mb-6 flex items-center gap-2">
//             <Settings className="w-5 h-5" /> Manage Account
//           </h2>
//           <ul className="space-y-2 text-sm font-medium text-gray-700">
//             <li>
//               <button
//                 onClick={() => setActiveTab("profile")}
//                 className={`flex items-center gap-2 w-full px-3 py-2 rounded transition 
//                   ${activeTab === "profile" ? "bg-green-50 text-green-700 font-semibold" : "hover:bg-gray-100 hover:text-green-700"}`}
//               >
//                 <User className="w-4 h-4" /> Edit Profile
//               </button>
//             </li>
//             <li>
//               <button
//                 onClick={() => setActiveTab("credentials")}
//                 className={`flex items-center gap-2 w-full px-3 py-2 rounded transition 
//                   ${activeTab === "credentials" ? "bg-green-50 text-green-700 font-semibold" : "hover:bg-gray-100 hover:text-green-700"}`}
//               >
//                 <KeyRound className="w-4 h-4" /> Edit Credentials
//               </button>
//             </li>
//             <li>
//               <button
//                 onClick={handleLogout}
//                 className="flex items-center gap-2 w-full px-3 py-2 rounded transition hover:bg-red-50 hover:text-red-600 mt-4 text-red-500"
//               >
//                 <LogOut className="w-4 h-4" /> Log Out
//               </button>
//             </li>
//           </ul>
//         </aside>

//         {/* Main Content */}
//         <main className="flex-1 p-8">
//           <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
//             <h1 className="text-2xl font-bold text-green-700 mb-6">
//               {activeTab === "profile" ? "Edit Profile" : "Update Account Credentials"}
//             </h1>

//             {activeTab === "profile" && (
//               <div className="space-y-6">
//                 <div className="flex items-center gap-4">
// <div className="flex items-center gap-4">
//   <Image
//     src={profilePic || "/avatar1.png"}
//     alt="Profile Picture"
//     width={80}
//     height={80}
//     className="rounded-full border border-green-400"
//   />
//   <Button
//     variant="outline"
//     className="text-sm"
//     onClick={() => fileInputRef.current?.click()} // ✅ Trigger file input
//   >
//     Change Picture
//   </Button>
//   <input
//     ref={fileInputRef} // ✅ Attach ref
//     type="file"
//     accept="image/*"
//     className="hidden"
//     onChange={(e) => handleProfilePicChange(e, setProfilePic)} // ✅ Your existing handler
//   />
// </div>

// </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="name">Full Name</Label>
//                   <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="username">Username</Label>
//                   <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
//                 </div>
//               </div>
//             )}

//             {activeTab === "credentials" && (
//               <div className="space-y-6">
//                 <div className="space-y-2">
//                   <Label htmlFor="email">Email</Label>
//                   <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="password">Password</Label>
//                   <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-end mt-6">
//               <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
//                 Save Changes
//               </Button>
//             </div>

//             {saved && (
//               <p className="text-green-600 text-sm mt-4 text-center">✅ Changes saved successfully.</p>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import TopNavBar from "../../components/TopNavBar";
import Sidebar from "./components/Sidebar";
import ProfileForm from "./components/ProfileForm";
import CredentialsForm from "./components/CredentialsForm";
import BadgeSelector from "./components/BadgeSelector";
import ProtectedRoute from "../../components/ProtectedRoute";

console.log("ProtectedRoute:", ProtectedRoute);
console.log("Sidebar import:", Sidebar);
console.log("ProfileForm import:", ProfileForm);
console.log("CredentialsForm import:", CredentialsForm);


export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const title =
    activeTab === "profile"
      ? "Personal Information"
      : activeTab === "credentials"
        ? "Security Settings"
        : "Badges";

  return (   
      <div className="min-h-screen bg-gray-100">
      <TopNavBar />

      <div className="flex pt-20">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold text-green-700 mb-6">
              {title}
            </h1>

            {activeTab === "profile" && <ProfileForm />}
            {activeTab === "credentials" && <CredentialsForm />}
            {activeTab === "badges" && <BadgeSelector />}
          </div>
        </main>
      </div>
    </div>
  );
}

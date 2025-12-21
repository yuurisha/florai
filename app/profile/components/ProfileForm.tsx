"use client";
import { useState, useRef } from "react";
import { Input } from "../../../components/input";
import { Label } from "../../../components/label";
import { Button } from "../../../components/button";
import Image from "next/image";
import { db, auth } from "../../../lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ProfileForm() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState("/avatar1.png");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("User not signed in");
      await updateDoc(doc(db, "users", uid), { fullName, username });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Image
          src={profilePic}
          alt="Profile Picture"
          width={80}
          height={80}
          className="rounded-full border border-green-400"
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Change Picture
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button
          disabled={loading}
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

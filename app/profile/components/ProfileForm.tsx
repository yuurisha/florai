"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

import { auth, db, storage } from "../../../lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { onAuthStateChanged, updateProfile } from "firebase/auth";

import { Button } from "../../../components/button";
import { Input } from "../../../components/input";
import { Label } from "../../../components/label";

function prettyRole(role?: string) {
  if (!role) return "-";
  const r = role.toLowerCase();
  if (r === "researcher") return "Researcher";
  if (r === "student") return "Student";
  return role;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export default function ProfileForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("");
  const [profilePic, setProfilePic] = useState("/avatar1.png");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.uid) {
        setInitialLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setFullName(data?.fullName || user.displayName || "");
          setRole(data?.role || "");
          setProfilePic(data?.profilePicUrl || "/avatar1.png");
        } else {
          setFullName(user.displayName || "");
        }
      } catch {
        toast.error("Failed to load profile.");
      } finally {
        setInitialLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePickImage = () => fileInputRef.current?.click();

  // ✅ Upload to Firebase Storage + save URL in Firestore
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user?.uid) {
      toast.error("User not signed in.");
      return;
    }

    if (!isImageFile(file)) {
      toast.error("Please select an image file.");
      return;
    }

    const MAX_MB = 2;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image too large. Max ${MAX_MB}MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfilePic(previewUrl); // instant preview

    setUploadingPic(true);
    try {
      // Put file into: profilePics/{uid}/avatar
      // Using same path overwrites the old one (clean & simple)
      const ext = file.name.split(".").pop() || "jpg";
      const objectRef = ref(storage, `profilePics/${user.uid}/avatar.${ext}`);

      await uploadBytes(objectRef, file, {
        contentType: file.type,
        cacheControl: "public,max-age=3600",
      });

      const downloadUrl = await getDownloadURL(objectRef);

      await updateDoc(doc(db, "users", user.uid), {
        profilePicUrl: downloadUrl,
        profilePicUpdatedAt: new Date(),
      });

      setProfilePic(downloadUrl);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      const errorMessage = err?.code === 'not-found' 
        ? "Profile not found. Please contact support."
        : "Failed to upload profile picture. Please try again.";
      toast.error(errorMessage);
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (loading) return;

    const user = auth.currentUser;
    if (!user?.uid) {
      toast.error("User not signed in.");
      return;
    }

    const nameTrim = fullName.trim();
    if (!nameTrim) {
      toast.error("Full name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      // Update Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        fullName: nameTrim,
      });
      
      // Update Firebase Auth displayName
      await updateProfile(user, {
        displayName: nameTrim,
      });
      
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      const errorMessage = err?.code === 'not-found' 
        ? "Profile not found. Please contact support."
        : "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-green-200">
              <Image
                src={profilePic}
                alt="Profile Picture"
                fill
                className="object-cover"
                sizes="80px"
                priority
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profile</p>
              <p className="text-base font-semibold text-gray-900">
                {fullName || "Your Name"}
              </p>
              <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                Role: {prettyRole(role)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePickImage} disabled={uploadingPic}>
              {uploadingPic ? "Uploading..." : "Change Picture"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Role is set during registration and cannot be edited here.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setFullName((v) => v.trim())}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={prettyRole(role)} disabled />
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
      </div>
    </div>
  );
}

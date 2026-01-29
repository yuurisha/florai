"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";

import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import {Button} from "@/components/button";
import { Label } from "@/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { auth } from "@/lib/firebaseConfig";
import { createPost } from "@/controller/postController";
import { useRouter } from "next/navigation"; // ✅ fixed here
import TopNavBar from "@/components/TopNavBar";
import { onAuthStateChanged } from "firebase/auth";

export default function CreateDiscussionPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const router = useRouter(); // ✅ useRouter from next/navigation

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setTags("");
  };

  //handle user session auth explicitly
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User is not signed in, redirect to login
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  try {
    await createPost({
      title,
      content,
      tags: tags.split(",").map((tag) => tag.trim()),
      author: user.displayName || user.email || "Anonymous",
      date: new Date().toISOString(),
      userId: ""
    });
    router.push("/Learning/forum");
  } catch (err) {
    console.error("Failed to create post:", err);
  }
};

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavBar />

      {/* Add padding to push content below navbar */}
      <main className="pt-20 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Discussion</CardTitle>
            <CardDescription>Share your thoughts!</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter discussion title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your discussion content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="e.g. conservation, plant ID"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Submit
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}

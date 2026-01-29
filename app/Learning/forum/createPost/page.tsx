"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

import TopNavBar from "../../../../components/TopNavBar";
import { Input } from "../../../../components/input";
import { Textarea } from "../../../../components/textarea";
import { Button } from "../../../../components/button";
import { Label } from "../../../../components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../components/card";

import { auth } from "../../../../lib/firebaseConfig";
import { createPost } from "../../../../controller/postController";

export default function CreateDiscussionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false); // ✅ blocks spam-click instantly

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) window.location.href = "/login";
    });
    return () => unsub();
  }, []);

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setTags("");
    toast("Cleared.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please log in first.");
        return;
      }

      const titleTrim = title.trim().replace(/\s+/g, " ");
      const contentTrim = content.trim();
      const tagsTrim = tags.trim();

      // ✅ required fields + whitespace-only blocked
      if (!titleTrim || !contentTrim || !tagsTrim) {
        toast.error("All fields are required.");
        return;
      }

      const tagList = tagsTrim
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (tagList.length === 0) {
        toast.error("Please enter at least one tag.");
        return;
      }

      await createPost({
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });


      toast.success("Discussion posted!");
      router.push("/Learning/forum");
    } catch (err: any) {
      const msg = String(err?.message || "");

      if (msg.includes("DUPLICATE_TITLE")) {
        toast.error("Duplicate title detected. Please use a different title.");
      } else if (msg.includes("DUPLICATE_CONTENT")) {
        toast.error("Duplicate content detected. Please write different content.");
      } else if (msg.includes("VALIDATION_REQUIRED_FIELDS")) {
        toast.error("All fields are required.");
      } else {
        toast.error(err?.message || "Failed to create post.");
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavBar />

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
                  onBlur={() => setTitle((v) => v.trim().replace(/\s+/g, " "))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your discussion content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={() => setContent((v) => v.trim())}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="e.g. conservation, plant ID"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  onBlur={() => setTags((v) => v.trim())}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use commas to separate tags. Example: <span className="font-medium">conservation, plant ID</span>
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}

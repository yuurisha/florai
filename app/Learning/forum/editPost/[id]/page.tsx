"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Textarea } from "../../../../../components/textarea";
import {Button} from "../../../../../components/button";
import toast from "react-hot-toast";
import React from "react";
import { getPostById, editPost } from "../../../../../controller/postController";
import { Post } from "../../../../../models/Post";

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        const data = await getPostById(id as string);
        if (data) {
          setPost(data);
          setContent(data.content);
        } else {
          toast.error("Post not found.");
          router.push("/Learning/forum");
        }
      };
      fetchData();
    }
  }, [id, router]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }
    try {
      await editPost(id as string, content);
      toast.success("Post updated successfully.");
      router.push(`/Learning/forum/${id}`);
    } catch (err) {
      toast.error("Failed to update the post.");
    }
  };

  if (!post) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-[var(--background)] py-20 px-6 md:px-16">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">Edit Post</h1>
        <p className="text-gray-700 font-semibold mb-2">{post.title}</p>
        <Textarea
          className="w-full min-h-[150px] border border-gray-300 rounded p-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

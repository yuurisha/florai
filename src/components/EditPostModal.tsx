"use client";
import { useEffect, useState } from "react";
import { Post } from "@/models/Post";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import {Button} from "@/components/button";

interface EditPostModalProps {
  post: Post;
  onSave: (updatedContent: string) => void;
  onCancel: () => void;
}

export default function EditPostModal({ post, onSave, onCancel }: EditPostModalProps) {
  const [content, setContent] = useState(post.content);

  useEffect(() => {
    setContent(post.content);
  }, [post]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-lg w-[90%] max-w-xl">
        <h2 className="text-xl font-bold mb-4">Edit Post</h2>
        <Textarea
          className="w-full min-h-[120px] border p-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(content)} className="bg-green-600 hover:bg-green-700 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

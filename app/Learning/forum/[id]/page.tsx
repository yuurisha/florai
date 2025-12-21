"use client";

import { useRouter, useParams } from "next/navigation";
import { CalendarDays, Eye, Heart } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import {Button} from "../../../../components/button";
import { useEffect, useState } from "react";
import {
  getPostById,
  addReplyToPost,
  incrementLikeCount,
  deletePost,
} from "../../../../controller/postController";
import { auth } from "../../../../lib/firebaseConfig";
import TopNavBar from "../../../../components/TopNavBar";
import ConfirmDeleteModal from "../../../../components/ConfirmDeleteModal"; 
import EditPostModal from "../../../../components/EditPostModal";
import { editPost } from "../../../../controller/postController";
//debug
console.log("Modal component:", ConfirmDeleteModal);
console.log("Edit Modal component:", EditPostModal);
// 
import { Post, Reply } from "../../../../models/Post";
import { onAuthStateChanged } from "firebase/auth";





export default function ReadDiscussionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false); 
  const [showEdit, setShowEdit] = useState(false);

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

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        const data = await getPostById(id as string);
        if (data) {
          setPost(data);
          setReplies(Array.isArray(data.replies) ? data.replies : []);
        }
      };
      fetchPost();
    }
  }, [id]);

  const handleReply = async () => {
    if (reply.trim() && post?.id) {
      const newReply: Reply = {
        name: "You",
        text: reply,
        timestamp: new Date().toISOString(),
      };
      await addReplyToPost(post.id, newReply);
      setReplies((prev) => [...prev, newReply]);
      setReply("");
    }
  };

  const handleLike = async () => {
    if (post?.id) {
      await incrementLikeCount(post.id);
      setPost((prev) => (prev ? { ...prev, likes: (prev.likes || 0) + 1 } : prev));
    }
  };

const handleDelete = () => {
  setShowConfirm(true); 
};

const handleDeleteConfirmed = async () => {
  try {
    await deletePost(post!.id!);
    toast.success("Post deleted successfully.");
    router.push("/Learning/forum");
  } catch (err) {
    toast.error("Failed to delete the post.");
  } finally {
    setShowConfirm(false); 
  }
};

const handleEditSave = async (updatedContent: string) => {
  try {
    await editPost(post!.id!, updatedContent);
    toast.success("Post updated successfully.");
    setPost((prev) => prev ? { ...prev, content: updatedContent } : prev);
  } catch (err) {
    toast.error("Failed to update post.");
  } finally {
    setShowEdit(false);
  }
};



  if (!post) {
    return <div className="p-6 text-red-600 font-semibold">Discussion not found</div>;
  }

  const isPostOwner = auth.currentUser?.uid === post.userId;

  return (
    <>
      <TopNavBar />
      <div className="bg-[var(--background)] min-h-screen p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
        <main className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-1">{post.title}</h1>
            <div className="flex items-center text-sm text-gray-500 gap-4 mb-2">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {post.views ?? 0} Views
              </div>
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <Heart className="h-4 w-4" /> {post.likes ?? 0} Likes
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Image
                src="/avatar1.png"
                alt="avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span>{post.author}</span>
              <span className="text-gray-400">•</span>
              <span>
                <CalendarDays className="inline h-4 w-4 mr-1" />
                {post.date}
              </span>
            </div>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>

            {isPostOwner && (
              <div className="mt-4 flex gap-2">
                <Button
  className="bg-blue-500 hover:bg-blue-600 text-white"
  onClick={() => router.push(`/Learning/forum/editPost/${post.id}`)}
>
  Edit
</Button>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            )}
            {showConfirm && (
              <ConfirmDeleteModal
                message="Are you sure you want to delete this post?"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setShowConfirm(false)}
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-4">
              Replies ({replies.length})
            </h2>
            <div className="space-y-4 mb-4">
              {replies.map((reply, i) => (
                <div
                  key={i}
                  className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Image
                      src={`/avatar${(i % 4) + 1}.png`}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="text-sm font-medium">{reply.name}</div>
                  </div>
                  <p className="text-gray-700 text-sm">{reply.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                placeholder="Write a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button
                onClick={handleReply}
                className="self-end bg-green-600 hover:bg-green-700 text-white"
              >
                Post Reply
              </Button>
            </div>
          </div>
        </main>

        <aside className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Discussion Info</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">About the Author</h3>
            <div className="flex items-center gap-3 mb-2">
              <Image
                src="/avatar1.png"
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="text-sm font-medium">{post.author}</p>
                <p className="text-xs text-gray-500">Discussion Enthusiast</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Leading researcher with a passion for fostering green tech advancement.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Related Discussions</h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>
                <a href="#" className="hover:underline">Can we plant anywhere?</a>
              </li>
              <li>
                <a href="#" className="hover:underline">Why we should care about biodiversity</a>
              </li>
              <li>
                <a href="#" className="hover:underline">I find it hard to maintain my plants</a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

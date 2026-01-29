"use client";

import { useRouter, useParams } from "next/navigation";
import { CalendarDays, Eye, Heart, Trash2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Button } from "../../../../components/button";
import { useEffect, useState } from "react";

import {
  getPostById,
  incrementViewCount,
} from "../../../../controller/postController";

import { adminDeleteForumPost } from "@/controller/moderationController";
import { auth, db } from "../../../../lib/firebaseConfig";
import AdminTopNavbar from "../../../../components/adminTopNavBar";
import { Post } from "../../../../models/Post";
import { onAuthStateChanged } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

type SimpleModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClose: () => void;
};

function SimpleModal({ open, title, description, children, onClose }: SimpleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b p-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-50"
            aria-label="Close modal"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDeletePopup({
  open,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <SimpleModal
      open={open}
      title="Delete this forum post?"
      description="This action cannot be undone. All replies will also be deleted."
      onClose={onCancel}
    >
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? "Deleting..." : "Delete Post"}
        </Button>
      </div>
    </SimpleModal>
  );
}

export default function AdminViewPost() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [isAdmin, setIsAdmin] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const role = userSnap.exists() ? (userSnap.data() as any)?.role : null;

      if (role !== "admin") {
        router.push("/unauthorized");
        return;
      }

      setIsAdmin(true);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (isAdmin && postId) {
      loadPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, postId]);

  async function loadPost() {
    try {
      setLoading(true);
      const data = await getPostById(postId);
      if (data) {
        setPost(data);
        // Increment view count
        await incrementViewCount(postId);
        
        // Get author name
        if (data.authorId) {
          const authorSnap = await getDoc(doc(db, "users", data.authorId));
          if (authorSnap.exists()) {
            const authorData = authorSnap.data();
            setAuthorName(
              authorData?.displayName || 
              authorData?.name || 
              authorData?.username || 
              authorData?.email || 
              "Unknown User"
            );
          }
        }
      } else {
        toast.error("Post not found");
        router.push("/admin/manage-report");
      }
    } catch (error: any) {
      console.error("Error loading post:", error);
      toast.error(error?.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost() {
    try {
      setDeleteLoading(true);
      // Delete the post (no reportID needed in this context)
      await adminDeleteForumPost(postId, "");
      toast.success("Post deleted successfully");
      router.push("/admin/manage-report");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(error?.message || "Failed to delete post");
    } finally {
      setDeleteLoading(false);
      setConfirmDeleteOpen(false);
    }
  }

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
          <AdminTopNavbar />
        </div>
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const relativeTime = (isoString: string) => {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "just now";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
        <AdminTopNavbar />
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Reports</span>
          </button>

          {/* Admin Alert */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Admin View:</strong> You are viewing this reported post. Review the content and decide whether to delete it.
            </p>
          </div>

          {/* Post Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Post Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{authorName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays size={14} />
                      <span>{relativeTime(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mt-4">{post.title}</h1>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* Post Stats */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Heart size={18} />
                  <span>{post.likes || 0} likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={18} />
                  <span>{post.views || 0} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{post.replies?.length || 0} replies</span>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="p-6 border-t border-gray-200 bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Admin Actions</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Delete this post if it violates community guidelines
                  </p>
                </div>
                <Button
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Post
                </Button>
              </div>
            </div>

            {/* Replies Section */}
            {post.replies && post.replies.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Replies ({post.replies.length})
                </h3>
                <div className="space-y-4">
                  {post.replies.map((reply, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {reply.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900">
                              {reply.name || "Anonymous"}
                            </p>
                            <span className="text-xs text-gray-500">
                              {relativeTime(reply.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{reply.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDeletePopup
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeletePost}
        loading={deleteLoading}
      />
    </div>
  );
}

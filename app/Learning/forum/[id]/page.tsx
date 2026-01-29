"use client";

import { useRouter, useParams } from "next/navigation";
import { CalendarDays, Eye, Heart, Flag, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Button } from "../../../../components/button";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getPostById,
  addReplyToPost,
  incrementLikeCount,
  deletePost,
  editPost,
  incrementViewCount,
} from "../../../../controller/postController";

import { auth, db } from "../../../../lib/firebaseConfig";
import TopNavBar from "../../../../components/TopNavBar";
import { Post, Reply } from "../../../../models/Post";
import { onAuthStateChanged } from "firebase/auth";
import ReportModal from "@/components/reportModal";

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
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-xl">
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
      title="Delete discussion?"
      description="This action cannot be undone."
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
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </SimpleModal>
  );
}

function EditPostPopup({
  open,
  initialValue,
  onCancel,
  onSave,
  loading,
}: {
  open: boolean;
  initialValue: string;
  onCancel: () => void;
  onSave: (v: string) => void;
  loading?: boolean;
}) {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (open) setDraft(initialValue);
  }, [open, initialValue]);

  return (
    <SimpleModal
      open={open}
      title="Edit discussion"
      description="Update your post content below."
      onClose={onCancel}
    >
      <div className="space-y-3">
        <textarea
          className="w-full min-h-[160px] rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-green-300"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write your updated content..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(draft)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}

export default function ReadDiscussionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState<string>("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "forum" | "user"; id: string } | null>(
    null
  );

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  
  const [authorPicUrl, setAuthorPicUrl] = useState<string>("/avatar1.png");

  
  const viewedOnceRef = useRef(false);

  // auth guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) window.location.href = "/login";
    });
    return () => unsubscribe();
  }, []);

  
  useEffect(() => {
    if (!id) return;

    const run = async () => {
      const data = await getPostById(id as string);
      if (!data) return;

      setPost(data);
      setReplies(Array.isArray((data as any).replies) ? (data as any).replies : []);

      
      try {
        const uid = (data as any).userId;
        if (uid) {
          const userSnap = await getDoc(doc(db, "users", uid));
          if (userSnap.exists()) {
            const u = userSnap.data() as any;
            setAuthorPicUrl(u?.profilePicUrl || "/avatar1.png");
          } else {
            setAuthorPicUrl("/avatar1.png");
          }
        }
      } catch {
        setAuthorPicUrl("/avatar1.png");
      }

      
      if (!viewedOnceRef.current) {
        viewedOnceRef.current = true;
        try {
          await incrementViewCount(data.id as string);
          setPost((prev) => (prev ? { ...prev, views: (prev.views ?? 0) + 1 } : prev));
        } catch {
          
        }
      }
    };

    run();
  }, [id]);

  const isPostOwner = useMemo(() => {
    return !!post?.userId && auth.currentUser?.uid === post.userId;
  }, [post?.userId]);

  
  const hasLiked =
    Array.isArray((post as any)?.likedBy) &&
    !!auth.currentUser?.uid &&
    (post as any).likedBy.includes(auth.currentUser.uid);

  const getUserProfilePicUrl = async (uid: string) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data() as any;
      return data?.profilePicUrl || "/avatar1.png";
    }
    return "/avatar1.png";
  } catch {
    return "/avatar1.png";
  }
};

  const handleReply = async () => {
    if (!post?.id) return;

    const trimmed = reply.trim();
    if (!trimmed) {
      toast.error("Reply cannot be empty.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("Please log in first.");
      return;
    }

    const avatarUrl = await getUserProfilePicUrl(user.uid);

    const newReply: Reply = {
      userId: user.uid,
      name: user.displayName || user.email || "You",
      text: trimmed,
      timestamp: new Date().toISOString(),
      avatarUrl, // ✅ store real avatar
    };

    await addReplyToPost(post.id, newReply);
    setReplies((prev) => [...prev, newReply]);
    setReply("");
    toast.success("Reply posted!");
  };

  const handleLike = async () => {
    if (!post?.id) return;

    if (hasLiked) {
      toast.error("You already liked this post.");
      return;
    }

    try {
      await incrementLikeCount(post.id);

      const uid = auth.currentUser?.uid;
      setPost((prev) =>
        prev
          ? ({
              ...prev,
              likes: (prev.likes || 0) + 1,
              likedBy: uid
                ? [...(Array.isArray((prev as any).likedBy) ? (prev as any).likedBy : []), uid]
                : (prev as any).likedBy,
            } as any)
          : prev
      );
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("ALREADY_LIKED")) toast.error("You already liked this post.");
      else toast.error("Failed to like the post.");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!post?.id) return;

    setDeleteLoading(true);
    try {
      await deletePost(post.id);
      toast.success("Post deleted successfully.");
      router.push("/Learning/forum");
    } catch {
      toast.error("Failed to delete the post.");
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
    }
  };

  const handleEditSave = async (updatedContent: string) => {
    if (!post?.id) return;

    const trimmed = updatedContent.trim();
    if (!trimmed) {
      toast.error("Content cannot be empty.");
      return;
    }

    setEditLoading(true);
    try {
      await editPost(post.id, trimmed);
      toast.success("Post updated successfully.");
      setPost((prev) => (prev ? { ...prev, content: trimmed } : prev));
      setShowEdit(false);
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("DUPLICATE_CONTENT"))
        toast.error("Duplicate content detected. Please edit differently.");
      else toast.error("Failed to update post.");
    } finally {
      setEditLoading(false);
    }
  };

  if (!post) {
    return <div className="p-6 text-red-600 font-semibold">Discussion not found</div>;
  }

  return (
    <>
      <TopNavBar />

      <div className="bg-[var(--background)] min-h-screen p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
        <main className="md:col-span-2 space-y-6">
          {/* Post card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>

                <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {post.views ?? 0} Views
                  </div>

                  <button
                    onClick={handleLike}
                    disabled={hasLiked}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                      hasLiked
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-red-700 bg-red-50 hover:bg-red-100"
                    }`}
                    type="button"
                  >
                    <Heart className="h-4 w-4" /> {post.likes ?? 0} Likes
                  </button>
                </div>
              </div>

              {/* Owner actions */}
              {isPostOwner && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEdit(true)}
                    className="border-gray-200"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-200">
                <Image
                  src={authorPicUrl || "/avatar1.png"}
                  alt="author avatar"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>

              <span className="font-medium text-gray-800">{post.author}</span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center">
                <CalendarDays className="h-4 w-4 mr-1 text-gray-500" />
                {new Date(post.date).toLocaleString("en-MY", {
                timeZone: "Asia/Kuala_Lumpur",
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">{post.content}</p>
            </div>

            {/* Report buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-gray-200 text-gray-700"
                onClick={() => {
                  setReportTarget({ type: "forum", id: post.id || "" });
                  setReportOpen(true);
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                Report Post
              </Button>

              <Button
                type="button"
                variant="outline"
                className="border-gray-200 text-gray-700"
                onClick={() => {
                  setReportTarget({ type: "user", id: post.userId });
                  setReportOpen(true);
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                Report User
              </Button>
            </div>
          </div>

          {/* Replies */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="font-semibold text-lg mb-4">Replies ({replies.length})</h2>

            <div className="space-y-4 mb-6">
              {replies.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-200">
                    <Image
                      src={r.avatarUrl || "/avatar1.png"}
                      alt="avatar"
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                    <div className="text-sm font-medium text-gray-900">{r.name}</div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-line">{r.text}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <textarea
                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-green-300"
                placeholder="Write a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleReply}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  type="button"
                >
                  Post Reply
                </Button>
              </div>
            </div>
          </div>
        </main>

        <aside className="space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Discussion Info</h3>
            <div className="flex flex-wrap gap-2">
              {(post.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full border border-green-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <ReportModal
          open={reportOpen}
          onClose={() => {
            setReportOpen(false);
            setReportTarget(null);
          }}
          targetType={reportTarget?.type ?? "forum"}
          targetId={reportTarget?.id ?? ""}
        />

        {/* Popups */}
        <ConfirmDeletePopup
          open={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleDeleteConfirmed}
          loading={deleteLoading}
        />

        <EditPostPopup
          open={showEdit}
          initialValue={post.content || ""}
          onCancel={() => setShowEdit(false)}
          onSave={handleEditSave}
          loading={editLoading}
        />
      </div>
    </>
  );
}

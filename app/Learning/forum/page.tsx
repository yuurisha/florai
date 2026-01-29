"use client";

import { useEffect, useState } from "react";
import { fetchAllPosts } from "../../../controller/postController";
import Link from "next/link";
import { Post } from "../../../models/Post";
import { Leaf } from "lucide-react";
import TopNavBar from "../../../components/TopNavBar";

export default function ForumPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const allPosts = await fetchAllPosts();
                setPosts(allPosts);
            } catch (err: any) {
                console.error("Error fetching forum posts:", err);
                setError(err?.message || "Failed to load forum posts. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        loadPosts();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNavBar />

            <main className="pt-20 px-6 max-w-4xl mx-auto">
                <Link href="/Learning/forum" className="flex items-center gap-2 mb-6">
                    <Leaf className="w-6 h-6 text-green-600" />
                    <h1 className="text-2xl font-bold text-green-700">FlorAI Forum</h1>
                </Link>

                <Link
                    href="forum/createPost"
                    className="inline-block mb-6 text-green-600 hover:underline"
                >
                    + Start a New Discussion
                </Link>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading forum posts...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600 font-semibold mb-2">Error Loading Posts</p>
                        <p className="text-red-500 text-sm mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                        <Leaf className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-semibold mb-2">No discussions yet</p>
                        <p className="text-gray-500 text-sm mb-4">
                            Be the first to start a conversation in the FlorAI community!
                        </p>
                        <Link
                            href="forum/createPost"
                            className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                            Create First Post
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {posts.map((post, idx) => (
                            <div key={post.id} className={idx !== posts.length - 1 ? "mb-8" : ""}>
                                <Link href={`/Learning/forum/${post.id}`}>
                                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer border border-gray-200">
                                        <h2 className="text-xl font-semibold text-green-700">{post.title}</h2>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {Array.isArray(post.tags) ? post.tags.join(", ") : String(post.tags)}
                                        </p>
                                        <p className="text-gray-700 line-clamp-2">{post.content}</p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

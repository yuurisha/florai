"use client";

import { useEffect, useState } from "react";
import { fetchAllPosts } from "../../../controller/postController";
import Link from "next/link";
import { Post } from "../../../models/Post";
import { Leaf } from "lucide-react";
import TopNavBar from "../../../components/TopNavBar";

export default function ForumPage() {
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        const loadPosts = async () => {
            const allPosts = await fetchAllPosts();
            setPosts(allPosts);
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
            </main>
        </div>
    );
}

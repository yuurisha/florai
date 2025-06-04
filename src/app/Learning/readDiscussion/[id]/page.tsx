"use client";

import { CalendarDays, Eye, Heart } from "lucide-react";
import Image from "next/image";
import  Button  from "@/components/button";
import { useParams } from "next/navigation";
import { useState } from "react";
import rawMockData from "@/mock/discussions.json";

interface Discussion {
  title: string;
  author: string;
  date: string;
  content: string;
  tags: string[];
  replies: { name: string; text: string }[];
}

const mockData = rawMockData as Record<string, Discussion>;

export default function ReadDiscussionPage() {
  const { id } = useParams();
  const post = mockData[id as keyof typeof mockData];

  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState(post?.replies || []);

  if (!post) {
    return <div className="p-6 text-red-600 font-semibold">Discussion not found</div>;
  }

  const handleReply = () => {
    if (reply.trim()) {
      const newReply = { name: "You", text: reply };
      setReplies((prev: typeof replies) => [...prev, newReply]);
      setReply("");
    }
  };

  return (
    <div className="bg-[#f9fbf7] min-h-screen p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <main className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-1">{post.title}</h1>
          <div className="flex items-center text-sm text-gray-500 gap-4 mb-2">
            <div className="flex items-center gap-1"><Eye className="h-4 w-4" /> 12,890 Views</div>
            <div className="flex items-center gap-1"><Heart className="h-4 w-4" /> 957 Upvotes</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Image src="/avatar1.png" alt="avatar" width={32} height={32} className="rounded-full" />
            <span>{post.author}</span>
            <span className="text-gray-400">•</span>
            <span><CalendarDays className="inline h-4 w-4 mr-1" />{post.date}</span>
          </div>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-4">Replies ({replies.length})</h2>
          <div className="space-y-4 mb-4">
            {replies.map((reply, i) => (
              <div key={i} className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <Image src={`/avatar${(i % 4) + 1}.png`} alt="avatar" width={32} height={32} className="rounded-full" />
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
            <Button onClick={handleReply} className="self-end bg-green-600 hover:bg-green-700 text-white">
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
              <span key={tag} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">About the Author</h3>
          <div className="flex items-center gap-3 mb-2">
            <Image src="/avatar1.png" alt="avatar" width={40} height={40} className="rounded-full" />
            <div>
              <p className="text-sm font-medium">{post.author}</p>
              <p className="text-xs text-gray-500">Discussion Enthusiast</p>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Leading AI ethicist and researcher with a passion for fostering responsible tech advancement. Author of "AI & Humanity: A Symbiotic Future."
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Related Discussions</h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li><a href="#" className="hover:underline">Impact of Quantum Computing on AI Development</a></li>
            <li><a href="#" className="hover:underline">Building Trust in Autonomous Systems</a></li>
            <li><a href="#" className="hover:underline">AI in Healthcare: Benefits and Challenges</a></li>
            <li><a href="#" className="hover:underline">The Role of AI in Climate Change Mitigation</a></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

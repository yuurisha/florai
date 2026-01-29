"use client";

import React, { useEffect, useMemo, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import PageHeader from "@/components/page-header";

import { IconFromKey } from "@/lib/learningIcons";
import type { Resource, Tip } from "@/models/Learning";
import { subscribeResources, subscribeTips } from "@/controller/learningContentController";

function getCategoryColor(category: string) {
  switch (category) {
    case "Watering":
      return "bg-blue-100 text-blue-800";
    case "Planting":
      return "bg-green-100 text-green-800";
    case "Soil Care":
      return "bg-amber-100 text-amber-800"; 
      return "bg-yellow-100 text-yellow-800";
    case "Nutrition":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Beginner":
      return "bg-emerald-100 text-emerald-800";
    case "Intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "Advanced":
      return "bg-red-100 text-red-800";
    case "All levels":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "Video Course":
      return "bg-blue-100 text-blue-800";
    case "Guide":
      return "bg-purple-100 text-purple-800";
    case "Reference":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function TipsCarousel({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tips of the Day</h2>
        <div className="rounded-lg border bg-white p-6 text-gray-600">
          No tips yet. Ask an admin to add some.
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Tips of the Day</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="flex-shrink-0 w-64 rounded-lg border bg-white p-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IconFromKey iconKey={tip.iconKey} className="h-6 w-6 text-emerald-600" />
                <h3 className="ml-2 text-lg font-semibold text-gray-900">{tip.title}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryColor(
                  tip.category
                )}`}
              >
                {tip.category}
              </span>
            </div>
            <p className="mt-2 text-gray-700">{tip.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourcesGridUI({
  resources,
  onSelect,
}: {
  resources: Resource[];
  onSelect: (r: Resource) => void;
}) {
  if (resources.length === 0) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Learning Resources</h2>
        <div className="rounded-lg border bg-white p-6 text-gray-600">
          No learning resources yet. Ask an admin to add some.
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Learning Resources</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <button
            key={resource.id}
            onClick={() => onSelect(resource)}
            className="text-left rounded-lg border bg-white p-4 shadow-md transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center">
              <IconFromKey iconKey={resource.iconKey} className="h-8 w-8 text-emerald-600" />
              <h3 className="ml-2 text-lg font-semibold text-gray-900">{resource.title}</h3>
            </div>
            <p className="mt-2 text-gray-700">{resource.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyColor(
                  resource.difficulty
                )}`}
              >
                {resource.difficulty}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeColor(
                  resource.type
                )}`}
              >
                {resource.type}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                {resource.duration}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResourceModal({
  resource,
  onClose,
}: {
  resource: Resource;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border">
        <div className="flex items-start justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <IconFromKey iconKey={resource.iconKey} className="h-7 w-7 text-emerald-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
              <p className="text-sm text-gray-600">{resource.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyColor(
                resource.difficulty
              )}`}
            >
              {resource.difficulty}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeColor(
                resource.type
              )}`}
            >
              {resource.type}
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
              {resource.duration}
            </span>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-line">{resource.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LearningResourcesPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    const unsubTips = subscribeTips(setTips);
    const unsubResources = subscribeResources((rows) => {
      setResources(rows);
      setLoading(false);
    });

    return () => {
      unsubTips();
      unsubResources();
    };
  }, []);

  const topTips = useMemo(() => tips.slice(0, 10), [tips]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader />

        {loading ? (
          <div className="rounded-lg border bg-white p-6 text-gray-600">Loading content…</div>
        ) : (
          <>
            <TipsCarousel tips={topTips} />
            <ResourcesGridUI resources={resources} onSelect={setSelectedResource} />
          </>
        )}
      </div>

      {selectedResource && (
        <ResourceModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
      )}
    </div>
  );
}

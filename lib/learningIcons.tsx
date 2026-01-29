import React from "react";
import {
  Droplets,
  Flower,
  Sprout,
  TreePine,
  Leaf,
  BookOpen,
  Video,
  FileText,
  LucideIcon,
} from "lucide-react";

export const ICONS = {
  droplets: Droplets,
  flower: Flower,
  sprout: Sprout,
  treePine: TreePine,
  leaf: Leaf,
  bookOpen: BookOpen,
  video: Video,
  fileText: FileText,
} as const;

export type IconKey = keyof typeof ICONS;

export function IconFromKey({
  iconKey,
  className = "h-6 w-6 text-emerald-600",
}: {
  iconKey?: string | null;
  className?: string;
}) {
  const Key = (iconKey ?? "fileText") as IconKey;
  const Icon: LucideIcon = ICONS[Key] ?? FileText;
  return <Icon className={className} />;
}

export const ICON_KEY_OPTIONS: { value: IconKey; label: string }[] = [
  { value: "droplets", label: "Droplets" },
  { value: "flower", label: "Flower" },
  { value: "sprout", label: "Sprout" },
  { value: "treePine", label: "TreePine" },
  { value: "leaf", label: "Leaf" },
  { value: "bookOpen", label: "BookOpen" },
  { value: "video", label: "Video" },
  { value: "fileText", label: "FileText" },
];

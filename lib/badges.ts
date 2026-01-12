import type { StaticImageData } from "next/image";

import theDedicated from "@/badges/the_dedicated.png";
import theLegend from "@/badges/the_legend.png";
import theSpark from "@/badges/the_spark.png";
import theSteady from "@/badges/the_steady.png";

export type BadgeKey = "streak3" | "streak7" | "streak30" | "streak365";

export type BadgeDefinition = {
  key: BadgeKey;
  label: string;
  days: number;
  hint: string;
  story: string;
  image: StaticImageData;
};

export const BADGES: BadgeDefinition[] = [
  {
    key: "streak3",
    label: "The Spark",
    days: 2,
    hint: "Upload 2 days in a row",
    story: "Growth, fresh starts, and the green light of a new journey.",
    image: theSpark,
  },
  {
    key: "streak7",
    label: "The Steady",
    days: 7,
    hint: "Upload 7 days in a row",
    story: "Consistency, calm momentum, and the rhythm of showing up.",
    image: theSteady,
  },
  {
    key: "streak30",
    label: "The Dedicated",
    days: 30,
    hint: "Upload 30 days in a row",
    story: "Commitment, focus, and steady progress through the long haul.",
    image: theDedicated,
  },
  {
    key: "streak365",
    label: "The Legend",
    days: 365,
    hint: "Upload 365 days in a row",
    story: "Endurance, mastery, and a year of growth.",
    image: theLegend,
  },
];

const BADGE_KEYS = new Set<BadgeKey>(BADGES.map((badge) => badge.key));

const badgeImageToken = (src: string) => {
  const base = src.split("/").pop() ?? src;
  return base.split(".")[0] ?? base;
};

const matchBadgeFromString = (value: string) => {
  if (BADGE_KEYS.has(value as BadgeKey)) return value as BadgeKey;

  const normalized = value.toLowerCase();
  const labelMatch = BADGES.find((badge) => badge.label.toLowerCase() === normalized);
  if (labelMatch) return labelMatch.key;

  const imageMatch = BADGES.find((badge) => {
    const token = badgeImageToken(badge.image.src);
    return normalized.includes(token.toLowerCase());
  });
  return imageMatch?.key ?? null;
};

export function parseBadgeKey(value?: unknown): BadgeKey | null {
  if (!value) return null;
  if (typeof value === "string") return matchBadgeFromString(value);
  if (typeof value === "object" && value !== null && "src" in value) {
    const srcValue = (value as { src?: unknown }).src;
    if (typeof srcValue === "string") return matchBadgeFromString(srcValue);
  }
  return null;
}

export function badgeLabelForKey(key?: BadgeKey | string | null) {
  const match = BADGES.find((badge) => badge.key === key);
  return match?.label ?? null;
}

export function badgeImageForKey(key?: BadgeKey | string | null) {
  const match = BADGES.find((badge) => badge.key === key);
  return match?.image ?? null;
}

export function isBadgeUnlocked(
  context: { currentStreak: number; badgeFlags?: Partial<Record<BadgeKey, boolean>> },
  badge: BadgeDefinition
) {
  return context.currentStreak >= badge.days || !!context.badgeFlags?.[badge.key];
}

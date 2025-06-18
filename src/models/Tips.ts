import React from "react";

type Tip = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
};

interface TipsCarouselProps {
  tips: Tip[];
}


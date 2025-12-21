"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

export default function ActionTile({ title, subtitle, icon, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-gray-200 bg-white p-6
      shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl p-3 bg-green-50 border border-green-100 text-green-700 group-hover:bg-green-100 transition">
            {icon}
          </div>
        )}
      </div>
    </button>
  );
}

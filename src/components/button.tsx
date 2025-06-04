"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "ghost" | "outline";
type Size = "default" | "icon";

type ButtonProps = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600";

  const variantClasses = {
    default: "bg-green-600 text-white hover:bg-green-700",
    ghost: "bg-transparent hover:bg-gray-100 text-green-600",
      outline: "border border-green-600 text-green-600 hover:bg-green-50",

  };

  const sizeClasses = {
    default: "px-4 py-2 text-sm",
    icon: "p-2 h-10 w-10",
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

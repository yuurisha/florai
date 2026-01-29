// app/forgotPassword/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { Label } from "../../components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/card";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    // Empty email handler
    if (!normalizedEmail) {
      toast.error("Please enter your email.");
      return;
    }

    // email format handler 
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!emailOk) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);

      // 
      toast.success(
        "If an account exists for this email, a reset link has been sent."
      );
      router.push("/login");
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error("Unable to process request right now. Please try again.");
      }

      console.error("Error resetting password:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-4">
      <Link
        href="/"
        className="absolute left-8 top-8 flex items-center gap-2 md:left-12 md:top-12"
      >
        <Leaf className="h-6 w-6 text-green-600" />
        <span className="text-xl font-bold">FlorAI</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleResetPassword();
              }}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </Button>

          <div className="text-center text-sm">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-medium text-green-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

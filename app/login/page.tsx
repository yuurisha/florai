"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff } from "lucide-react";

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
import toast from "react-hot-toast";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";
import { getUserRole } from "../../controller/userController";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    let userCredential = null;

    try {
      if (!email || !password) {
        toast.error("Please enter both email and password.");
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
      }    

      // Attempt login
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // DO NOT use getIdToken(true)
      const token = await user.getIdToken();

      // Store token in cookie (for middleware)
      document.cookie = `firebaseToken=${token}; path=/; SameSite=Lax;`;

      // Check if user document exists in Firestore
      let role: string | null = "user";
      try {
        role = (await getUserRole()) || null;
        
        // If no role found, user document doesn't exist
        if (!role) {
          // Sign out the user
          await auth.signOut();
          document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
          document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
          toast.error("Account not found. Please contact support.");
          return;
        }
      } catch (err) {
        // If error checking user document, sign out
        await auth.signOut();
        document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
        document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
        toast.error("Account verification failed. Please contact support.");
        return;
      }

      document.cookie = `userRole=${role}; path=/; SameSite=Lax;`;
      
      // Redirect based on role
      router.push(role === "admin" ? "/admin" : "/home");

      toast.success("Login successful!");

    } catch (error: any) {
      console.error("Login failed:", error);

      // Default message
      let message: string = "Login failed. Please check your credentials.";

      // Firebase v10 new error codes
      switch (error.code) {
        case "auth/invalid-credential": // NEW unified credential error
          message = "Invalid email or password.";
          break;
        case "auth/user-not-found":
          message = "No user found with this email.";
          break;
        case "auth/wrong-password": // still appears sometimes
          message = "Incorrect password.";
          break;
        case "auth/invalid-email":
          message = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          message = "Network error. Check your connection.";
          break;
         default:
          message = "Authentication failed. Try again.";
      }

      toast.error(message);
      return
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
          <CardTitle className="text-2xl font-bold">Log in to FlorAI</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
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
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgotPassword"
                className="text-xs text-green-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleLogin}
          >
            Log in
          </Button>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-green-600 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

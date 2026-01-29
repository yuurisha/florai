"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff } from "lucide-react";

import { createUserWithEmailAndPassword, updateProfile, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

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

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

function normalizeEmail(raw: string) {
  // Trim and remove ALL whitespace inside email (optional).
  // If you want to allow internal spaces (usually invalid anyway), remove the replace().
  return raw.trim().replace(/\s+/g, "");
}

function isWhitespaceOnly(s: string) {
  return s.trim().length === 0;
}

function passwordChecks(pw: string) {
  const v = pw; // already trimmed by caller when needed
  return {
    length: v.length >= 8,
    lower: /[a-z]/.test(v),
    upper: /[A-Z]/.test(v),
    number: /\d/.test(v),
    symbol: /[^\w\s]/.test(v),
  };
}

export default function SignUpPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Prevent double-submit even if user spam clicks or React state hasn't updated yet
  const submittingRef = useRef(false);

  const togglePasswordVisibility = () => setShowPassword((v) => !v);

  // For showing the rules, use a trimmed password so whitespace-only doesn't look "valid"
  const trimmedPassword = useMemo(() => password.trim(), [password]);
  const checks = useMemo(() => passwordChecks(trimmedPassword), [trimmedPassword]);
  const isPasswordValid = useMemo(
    () => PASSWORD_RULE.test(trimmedPassword),
    [trimmedPassword]
  );

  const handleSignUp = async () => {
    setError("");

    // ✅ Block double-click / double request immediately
    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);

    try {
      // ✅ Trim & validate inputs
      const nameTrim = fullName.trim();
      const emailNorm = normalizeEmail(email);
      const pwTrim = password.trim();

      if (!nameTrim || !emailNorm || !role) {
        setError("All fields are required.");
        return;
      }

      // ✅ Reject whitespace-only password (e.g. "     ")
      if (isWhitespaceOnly(password)) {
        setError("Password cannot be empty.");
        return;
      }

      // ✅ Disallow leading/trailing whitespace in password (common security UX)
      if (password !== pwTrim) {
        setError("Password cannot start or end with spaces.");
        return;
      }

      // ✅ Validate strong password rules on trimmed value
      if (!PASSWORD_RULE.test(pwTrim)) {
        setError(
          "Password must be 8+ chars and include uppercase, lowercase, number, and symbol."
        );
        return;
      }

      // ✅ Sign out any existing user before creating new one (your original intent)
      await signOut(auth);

      // ✅ Create user (email already normalized)
      const userCredential = await createUserWithEmailAndPassword(auth, emailNorm, pwTrim);
      const user = userCredential.user;

      // ✅ Create Firestore document FIRST while still authenticated
      await setDoc(doc(db, "users", user.uid), {
        fullName: nameTrim,
        email: emailNorm,
        role,
        createdAt: new Date(),
      });

      // ✅ Update profile
      await updateProfile(user, { displayName: nameTrim });

      // User stays signed in - redirect to home
      router.push("/home");
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (code === "auth/email-already-in-use") setError("Email already registered. Try logging in.");
      else if (code === "auth/invalid-email") setError("Invalid email format.");
      else if (code === "auth/weak-password")
        setError("Password is too weak. Use 8+ chars with upper/lowercase, number, and symbol.");
      else setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      submittingRef.current = false;
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
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create your FlorAI account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setFullName((v) => v.trim())} // ✅ remove leading/trailing spaces
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmail((v) => normalizeEmail(v))} // ✅ trim spaces (and remove internal)
              placeholder="Enter your email"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPassword((v) => v.trim())} // ✅ removes leading/trailing spaces
                placeholder="Create a strong password"
                minLength={8}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>

            {/* Password rules based on trimmed value */}
            <div className="mt-2 space-y-1 text-xs">
              <p className={checks.length ? "text-green-700" : "text-gray-500"}>
                • At least 8 characters
              </p>
              <p className={checks.upper ? "text-green-700" : "text-gray-500"}>
                • At least 1 uppercase letter (A-Z)
              </p>
              <p className={checks.lower ? "text-green-700" : "text-gray-500"}>
                • At least 1 lowercase letter (a-z)
              </p>
              <p className={checks.number ? "text-green-700" : "text-gray-500"}>
                • At least 1 number (0-9)
              </p>
              <p className={checks.symbol ? "text-green-700" : "text-gray-500"}>
                • At least 1 symbol (!@#$…)
              </p>
              {password.length > 0 && !isPasswordValid && (
                <p className="text-red-600">
                  Password must include uppercase, lowercase, number, and symbol.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
            <select
              id="role"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">-- Select --</option>
              <option value="researcher">Researcher</option>
              <option value="student">Student</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleSignUp}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-green-600 hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

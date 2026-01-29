"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { auth } from "../../../lib/firebaseConfig";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  updatePassword,
  type AuthError,
} from "firebase/auth";

import { Button } from "../../../components/button";
import { Input } from "../../../components/input";
import { Label } from "../../../components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/dialog";

function firebaseErrorMessage(err: unknown) {
  const code = (err as AuthError | any)?.code as string | undefined;

  switch (code) {
    case "auth/wrong-password":
      return "Current password is incorrect.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "That email is already in use. Try another one.";
    case "auth/weak-password":
      return "New password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.";
    case "auth/requires-recent-login":
      return "For security, please sign in again and retry.";
    case "auth/operation-not-allowed":
      return "Email change requires verification. Please check your new email inbox.";
    default:
      return (err as any)?.message || "Something went wrong.";
  }
}

function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pw);
}

export default function CredentialsSection() {
  const [currentEmail, setCurrentEmail] = useState("");

  // Change Email modal
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Change Password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const mail = u?.email || "";
      setCurrentEmail(mail);
      if (!newEmail) setNewEmail(mail);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canUpdateEmail = useMemo(() => {
    const userMail = auth.currentUser?.email || "";
    return (
      !emailLoading &&
      newEmail.trim().length > 0 &&
      newEmail.trim() !== userMail &&
      emailPassword.trim().length > 0
    );
  }, [emailLoading, newEmail, emailPassword]);

  const canUpdatePassword = useMemo(() => {
    if (pwLoading) return false;
    if (!currentPassword.trim()) return false;
    if (!newPassword.trim()) return false;
    if (newPassword.trim() !== confirmNewPassword.trim()) return false;
    if (!isStrongPassword(newPassword.trim())) return false;
    return true;
  }, [pwLoading, currentPassword, newPassword, confirmNewPassword]);

  const resetEmailModal = () => {
    setEmailPassword("");
    setNewEmail(auth.currentUser?.email || currentEmail || "");
  };

  const resetPwModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleUpdateEmail = async () => {
    try {
      setEmailLoading(true);

      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("You are not signed in.");
        return;
      }

      const nextEmail = newEmail.trim();
      if (!nextEmail) return toast.error("Email cannot be empty.");
      if (nextEmail === user.email) return toast("No changes to update.");
      if (!emailPassword.trim()) return toast.error("Enter your current password.");

      const cred = EmailAuthProvider.credential(user.email, emailPassword.trim());
      await reauthenticateWithCredential(user, cred);

      const actionCodeSettings = {
        url: `${window.location.origin}/profile`, // ✅ change to your page if needed
        handleCodeInApp: false,
      };

      await verifyBeforeUpdateEmail(user, nextEmail, actionCodeSettings);

      toast.success("Verification sent to your new email. Click the link to complete the change.");
      setEmailOpen(false);
      resetEmailModal();
    } catch (err) {
      toast.error(firebaseErrorMessage(err));
    } finally {
      setEmailLoading(false);
    }
  };

  // ✅ PASSWORD: normal update flow (still needs reauth)
  const handleUpdatePassword = async () => {
    try {
      setPwLoading(true);

      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("You are not signed in.");
        return;
      }

      if (!currentPassword.trim()) return toast.error("Enter your current password.");
      if (newPassword.trim() !== confirmNewPassword.trim())
        return toast.error("New password and confirmation do not match.");
      if (!isStrongPassword(newPassword.trim()))
        return toast.error("New password is too weak. Use 8+ chars with upper/lowercase, number, and symbol.");

      // Re-authenticate
      const cred = EmailAuthProvider.credential(user.email, currentPassword.trim());
      await reauthenticateWithCredential(user, cred);

      await updatePassword(user, newPassword.trim());

      toast.success("Password updated successfully!");
      setPwOpen(false);
      resetPwModal();
    } catch (err) {
      toast.error(firebaseErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-4 space-y-2">
        <p className="text-sm text-muted-foreground">Current email</p>
        <p className="font-medium">{currentEmail || "-"}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          onClick={() => {
            setNewEmail(auth.currentUser?.email || currentEmail || "");
            setEmailOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Change Email
        </Button>

        <Button
          onClick={() => setPwOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Change Password
        </Button>
      </div>

      {/* Change Email Modal */}
      <Dialog
        open={emailOpen}
        onOpenChange={(open) => {
          setEmailOpen(open);
          if (!open) resetEmailModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              We will send a verification link to your new email. The email changes only after you click it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailPassword">Current Password</Label>
              <Input
                id="emailPassword"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmailOpen(false);
                resetEmailModal();
              }}
              disabled={emailLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleUpdateEmail}
              disabled={!canUpdateEmail}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {emailLoading ? "Sending..." : "Send Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog
        open={pwOpen}
        onOpenChange={(open) => {
          setPwOpen(open);
          if (!open) resetPwModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password, then set a strong new password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8+ chars, upper/lower, number, symbol"
              />
              <p className="text-xs text-muted-foreground">
                Must be 8+ chars and include uppercase, lowercase, number, and symbol.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPwOpen(false);
                resetPwModal();
              }}
              disabled={pwLoading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleUpdatePassword}
              disabled={!canUpdatePassword}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

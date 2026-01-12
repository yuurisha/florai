import { Suspense } from "react";
import ManageUserClient from "./ManageUserClient";

export default function ManageUserPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ManageUserClient />
    </Suspense>
  );
}
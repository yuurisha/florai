import DashboardLoader from "./DashboardLoader";

// Optional but helpful: prevents static pre-rendering attempts
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardLoader />;
}

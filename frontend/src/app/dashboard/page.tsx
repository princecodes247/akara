import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("akara_token")?.value;

  if (!token) {
    redirect(`${config.apiUrl}/auth/github`);
  }

  return <DashboardClient />;
}

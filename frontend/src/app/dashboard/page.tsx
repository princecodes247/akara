import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient, { Project } from "./DashboardClient";
import { config } from "@/lib/config";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("akara_token")?.value;

  if (!token) {
    redirect(`${config.apiUrl}/auth/github`);
  }

  const res = await fetch(`${config.apiUrl}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    // We can use Next.js cache or revalidate, but for dashboard no-store is safer to always get fresh data
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect(`${config.apiUrl}/auth/github`);
  }

  const projects: Project[] = await res.json();

  return <DashboardClient projects={projects} />;
}

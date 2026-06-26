import { cookies } from "next/headers";
import ClientPage from "./ClientPage";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("akara_token")?.value;
  const isLoggedIn = !!token;

  return <ClientPage isLoggedIn={isLoggedIn} />;
}

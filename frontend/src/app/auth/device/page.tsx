import { cookies } from "next/headers";
import DeviceAuthClient from "./DeviceAuthClient";

export default async function DeviceAuthPage({ searchParams, params }: { searchParams: Promise<{ code?: string }>, params: Promise<{ code?: string }> }) {
  const code = (await searchParams).code || (await params).code;
  const cookieStore = await cookies();
  const token = cookieStore.get("akara_token")?.value;
  const isLoggedIn = !!token;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center border border-gray-100">
        <h1 className="text-2xl font-semibold mb-2">Device Authorization</h1>
        {!code ? (
          <p className="text-gray-500 mb-6">No device code provided.</p>
        ) : (
          <DeviceAuthClient code={code} isLoggedIn={isLoggedIn} />
        )}
      </div>
    </div>
  );
}

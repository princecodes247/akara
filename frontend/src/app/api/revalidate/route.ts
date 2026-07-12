import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
    }
    revalidateTag(`project-${slug}`, "default");

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 });
  }
}

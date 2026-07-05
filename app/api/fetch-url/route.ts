import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "Reliquary/1.0 (evidence-vault-bot)" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") ?? "";
    let title = "";
    let description = "";

    if (contentType.includes("text/html")) {
      const text = await res.text();
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      title = titleMatch?.[1]?.trim() ?? "";
      description = descMatch?.[1]?.trim() ?? "";
    }

    return NextResponse.json({
      reachable: res.ok,
      status: res.status,
      contentType,
      title,
      description,
      finalUrl: res.url,
    });
  } catch (err: any) {
    const timedOut = err?.name === "AbortError";
    return NextResponse.json({
      reachable: false,
      status: timedOut ? 408 : 0,
      error: timedOut ? "Request timed out" : (err?.message ?? "Fetch failed"),
    });
  }
}

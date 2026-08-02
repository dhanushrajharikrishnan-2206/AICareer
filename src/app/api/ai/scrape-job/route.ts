import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAI, cleanAndParseJson } from "@/lib/ai";

const SYSTEM_PROMPT = `You are an expert job market analyst. Your task is to extract the Job Title and the full Job Description/Requirements text from the provided HTML/text content of a job posting.
Analyze the provided content carefully and extract:
1. "title": The official job title (e.g. "Senior Software Engineer", "Product Manager").
2. "description": The full job description, including duties, responsibilities, requirements, qualifications, and benefits.

Respond ONLY with a valid JSON object matching this schema (do not include any markdown formatting, code fences, or text outside the JSON):
{
  "title": "...",
  "description": "..."
}`;

function cleanHtml(html: string): string {
  // strip style blocks
  let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // strip script blocks
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // strip svg blocks
  text = text.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
  // strip head tag and its content
  text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  // strip HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  // replace multiple spaces/newlines with single space
  text = text.replace(/\s+/g, ' ').trim();
  return text.slice(0, 60000); // Take first 60,000 characters
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    console.log(`[Job Scraper] Fetching URL: ${url}`);
    
    // Fetch job posting page
    let html = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1"
        },
        next: { revalidate: 0 } // Bypass Next.js fetch cache
      });

      if (!response.ok) {
        throw new Error(`Website returned HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (fetchErr: any) {
      console.error("[Job Scraper] Fetch failed:", fetchErr);
      return NextResponse.json({ 
        error: `This job site requires manual copy-pasting or direct authentication. Please copy and paste the job description text directly into the form. (${fetchErr.message || fetchErr})` 
      }, { status: 422 });
    }

    if (!html || html.trim().length < 50) {
      return NextResponse.json({ error: "The fetched webpage content is empty or too short." }, { status: 422 });
    }

    const cleanedContent = cleanHtml(html);
    console.log(`[Job Scraper] Cleaned content size: ${cleanedContent.length} chars. Passing to Gemini...`);

    const userPrompt = `URL of Job: ${url}\n\nWebpage HTML Content:\n${cleanedContent}`;
    const rawAiResponse = await askAI(SYSTEM_PROMPT, userPrompt, 2500, "gemini-3.1-flash-lite");

    let parsedResult;
    try {
      parsedResult = cleanAndParseJson(rawAiResponse);
    } catch (parseErr) {
      console.error("[Job Scraper] Failed to parse AI JSON response:", rawAiResponse);
      return NextResponse.json({ error: "Could not parse extracted job details from AI response." }, { status: 502 });
    }

    if (!parsedResult.title && !parsedResult.description) {
      return NextResponse.json({ error: "Failed to extract any useful job details from the webpage." }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      title: parsedResult.title || "",
      description: parsedResult.description || ""
    });

  } catch (err: any) {
    console.error("[Job Scraper] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "An unexpected error occurred while scraping the job details." }, { status: 500 });
  }
}


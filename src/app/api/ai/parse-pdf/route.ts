import { NextRequest, NextResponse } from "next/server";
import { askAI, cleanAndParseJson } from "@/lib/ai";
const pdf = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, mode } = await req.json(); // mode: "text" | "json"
    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF data provided" }, { status: 400 });
    }

    // Clean up base64 prefix if present
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    
    // Parse PDF text locally using pdf-parse
    const pdfBuffer = Buffer.from(base64Data, "base64");
    const pdfData = await pdf(pdfBuffer);
    const extractedText = pdfData.text || "";

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Could not extract text from this PDF. It might be an image-only PDF." }, { status: 400 });
    }

    if (mode === "json") {
      const preferredModel = req.headers.get("x-ai-model") || "gemini-flash";
      
      const systemPrompt = `You are an expert resume parser. Parse the provided resume text and extract the structured sections.
Return ONLY a valid JSON object matching the following structure, with no formatting code blocks or extra text:
{
  "summary": "A clean, concise professional summary statement.",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "Start year/month",
      "endDate": "End year/month or 'Present'",
      "bullets": ["Action-oriented impact bullet point 1", "Action-oriented impact bullet point 2"]
    }
  ],
  "education": [
    {
      "school": "University/School Name",
      "degree": "Degree and major, e.g. B.S. Computer Science",
      "year": "Graduation year"
    }
  ],
  "skills": ["Skill 1", "Skill 2"]
}

Make sure the result has exactly this JSON structure. Do not include markdown brackets around JSON.`;

      const userPrompt = `Parse this resume text:\n\n${extractedText}`;

      try {
        const rawResponse = await askAI(systemPrompt, userPrompt, 2500, preferredModel);
        const parsed = cleanAndParseJson(rawResponse);
        return NextResponse.json({ success: true, data: parsed });
      } catch (e: any) {
        console.error("Failed to parse PDF structured JSON:", e);
        return NextResponse.json({ error: "Failed to structure resume content from PDF" }, { status: 502 });
      }
    } else {
      // mode === "text"
      return NextResponse.json({ success: true, text: extractedText });
    }
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ai, cleanAndParseJson, AI_MODEL } from "@/lib/ai";
import { Type } from "@google/genai";

const SYSTEM_PROMPT = `You are an expert interview coach. Evaluate the candidate's responses to the mock interview questions.
For each question, check whether the candidate's answer is factually correct, logically sound, or technically accurate, and label its correctness as "correct", "partially_correct", or "incorrect".
Grade the answer, provide a detailed correctness explanation, identify clear strengths, pinpoint constructive weaknesses, and write a high-impact sample answer that demonstrates how to answer optimally.
Also provide an overall score out of 100 and a high-level summary.`;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const interview = await prisma.mockInterview.findUnique({ where: { id: params.id } });
  if (!interview || interview.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { answers } = await req.json();
  if (!Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an array" }, { status: 400 });
  }

  const questions = interview.questions as string[];
  const qaContent = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");

  let score = 70; // default fallback score
  let feedbackText = "";

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: `Evaluate these interview responses:\n\n${qaContent}`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { 
                type: Type.INTEGER,
                description: "An overall score from 0 to 100 based on the candidate's performance."
              },
              overallSummary: { 
                type: Type.STRING,
                description: "A summary of how the candidate did, general strengths, and areas to work on."
              },
              qna: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    rating: { 
                      type: Type.INTEGER, 
                      description: "A score from 1 (poor) to 5 (excellent) for this specific answer."
                    },
                    correctness: {
                      type: Type.STRING,
                      description: "Whether the candidate's answer is correct or not. Must be one of: 'correct', 'partially_correct', 'incorrect'."
                    },
                    correctnessExplanation: {
                      type: Type.STRING,
                      description: "Detailed evaluation of why the answer is factually correct, partially correct, or incorrect."
                    },
                    strengths: { type: Type.STRING, description: "What was strong about this response." },
                    weaknesses: { type: Type.STRING, description: "What was missing or could be improved." },
                    sampleAnswer: { type: Type.STRING, description: "A highly polished, strong template response." }
                  },
                  required: ["question", "answer", "rating", "correctness", "correctnessExplanation", "strengths", "weaknesses", "sampleAnswer"]
                }
              }
            },
            required: ["score", "overallSummary", "qna"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        // Verify it parses as JSON
        try {
          const parsed = cleanAndParseJson(responseText);
          score = typeof parsed.score === "number" ? parsed.score : score;
          feedbackText = responseText; // Save the raw JSON string as the feedback
        } catch {
          feedbackText = responseText;
        }
      } else {
        feedbackText = "Failed to obtain a parseable evaluation. Please try again.";
      }
    } catch (err) {
      console.error("[Interview Submit] Structured evaluation failed:", err);
      feedbackText = "Error communicating with AI. Evaluation was not completed.";
    }
  } else {
    feedbackText = "Gemini API client is not configured.";
  }

  const updated = await prisma.mockInterview.update({
    where: { id: params.id },
    data: { 
      answers, 
      feedback: feedbackText,
      score: score // Save the numeric score to the DB!
    }
  });

  return NextResponse.json(updated);
}

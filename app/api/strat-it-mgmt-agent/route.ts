import { NextRequest, NextResponse } from "next/server";
import {
  fileSearchTool,
  Agent,
  AgentInputItem,
  Runner,
} from "@openai/agents";

export const runtime = "nodejs";

const fileSearch = fileSearchTool([
  "vs_693f9be452c48191983fcf64614f70f8",
]);

const expert = new Agent({
  name: "Expert",
  instructions: `- You are an expert in Strategic IT Management.
  - You will behave as an undergraduate student in a Strategic IT Management class, and write at the level of an undergrad.
  - Just respond to the question, without any context.
  - Ensure that your answers fully use the resources in the file store provided to you.
  - You will be faced with two different types of questions: Multiple Choice and Short Answer. 
  - If faced with a short answer question, answer in paragraph format, only using bullet points when necessary.
  - `,
  model: "gpt-5.1",
  tools: [fileSearch],
  modelSettings: {
    reasoning: { effort: "medium", summary: "auto" },
    store: true,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input_as_text } = body;

    if (!input_as_text) {
      return NextResponse.json(
        { error: "input_as_text is required" },
        { status: 400 }
      );
    }

    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [{ type: "input_text", text: input_as_text }],
      },
    ];

    const runner = new Runner();

    const run = await runner.run(expert, conversationHistory);
    if (!run.finalOutput) {
      throw new Error("Agent result is undefined");
    }
    const finalOutput = run.finalOutput;

    return NextResponse.json({ output_text: finalOutput });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json(
      { error: "Internal error running agent" },
      { status: 500 }
    );
  }
}


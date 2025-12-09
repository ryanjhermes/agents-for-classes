import { NextRequest, NextResponse } from "next/server";
import {
  fileSearchTool,
  Agent,
  AgentInputItem,
  Runner,
  withTrace,
} from "@openai/agents";

export const runtime = "nodejs";

const fileSearch = fileSearchTool([
  "vs_6938942c4e948191b2cd704cbdcf6ea2",
]);

const expert = new Agent({
  name: "Expert",
  instructions: `- You are an expert in IT infrastructure.
  - You will behave as an undergraduate student in an IT infrastructure class, and write at the level of an undergrad.
  - Just respond to the question, without any context.
  - Ensure that your answers use the resources in the file store provided to you.
  - Answer in paragraph format, only using bullet points when necessary.
  - If the user says this is a short answer question, answer in 2–3 sentences (stay STRICT to this).
  - If it's a descriptive answer question, aim for 2 SHORT paragraphs (stay STRICT to this).
  - If it's a case study/problem solving question, aim for 3 SHORT paragraphs (stay STRICT to this).`,
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

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_6938940e31c481909ea5e949f93d1f9104259c4286e7209b",
      },
    });

    const finalOutput = await withTrace("IT Infrastructure", async () => {
      const run = await runner.run(expert, conversationHistory);
      if (!run.finalOutput) {
        throw new Error("Agent result is undefined");
      }
      return run.finalOutput;
    });

    return NextResponse.json({ output_text: finalOutput });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json(
      { error: "Internal error running agent" },
      { status: 500 }
    );
  }
}


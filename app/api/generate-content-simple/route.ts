import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { type NextRequest, NextResponse } from "next/server";

// Alternative simpler approach for testing
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const { week } = await request.json();

    // Simplified prompt for testing
    const prompt = `Create a simple educational content structure for Week ${week} of a course. 
    
    Return a JSON object with:
    - 2 multiple choice questions
    - 1 short answer question
    - 2 video suggestions
    
    Keep the response concise and well-formatted.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      system:
        "You are an educational content creator. Always respond with valid JSON.",
      maxTokens: 2000,
      temperature: 0.3,
    });

    console.log("Raw AI Response:", result.text);

    // Try to parse the response
    let parsedContent;
    try {
      parsedContent = JSON.parse(result.text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", result.text);

      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          rawResponse: result.text,
          parseError: (parseError as Error).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: parsedContent,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}

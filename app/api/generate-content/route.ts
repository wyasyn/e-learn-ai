import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { courseData, weekData } = await request.json();

    const prompt = `
    Generate comprehensive educational content for a university course with the following details:
    
    Course: ${courseData.name} (${courseData.code})
    Level: ${courseData.level}
    Week ${weekData.week} Topics: ${weekData.topics}
    Study Materials: ${weekData.studyMaterials}
    
    Please generate:
    1. 5 multiple choice questions with 4 options each
    2. 3 quiz questions (mix of short answer and essay)
    3. Suggest 3 relevant YouTube video topics
    4. Create a PowerPoint outline with 15-20 slides
    
    Format the response as JSON with the following structure:
    {
      "mcqs": [{"question": "", "options": [], "correct": 0}],
      "quiz": [{"question": "", "type": "short|essay", "points": 0}],
      "videos": [{"title": "", "searchQuery": "", "duration": ""}],
      "presentation": {"title": "", "slides": [], "totalSlides": 0}
    }
    `;

    const { text } = await generateText({
      model: openai("gpt-4.1"),
      prompt,
      system:
        "You are an expert educational content creator specializing in university-level courses. Generate high-quality, academically rigorous content.",
    });

    // Parse the generated content
    let generatedContent;
    try {
      generatedContent = JSON.parse(text);
    } catch {
      // Fallback if JSON parsing fails
      generatedContent = {
        mcqs: [
          {
            question: `What is the main focus of week ${weekData.week} in ${courseData.name}?`,
            options: [
              "Basic concepts",
              "Advanced theory",
              "Practical applications",
              "Historical context",
            ],
            correct: 0,
          },
        ],
        quiz: [
          {
            question: `Explain the key concepts covered in week ${weekData.week}.`,
            type: "short",
            points: 10,
          },
        ],
        videos: [
          {
            title: `Week ${weekData.week}: Introduction`,
            searchQuery: weekData.topics,
            duration: "15:00",
          },
        ],
        presentation: {
          title: `Week ${weekData.week}: ${weekData.topics}`,
          slides: ["Introduction", "Main Concepts", "Examples", "Summary"],
          totalSlides: 15,
        },
      };
    }

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

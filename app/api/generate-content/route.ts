import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import type { Course, WeeklyContent } from "@/models/Course";
import { DatabaseService } from "@/services/database";

// OpenAI client will be created inside the function to avoid caching issues

// Define the schema for structured output
const ContentSchema = z.object({
  mcqs: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        correct: z.number().min(0).max(3),
        explanation: z.string(),
        difficulty: z.enum(["easy", "medium", "hard"]),
      })
    )
    .length(5),
  quizQuestions: z
    .array(
      z.object({
        question: z.string(),
        type: z.enum(["short", "essay", "practical"]),
        points: z.number().min(5).max(25),
        rubric: z.string(),
        expectedAnswer: z.string(),
      })
    )
    .length(4),
  easyQuestions: z
    .array(
      z.object({
        question: z.string(),
        type: z.literal("short"),
        points: z.number().min(5).max(10),
        rubric: z.string(),
        expectedAnswer: z.string(),
      })
    )
    .length(3),
  videoSuggestions: z
    .array(
      z.object({
        title: z.string(),
        searchQuery: z.string(),
        duration: z.string(),
        topics: z.array(z.string()),
        level: z.enum(["beginner", "intermediate", "advanced"]),
      })
    )
    .length(4),
  presentation: z.object({
    title: z.string(),
    slides: z.array(
      z.object({
        title: z.string(),
        content: z.array(z.string()),
        slideType: z.enum([
          "title",
          "content",
          "image",
          "comparison",
          "summary",
        ]),
      })
    ),
    totalSlides: z.number().min(15).max(25),
    learningObjectives: z.array(z.string()),
  }),
});

// Create the type from the schema
type GeneratedContent = z.infer<typeof ContentSchema>;

export async function POST(request: NextRequest) {
  try {
    // Debug: Check what the API key value actually is
    console.log('API Key first 20 chars:', process.env.OPENAI_API_KEY?.substring(0, 20));
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
    console.log('All env vars with OPENAI:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "AI content generation is currently unavailable. Please contact your administrator to configure the OpenAI API key.",
          type: "configuration_error",
        },
        { status: 503 }
      );
    }

    const { courseId, week } = await request.json();
    const dbService = DatabaseService.getInstance();
    const course = await dbService.getCourseById(courseId);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const weekData = course.weeklyContent.find((w) => w.week === week);
    if (!weekData) {
      return NextResponse.json(
        { error: "Week data not found" },
        { status: 404 }
      );
    }

    const prompt = createEnhancedPrompt(course, weekData);

    // Create OpenAI client with fresh API key
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      // Use generateObject with proper typing
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: ContentSchema,
        system: `You are an expert educational content creator and instructional designer with 15+ years of experience in university-level curriculum development. You specialize in creating engaging, pedagogically sound educational materials that promote active learning and critical thinking.

Your expertise includes:
- Bloom's Taxonomy application in question design
- Cognitive Load Theory principles
- Assessment design and rubric creation
- Multimedia learning principles
- Differentiated instruction strategies

Always ensure content is:
- Academically rigorous and age-appropriate
- Aligned with learning objectives
- Varied in difficulty levels
- Culturally sensitive and inclusive
- Engaging and interactive`,
        temperature: 0.7,
      });

      // Type assertion to cast the result to our expected type
      const generatedContent = result.object as GeneratedContent;

      // Save to database
      const savedContent = await dbService.saveGeneratedContent({
        courseId: new ObjectId(courseId),
        week: week,
        ...generatedContent,
        status: "generated",
      });

      return NextResponse.json({
        success: true,
        content: savedContent,
      });
    } catch (error) {
      const aiError = error as Error;
      console.error("AI Generation Error:", aiError);

      // Handle OpenAI API errors specifically
      if (
        aiError.message?.includes("API key") ||
        aiError.message?.includes("authentication")
      ) {
        return NextResponse.json(
          {
            error:
              "AI content generation is currently unavailable due to authentication issues. Please contact your administrator.",
            type: "auth_error",
          },
          { status: 503 }
        );
      }

      if (
        aiError.message?.includes("quota") ||
        aiError.message?.includes("billing")
      ) {
        return NextResponse.json(
          {
            error:
              "AI content generation is temporarily unavailable due to usage limits. Please try again later or contact your administrator.",
            type: "quota_error",
          },
          { status: 503 }
        );
      }

      // Generic AI error
      return NextResponse.json(
        {
          error:
            "AI content generation is currently experiencing issues. Please try again in a few minutes.",
          type: "ai_error",
          details: aiError.message,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

function createEnhancedPrompt(course: Course, weekData: WeeklyContent): string {
  return `Create comprehensive educational content for a university course with the following specifications:

**COURSE CONTEXT:**
- Course: ${course.name} (${course.code})
- Level: ${course.level}
- Credits: ${course.credits}
- Semester: ${course.semester}
- Course Description: ${course.description}
- Learning Outcomes: ${course.learningOutcomes}
- Assessment Mode: ${course.assessmentMode}

**WEEK ${weekData.week} SPECIFICATIONS:**
- Topics: ${weekData.topics}
- Study Materials: ${weekData.studyMaterials}
- Prerequisites: ${course.requirements}

**CONTENT REQUIREMENTS:**

1. **Multiple Choice Questions (5 questions):**
   - Mix of difficulty levels (2 easy, 2 medium, 1 hard)
   - Test different cognitive levels (knowledge, comprehension, application, analysis)
   - Include realistic distractors
   - Provide clear explanations

2. **Quiz Questions (4 questions):**
   - 2 short answer (5-10 points each)
   - 2 essay questions (15-25 points each)
   - Include detailed rubrics
   - Align with learning outcomes

3. **Easy Questions (3 questions):**
   - Focus on basic concepts and definitions
   - Suitable for review and reinforcement
   - 5-10 points each

4. **Video Suggestions (4 videos):**
   - Vary in length (5-20 minutes)
   - Include different perspectives and formats
   - Provide specific search queries
   - Match course level

5. **PowerPoint Presentation (15-20 slides):**
   - Logical flow from introduction to conclusion
   - Mix of slide types for engagement
   - Include discussion prompts
   - Align with week's learning objectives

**QUALITY STANDARDS:**
- All content must be academically rigorous
- Questions should be clear and unambiguous
- Avoid cultural bias or stereotypes
- Include varied assessment methods
- Ensure content builds progressively
- Use active voice and clear language

Generate content that promotes deep learning, critical thinking, and practical application of concepts.`;
}

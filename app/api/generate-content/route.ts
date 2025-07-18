import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { Course, WeeklyContent } from "@/models/Course";
import { DatabaseService } from "@/services/database";

export async function POST(request: NextRequest) {
  try {
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

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
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
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Parse and validate the generated content
    let generatedContent;
    try {
      generatedContent = JSON.parse(text);

      // Validate required fields
      if (
        !generatedContent.mcqs ||
        !generatedContent.quizQuestions ||
        !generatedContent.videoSuggestions ||
        !generatedContent.presentation
      ) {
        throw new Error("Invalid content structure");
      }
    } catch (parseError) {
      console.error("Error parsing generated content:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

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
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

function createEnhancedPrompt(course: Course, weekData: WeeklyContent): string {
  return `
Create comprehensive educational content for a university course with the following specifications:

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

Generate exactly this JSON structure:

{
  "mcqs": [
    {
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Detailed explanation of why this answer is correct",
      "difficulty": "easy|medium|hard"
    }
  ],
  "quizQuestions": [
    {
      "question": "Question text",
      "type": "short|essay|practical",
      "points": 5-25,
      "rubric": "Detailed scoring criteria",
      "expectedAnswer": "Sample ideal answer or key points"
    }
  ],
  "easyQuestions": [
    {
      "question": "Basic review question",
      "type": "short",
      "points": 5-10,
      "rubric": "Simple scoring criteria",
      "expectedAnswer": "Expected response"
    }
  ],
  "videoSuggestions": [
    {
      "title": "Engaging video title",
      "searchQuery": "Specific YouTube search terms",
      "duration": "XX:XX",
      "topics": ["topic1", "topic2"],
      "level": "beginner|intermediate|advanced"
    }
  ],
  "presentation": {
    "title": "Week X: Engaging Title",
    "slides": [
      {
        "title": "Slide Title",
        "content": ["Bullet point 1", "Bullet point 2", "Key concept"],
        "slideType": "title|content|image|comparison|summary"
      }
    ],
    "totalSlides": 15-25,
    "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
  }
}

**SPECIFIC INSTRUCTIONS:**

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

Generate content that promotes deep learning, critical thinking, and practical application of concepts.
`;
}

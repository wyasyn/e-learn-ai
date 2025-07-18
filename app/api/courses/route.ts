import { NextRequest, NextResponse } from "next/server";
import { Course, WeeklyContent } from "@/models/Course";
import { DatabaseService } from "@/services/database";

export async function POST(request: NextRequest) {
  try {
    const instructorId = request.headers.get("user-id");

    if (!instructorId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const courseDataString = formData.get("courseData") as string;

    if (!courseDataString) {
      return NextResponse.json(
        { error: "Course data is required" },
        { status: 400 }
      );
    }

    const courseData = JSON.parse(courseDataString);

    // Validate required fields
    const requiredFields = [
      "name",
      "code",
      "level",
      "semester",
      "credits",
      "description",
      "objectives",
      "learningOutcomes",
      "assessmentMode",
    ];
    const missingFields = requiredFields.filter((field) => !courseData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate weekly content
    if (!courseData.weeklyContent || courseData.weeklyContent.length === 0) {
      return NextResponse.json(
        { error: "At least one week of content is required" },
        { status: 400 }
      );
    }

    // Check if topics are provided for all weeks
    const weeksWithoutTopics = courseData.weeklyContent.filter(
      (week: WeeklyContent) => !week.topics?.trim()
    );
    if (weeksWithoutTopics.length > 0) {
      return NextResponse.json(
        { error: "Topics are required for all weeks" },
        { status: 400 }
      );
    }

    // Handle file uploads (optional - you can expand this based on your needs)
    const files = formData.getAll("files") as File[];
    const uploadedFileNames = files.map((file) => file.name);

    // Prepare course data for database
    const courseForDb: Omit<Course, "_id" | "createdAt" | "updatedAt"> = {
      name: courseData.name,
      code: courseData.code,
      level: courseData.level,
      semester: courseData.semester,
      credits: courseData.credits,
      description: courseData.description,
      objectives: courseData.objectives,
      learningOutcomes: courseData.learningOutcomes,
      requirements: courseData.requirements || "",
      assessmentMode: courseData.assessmentMode,
      weeklyContent: courseData.weeklyContent,
      uploadedFiles: uploadedFileNames,
      instructorId,
      students: courseData.students || 0,
      status: courseData.status || "draft",
    };

    // Create course in database
    const db = DatabaseService.getInstance();
    const course = await db.createCourse(courseForDb);

    // Check if course was created successfully and has an ID
    if (!course || !course._id) {
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    // TODO: Process uploaded files - save to file system or cloud storage
    // For now, we just store the file names
    if (files.length > 0) {
      console.log(`${files.length} files uploaded for course ${course._id}`);
      // You can implement file processing here:
      // - Save files to local storage or cloud storage
      // - Process PowerPoint files to extract content
      // - Parse PDFs for text content
      // - Store file metadata in database
    }

    return NextResponse.json(
      {
        message: "Course created successfully",
        course: {
          ...course,
          _id: course._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const instructorId = request.headers.get("user-id");

    if (!instructorId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    const db = DatabaseService.getInstance();
    const courses = await db.getCoursesByInstructor(instructorId);

    // Convert ObjectIds to strings for JSON response
    const coursesWithStringIds = courses.map((course) => ({
      ...course,
      _id: course._id?.toString() || "", // Handle potential undefined _id
    }));

    return NextResponse.json({ courses: coursesWithStringIds });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

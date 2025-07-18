import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const courseData = await request.json();

    // Add instructor ID from session/auth (you'll need to implement authentication)
    const instructorId = request.headers.get("user-id") || "default-instructor";

    const dbService = DatabaseService.getInstance();
    const course = await dbService.createCourse({
      ...courseData,
      instructorId,
      students: 0,
      status: "draft" as const,
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId =
      searchParams.get("instructorId") || "default-instructor";

    const dbService = DatabaseService.getInstance();
    const courses = await dbService.getCoursesByInstructor(instructorId);

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

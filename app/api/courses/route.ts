/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Course, WeeklyContent } from "@/models/Course";
import { DatabaseService } from "@/services/database";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(
  file: File,
  courseId: string
): Promise<string> {
  try {
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve, reject) => {
      // Create a readable stream from buffer
      const stream = Readable.from(buffer);

      // Upload to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto", // Automatically detect file type
          folder: `courses/${courseId}`, // Organize files in folders by course
          public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`, // Remove extension, Cloudinary will add it back
          use_filename: true,
          unique_filename: false,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Error preparing file for upload:", error);
    throw new Error("Failed to prepare file for upload");
  }
}

// async function deleteFromCloudinary(publicId: string): Promise<void> {
//   try {
//     await cloudinary.uploader.destroy(publicId);
//   } catch (error) {
//     console.error("Error deleting from Cloudinary:", error);
//   }
// }

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instructorId = session.user.id;

    // Parse form data
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

    // First create the course to get an ID for file organization
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
      uploadedFiles: [],
      instructorId,
      students: courseData.students || 0,
      status: courseData.status || "draft",
    };

    // Create course in database
    const db = DatabaseService.getInstance();
    const course = await db.createCourse(courseForDb);

    if (!course || !course._id) {
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    // Handle file uploads to Cloudinary
    const files = formData.getAll("files") as File[];
    const uploadedFileUrls: string[] = [];
    const uploadErrors: string[] = [];

    if (files.length > 0) {
      console.log(`Processing ${files.length} files for course ${course._id}`);

      // Validate file types and sizes
      const allowedTypes = [
        "application/vnd.ms-powerpoint", // .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "application/pdf",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "text/plain",
      ];

      const maxFileSize = 10 * 1024 * 1024; // 10MB limit

      for (const file of files) {
        try {
          // Validate file type
          if (
            !allowedTypes.includes(file.type) &&
            !file.name.match(/\.(ppt|pptx|pdf|doc|docx|txt)$/i)
          ) {
            uploadErrors.push(`${file.name}: Unsupported file type`);
            continue;
          }

          // Validate file size
          if (file.size > maxFileSize) {
            uploadErrors.push(`${file.name}: File too large (max 10MB)`);
            continue;
          }

          // Upload to Cloudinary
          const uploadedUrl = await uploadToCloudinary(
            file,
            course._id.toString()
          );
          uploadedFileUrls.push(uploadedUrl);

          console.log(`Successfully uploaded: ${file.name} -> ${uploadedUrl}`);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          uploadErrors.push(`${file.name}: Upload failed`);
        }
      }

      // Update course with uploaded file URLs
      if (uploadedFileUrls.length > 0) {
        try {
          await db.updateCourse(course._id.toString(), {
            uploadedFiles: uploadedFileUrls,
          });
        } catch (error) {
          console.error("Error updating course with file URLs:", error);
          // Don't fail the entire request, just log the error
        }
      }
    }

    // Prepare response
    const response: any = {
      message: "Course created successfully",
      course: {
        ...course,
        _id: course._id.toString(),
        uploadedFiles: uploadedFileUrls,
      },
    };

    // Include upload errors in response if any
    if (uploadErrors.length > 0) {
      response.uploadErrors = uploadErrors;
      response.message += ` (${uploadErrors.length} file(s) failed to upload)`;
    }

    if (uploadedFileUrls.length > 0) {
      response.message += ` (${uploadedFileUrls.length} file(s) uploaded successfully)`;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);

    // If it's a Cloudinary error, provide more specific error message
    if (error instanceof Error && error.message.includes("Cloudinary")) {
      return NextResponse.json(
        {
          error:
            "File upload service is currently unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the session to identify the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbService = DatabaseService.getInstance();
    const courses = await dbService.getCoursesByInstructor(session.user.id);

    // Convert ObjectId to string for frontend consumption
    const coursesWithStringId = courses.map((course) => ({
      ...course,
      _id: course._id?.toString() || "",
    }));

    return NextResponse.json({ courses: coursesWithStringId });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

import { Course } from "@/models/Course";
import { ObjectId, Filter } from "mongodb";
import { GeneratedContent } from "@/models/GeneratedContent";
import { connectToDatabase } from "@/lib/db";

const clientPromise = connectToDatabase();

export class DatabaseService {
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async createCourse(
    courseData: Omit<Course, "_id" | "createdAt" | "updatedAt">
  ): Promise<Course> {
    const client = await clientPromise;
    const db = client.db("study-buddy");

    const course: Course = {
      ...courseData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Course>("courses").insertOne(course);
    return { ...course, _id: result.insertedId };
  }

  async getCourseById(id: string): Promise<Course | null> {
    const client = await clientPromise;
    const db = client.db("study-buddy");

    return await db
      .collection<Course>("courses")
      .findOne({ _id: new ObjectId(id) });
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    const client = await clientPromise;
    const db = client.db("study-buddy");

    return await db
      .collection<Course>("courses")
      .find({ instructorId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db("study-buddy");

    const result = await db
      .collection<Course>("courses")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } }
      );

    return result.modifiedCount > 0;
  }

  async saveGeneratedContent(
    content: Omit<GeneratedContent, "_id" | "generatedAt">
  ): Promise<GeneratedContent> {
    const client = await clientPromise;
    const db = client.db("study-buddy");

    const generatedContent: GeneratedContent = {
      ...content,
      generatedAt: new Date(),
    };

    // Check if content already exists for this course and week
    const existing = await db
      .collection<GeneratedContent>("generated_content")
      .findOne({
        courseId: content.courseId,
        week: content.week,
      });

    if (existing) {
      // Update existing content
      await db
        .collection<GeneratedContent>("generated_content")
        .updateOne(
          { courseId: content.courseId, week: content.week },
          { $set: generatedContent }
        );
      return { ...generatedContent, _id: existing._id };
    } else {
      // Create new content
      const result = await db
        .collection<GeneratedContent>("generated_content")
        .insertOne(generatedContent);
      return { ...generatedContent, _id: result.insertedId };
    }
  }

  async getGeneratedContent(
    courseId: string,
    week?: number
  ): Promise<GeneratedContent[]> {
    const client = await clientPromise;
    const db = client.db("study-buddy");

    const query: Filter<GeneratedContent> = {
      courseId: new ObjectId(courseId),
    };
    if (week !== undefined) {
      query.week = week;
    }

    return await db
      .collection<GeneratedContent>("generated_content")
      .find(query)
      .sort({ week: 1 })
      .toArray();
  }

  async deleteCourse(id: string): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db("study-buddy");

    // Start a transaction to delete course and related content
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const courseId = new ObjectId(id);

        // Delete generated content first
        await db
          .collection("generated_content")
          .deleteMany({ courseId }, { session });

        // Delete the course
        await db
          .collection("courses")
          .deleteOne({ _id: courseId }, { session });
      });

      return true;
    } catch (error) {
      console.error("Error deleting course:", error);
      return false;
    } finally {
      await session.endSession();
    }
  }
}

import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await connectToDatabase();
    const db = client.db("study-buddy");
    const collections = await db.listCollections().toArray();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    return NextResponse.json(
      { message: "Database connection error", error },
      { status: 500 }
    );
  }
}

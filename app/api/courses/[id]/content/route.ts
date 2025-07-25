import { DatabaseService } from "@/services/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    const { searchParams } = new URL(request.url);
    const week = searchParams.get("week");

    const dbService = DatabaseService.getInstance();
    const content = await dbService.getGeneratedContent(
      id,
      week ? parseInt(week) : undefined
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching generated content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

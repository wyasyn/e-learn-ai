import { ObjectId } from "mongodb";

export interface WeeklyContent {
  week: number;
  topics: string;
  studyMaterials: string;
}

export interface Course {
  _id?: ObjectId;
  name: string;
  code: string;
  level: string;
  semester: string;
  credits: number;
  description: string;
  objectives: string;
  learningOutcomes: string;
  requirements: string;
  assessmentMode: string;
  weeklyContent: WeeklyContent[];
  uploadedFiles: string[];
  students: number;
  status: "active" | "draft";
  createdAt: Date;
  updatedAt: Date;
  instructorId: string; // Add instructor/user ID
}

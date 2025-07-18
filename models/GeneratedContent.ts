import { ObjectId } from "mongodb";

export interface MCQ {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizQuestion {
  question: string;
  type: "short" | "essay" | "practical";
  points: number;
  rubric?: string;
  expectedAnswer?: string;
}

export interface VideoSuggestion {
  title: string;
  searchQuery: string;
  duration: string;
  topics: string[];
  level: string;
}

export interface PresentationSlide {
  title: string;
  content: string[];
  slideType: "title" | "content" | "image" | "comparison" | "summary";
}

export interface GeneratedContent {
  _id?: ObjectId;
  courseId: ObjectId;
  week: number;
  mcqs: MCQ[];
  quizQuestions: QuizQuestion[];
  easyQuestions: QuizQuestion[];
  videoSuggestions: VideoSuggestion[];
  presentation: {
    title: string;
    slides: PresentationSlide[];
    totalSlides: number;
    learningObjectives: string[];
  };
  generatedAt: Date;
  status: "generated" | "reviewed" | "approved";
}

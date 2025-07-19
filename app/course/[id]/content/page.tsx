/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Brain,
  FileText,
  Video,
  HelpCircle,
  Presentation,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Course {
  _id: string;
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
  weeklyContent: Array<{
    week: number;
    topics: string;
    studyMaterials: string;
  }>;
  uploadedFiles: string[];
  students: number;
  status: "active" | "draft";
  createdAt: string;
}

interface Slide {
  title: string;
  content: string[];
  slideType: "title" | "content" | "image" | "comparison" | "summary";
}

interface GeneratedContent {
  week: number;
  mcqs: Array<{
    question: string;
    options: string[];
    correct: number;
    explanation?: string;
    difficulty?: "easy" | "medium" | "hard";
  }>;
  quiz: Array<{
    question: string;
    type: "short" | "essay" | "practical";
    points: number;
    rubric?: string;
    expectedAnswer?: string;
  }>;
  easyQuestions: Array<{
    question: string;
    type: "short";
    points: number;
    rubric?: string;
    expectedAnswer?: string;
  }>;
  videos: Array<{
    title: string;
    searchQuery?: string;
    duration: string;
    topics?: string[];
    level?: "beginner" | "intermediate" | "advanced";
    url?: string; // keeping for backward compatibility
  }>;
  presentation: {
    title: string;
    slides: Slide[];
    totalSlides: number;
    learningObjectives: string[];
  };
}

export default function CourseContent() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [generatedContent, setGeneratedContent] = useState<
    Record<number, GeneratedContent>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState("mcqs");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoadingCourse(true);
      setError(null);

      try {
        const response = await fetch(`/api/courses/${params.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }
        const foundCourse = await response.json();

        setCourse(foundCourse.course);

        // Load all generated content after course is loaded
        if (foundCourse.course) {
          await loadAllGeneratedContent();
        }
      } catch (error) {
        const e = error as Error;
        console.error("Error fetching course:", error);
        setError(e.message);
      } finally {
        setIsLoadingCourse(false);
      }
    };

    if (params.id) {
      fetchCourse();
    }
  }, [params.id]);

  // Load all generated content for the course
  const loadAllGeneratedContent = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}/content`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          // No content exists yet, this is expected
          setGeneratedContent({});
          return;
        }
        throw new Error("Failed to fetch content");
      }

      const data = await response.json();

      // Convert array to object keyed by week number and transform data
      const contentByWeek = (data.content || []).reduce(
        (acc: Record<number, GeneratedContent>, item: any) => {
          acc[item.week] = transformApiContentToUI(item);
          return acc;
        },
        {}
      );

      setGeneratedContent(contentByWeek);
    } catch (error) {
      console.error("Error loading generated content:", error);
      setError("Failed to load content. Please try again.");
    }
  };

  // Load content for a specific week
  const loadWeekContent = async (week: number) => {
    // If content already exists for this week, don't fetch again
    if (generatedContent[week]) {
      return;
    }

    setIsLoadingWeek(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${params.id}/content?week=${week}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          // No content for this week yet
          setIsLoadingWeek(false);
          return;
        }
        throw new Error("Failed to fetch week content");
      }

      const data = await response.json();

      if (data.content && data.content.length > 0) {
        setGeneratedContent((prev) => ({
          ...prev,
          [week]: transformApiContentToUI(data.content[0]),
        }));
      }
    } catch (error) {
      console.error("Error loading week content:", error);
      setError(`Failed to load content for week ${week}`);
    } finally {
      setIsLoadingWeek(false);
    }
  };

  // Transform API response to match UI interface
  const transformApiContentToUI = (apiContent: any): GeneratedContent => {
    return {
      week: apiContent.week,
      mcqs: apiContent.mcqs || [],
      quiz: (apiContent.quizQuestions || []).concat(
        apiContent.easyQuestions || []
      ),
      easyQuestions: apiContent.easyQuestions || [],
      videos: apiContent.videoSuggestions || [],
      presentation: {
        title:
          apiContent.presentation?.title ||
          `Week ${apiContent.week} Presentation`,
        slides: apiContent.presentation?.slides || [],
        totalSlides:
          apiContent.presentation?.totalSlides ||
          apiContent.presentation?.slides?.length ||
          20,
        learningObjectives: apiContent.presentation?.learningObjectives || [],
      },
    };
  };

  // Handle week selection
  const handleWeekSelect = async (week: number) => {
    setSelectedWeek(week);
    setCurrentSlideIndex(0); // Reset slide index when changing weeks
    await loadWeekContent(week);
  };

  const generateAIContent = async () => {
    if (!course || !course.weeklyContent) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Generate content for all weeks
      const generatePromises = course.weeklyContent.map(async (weekData) => {
        const response = await fetch("/api/generate-content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: params.id,
            week: weekData.week,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            `Failed to generate content for week ${weekData.week}`;
          console.error(`Week ${weekData.week}:`, errorMessage);
          return { error: errorMessage, week: weekData.week };
        }

        return response.json();
      });

      // Wait for all weeks to be generated
      const results = await Promise.allSettled(generatePromises);

      // Check for errors and collect them
      const errors: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const errorMessage =
            result.reason?.message || `Week ${index + 1} failed`;
          errors.push(errorMessage);
          console.error(
            `Failed to generate content for week ${index + 1}:`,
            result.reason
          );
        } else if (result.value?.error) {
          // Handle API errors returned in the response
          errors.push(`Week ${result.value.week}: ${result.value.error}`);
        }
      });

      // Show errors to user if any occurred
      if (errors.length > 0) {
        setError(`Some content generation failed:\n${errors.join("\n")}`);
      }

      // Reload all content after generation
      await loadAllGeneratedContent();
    } catch (error) {
      console.error("Error generating content:", error);
      setError(
        "Failed to generate content. Please check your connection and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate content for a specific week
  const generateWeekContent = async (week: number) => {
    if (!course) return;

    setIsLoadingWeek(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: params.id,
          week: week,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Failed to generate content for week ${week}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.content) {
        // Update the specific week's content
        setGeneratedContent((prev) => ({
          ...prev,
          [week]: transformApiContentToUI(result.content),
        }));
      }
    } catch (error) {
      console.error(`Error generating content for week ${week}:`, error);
      setError(
        `Failed to generate content for week ${week}. Please try again.`
      );
    } finally {
      setIsLoadingWeek(false);
    }
  };

  // Handle tab change - load content if needed
  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    await loadWeekContent(selectedWeek);
  };

  // Slide navigation functions
  const nextSlide = () => {
    const currentWeekContent = generatedContent[selectedWeek];
    if (currentWeekContent?.presentation?.slides) {
      setCurrentSlideIndex((prev) =>
        prev < currentWeekContent.presentation.slides.length - 1
          ? prev + 1
          : prev
      );
    }
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const getSlideTypeIcon = (slideType: string) => {
    switch (slideType) {
      case "title":
        return "📋";
      case "content":
        return "📝";
      case "image":
        return "🖼️";
      case "comparison":
        return "⚖️";
      case "summary":
        return "📋";
      default:
        return "📄";
    }
  };

  // Show loading spinner while fetching course data
  if (isLoadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-blue-600" />
          <h2 className="text-2xl font-bold mb-2">Loading Course</h2>
          <p className="text-gray-600 mb-4">
            Please wait while we load the course information...
          </p>
        </div>
      </div>
    );
  }

  // Show not found only after loading is complete and course is null
  if (!course && !isLoadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-gray-600 mb-4">
            The requested course could not be loaded.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Add safety checks for weeklyContent
  if (!course?.weeklyContent || !Array.isArray(course.weeklyContent)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Invalid course data</h2>
          <p className="text-gray-600 mb-4">
            This course doesn&apos;t have valid weekly content structure.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentWeekContent = generatedContent[selectedWeek];
  const hasAnyContent = Object.keys(generatedContent).length > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 max-[600px]:h-auto max-[600px]:flex-col gap-4 max-[600px]:py-5">
            <div className="flex items-center space-x-4 max-[400px]:flex-col max-[400px]:space-y-4">
              <Link href={`/course/${course._id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">AI Generated Content</h1>
                <p className="text-sm ">
                  {course.name} ({course.code})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={generateAIContent}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate AI Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 border">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasAnyContent ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="max-w-md mx-auto">
                <Brain className="h-20 w-20 mx-auto mb-6 " />
                <h3 className="text-2xl font-semibold mb-3 ">
                  Ready to Generate AI Content?
                </h3>
                <p className=" mb-8 leading-relaxed">
                  Create comprehensive learning materials including multiple
                  choice questions, quizzes, video recommendations, and
                  presentations for all {course.weeklyContent?.length || 0}{" "}
                  weeks of your course.
                </p>
                <div className="space-y-4">
                  <Button
                    onClick={generateAIContent}
                    disabled={isGenerating}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Generate AI Content for All Weeks
                      </>
                    )}
                  </Button>
                  <div className="text-sm">
                    This will create content for weeks 1-
                    {course.weeklyContent?.length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Week Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Week</CardTitle>
                <CardDescription>
                  Choose a week to view and manage its AI-generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {course.weeklyContent?.map((week) => (
                    <Button
                      key={week.week}
                      variant={
                        selectedWeek === week.week ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleWeekSelect(week.week)}
                      disabled={isLoadingWeek}
                      className="relative"
                    >
                      Week {week.week}
                      {generatedContent[week.week] && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-4 w-4 p-0 text-xs"
                        >
                          ✓
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Loading state for week content */}
            {isLoadingWeek && (
              <Card>
                <CardContent className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p>Loading week {selectedWeek} content...</p>
                </CardContent>
              </Card>
            )}

            {/* Content Tabs */}
            {currentWeekContent && !isLoadingWeek && (
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="mcqs" className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Multiple Choice
                  </TabsTrigger>
                  <TabsTrigger value="quizzes" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Quizzes
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="flex items-center">
                    <Video className="h-4 w-4 mr-2" />
                    Videos
                  </TabsTrigger>
                  <TabsTrigger
                    value="presentations"
                    className="flex items-center"
                  >
                    <Presentation className="h-4 w-4 mr-2" />
                    Presentations
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mcqs" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Multiple Choice Questions - Week {selectedWeek}
                    </h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export MCQs
                    </Button>
                  </div>

                  {!currentWeekContent.mcqs ||
                  currentWeekContent.mcqs.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                      <CardContent>
                        <HelpCircle className="h-12 w-12 mx-auto mb-4 " />
                        <h4 className="text-lg font-medium  mb-2">
                          No MCQs Available
                        </h4>
                        <p className=" mb-4">
                          No multiple choice questions have been generated for
                          week {selectedWeek} yet.
                        </p>
                        <Button
                          onClick={() => generateWeekContent(selectedWeek)}
                          disabled={isGenerating || isLoadingWeek}
                          variant="outline"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Generate MCQs
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {currentWeekContent.mcqs.map((mcq, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base flex items-center">
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Question {index + 1}
                              </CardTitle>
                              {mcq.difficulty && (
                                <Badge
                                  variant={
                                    mcq.difficulty === "easy"
                                      ? "secondary"
                                      : mcq.difficulty === "medium"
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {mcq.difficulty}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="font-medium mb-3">{mcq.question}</p>
                            <div className="space-y-2">
                              {(mcq.options || []).map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded border ${
                                    optIndex === mcq.correct
                                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                      : "border-gray-200 dark:border-gray-700"
                                  }`}
                                >
                                  <span className="font-medium mr-2">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  {option}
                                  {optIndex === mcq.correct && (
                                    <Badge variant="secondary" className="ml-2">
                                      Correct
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                            {mcq.explanation && (
                              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  Explanation:
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                  {mcq.explanation}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quizzes" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Quiz Questions - Week {selectedWeek}
                    </h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Quiz
                    </Button>
                  </div>

                  {!currentWeekContent.quiz ||
                  currentWeekContent.quiz.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                      <CardContent>
                        <FileText className="h-12 w-12 mx-auto mb-4 " />
                        <h4 className="text-lg font-medium  mb-2">
                          No Quiz Questions Available
                        </h4>
                        <p className=" mb-4">
                          No quiz questions have been generated for week{" "}
                          {selectedWeek} yet.
                        </p>
                        <Button
                          onClick={() => generateWeekContent(selectedWeek)}
                          disabled={isGenerating || isLoadingWeek}
                          variant="outline"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Generate Quiz Questions
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {currentWeekContent.quiz.map((question, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                Question {index + 1}
                              </CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={
                                    question.type === "essay"
                                      ? "default"
                                      : question.type === "practical"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {question.type}
                                </Badge>
                                <Badge variant="outline">
                                  {question.points} pts
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p>{question.question}</p>

                            {question.rubric && (
                              <div className="p-3  rounded-lg">
                                <p className="text-sm font-medium mb-1">
                                  Rubric:
                                </p>
                                <p className="text-sm ">{question.rubric}</p>
                              </div>
                            )}

                            {question.expectedAnswer && (
                              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                  Expected Answer/Key Points:
                                </p>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  {question.expectedAnswer}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Learning Videos - Week {selectedWeek}
                    </h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export List
                    </Button>
                  </div>

                  {!currentWeekContent.videos ||
                  currentWeekContent.videos.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                      <CardContent>
                        <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No Video Recommendations Available
                        </h4>
                        <p className="text-gray-500 mb-4">
                          No learning videos have been suggested for week{" "}
                          {selectedWeek} yet.
                        </p>
                        <Button
                          onClick={() => generateWeekContent(selectedWeek)}
                          disabled={isGenerating || isLoadingWeek}
                          variant="outline"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Generate Video Recommendations
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentWeekContent.videos.map((video, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center">
                              <Video className="h-4 w-4 mr-2" />
                              {video.title}
                            </CardTitle>
                            <CardDescription className="flex items-center justify-between">
                              <span>Duration: {video.duration}</span>
                              {video.level && (
                                <Badge variant="outline" className="ml-2">
                                  {video.level}
                                </Badge>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="aspect-video rounded-lg flex items-center justify-center mb-3 bg-gray-100 dark:bg-gray-800">
                              <Video className="h-12 w-12 text-gray-400" />
                            </div>

                            {video.topics && video.topics.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium mb-1">
                                  Topics:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {video.topics.map((topic, topicIndex) => (
                                    <Badge
                                      key={topicIndex}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  window.open(
                                    `https://youtube.com/results?search_query=${encodeURIComponent(
                                      video.searchQuery || video.title
                                    )}`,
                                    "_blank"
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Search on YouTube
                              </Button>
                              {video.url && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full"
                                  onClick={() =>
                                    window.open(video.url, "_blank")
                                  }
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Watch Video
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="presentations" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Presentation - Week {selectedWeek}
                    </h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Slides
                    </Button>
                  </div>

                  {!currentWeekContent.presentation ||
                  !currentWeekContent.presentation.slides ||
                  currentWeekContent.presentation.slides.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                      <CardContent>
                        <Presentation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No Presentation Available
                        </h4>
                        <p className="text-gray-500 mb-4">
                          No presentation slides have been generated for week{" "}
                          {selectedWeek} yet.
                        </p>
                        <Button
                          onClick={() => generateWeekContent(selectedWeek)}
                          disabled={isGenerating || isLoadingWeek}
                          variant="outline"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Generate Presentation
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {/* Presentation Header */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Presentation className="h-5 w-5 mr-2" />
                            {currentWeekContent.presentation.title}
                          </CardTitle>
                          <CardDescription>
                            {currentWeekContent.presentation.slides.length}{" "}
                            slides total
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {currentWeekContent.presentation.learningObjectives &&
                            currentWeekContent.presentation.learningObjectives
                              .length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">
                                  Learning Objectives:
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                  {currentWeekContent.presentation.learningObjectives.map(
                                    (objective, index) => (
                                      <li key={index}>{objective}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </CardContent>
                      </Card>

                      {/* Slide Viewer */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                Slide {currentSlideIndex + 1} of{" "}
                                {currentWeekContent.presentation.slides.length}
                              </Badge>
                              <Badge variant="secondary">
                                {getSlideTypeIcon(
                                  currentWeekContent.presentation.slides[
                                    currentSlideIndex
                                  ]?.slideType
                                )}{" "}
                                {currentWeekContent.presentation.slides[
                                  currentSlideIndex
                                ]?.slideType || "content"}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={prevSlide}
                                disabled={currentSlideIndex === 0}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={nextSlide}
                                disabled={
                                  currentSlideIndex ===
                                  currentWeekContent.presentation.slides
                                    .length -
                                    1
                                }
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {currentWeekContent.presentation.slides[
                            currentSlideIndex
                          ] && (
                            <div className="bg-white dark:bg-gray-900 border rounded-lg p-8 min-h-[400px]">
                              <h2 className="text-2xl font-bold mb-6 text-center">
                                {
                                  currentWeekContent.presentation.slides[
                                    currentSlideIndex
                                  ].title
                                }
                              </h2>
                              <div className="space-y-4">
                                {currentWeekContent.presentation.slides[
                                  currentSlideIndex
                                ].content.map((contentItem, index) => (
                                  <div key={index} className="text-lg">
                                    {contentItem.startsWith("•") ||
                                    contentItem.startsWith("-") ? (
                                      <div className="flex items-start">
                                        <span className="mr-3 mt-1">•</span>
                                        <span>
                                          {contentItem.replace(/^[•\-]\s*/, "")}
                                        </span>
                                      </div>
                                    ) : (
                                      <p>{contentItem}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Slide Navigation */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            All Slides
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {currentWeekContent.presentation.slides.map(
                              (slide, index) => (
                                <Button
                                  key={index}
                                  variant={
                                    currentSlideIndex === index
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setCurrentSlideIndex(index)}
                                  className="text-xs p-2 h-auto flex-col"
                                >
                                  <span className="mb-1">
                                    {getSlideTypeIcon(slide.slideType)}
                                  </span>
                                  <span className="truncate w-full">
                                    Slide {index + 1}
                                  </span>
                                </Button>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* No content for selected week */}
            {!currentWeekContent && !isLoadingWeek && (
              <Card className="text-center py-12 border-dashed">
                <CardContent>
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Content Available for Week {selectedWeek}
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Generate AI content for this week to see learning materials,
                    quizzes, and presentations.
                  </p>
                  <Button
                    onClick={() => generateWeekContent(selectedWeek)}
                    disabled={isGenerating || isLoadingWeek}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Content for Week {selectedWeek}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

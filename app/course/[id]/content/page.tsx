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
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Course {
  id: string;
  name: string;
  code: string;
  weeklyContent: Array<{
    week: number;
    topics: string;
    studyMaterials: string;
  }>;
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
    slides: number;
    topics: string[];
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
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState("mcqs");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${params.id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }
        const foundCourse = await response.json();
        setCourse(foundCourse);

        // Load all generated content after course is loaded
        if (foundCourse) {
          loadAllGeneratedContent();
        }
      } catch (error) {
        const e = error as Error;
        console.error("Error fetching course:", error);
        setError(e.message);
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
      const contentByWeek = data.content.reduce(
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
      videos: apiContent.videoSuggestions || [],
      presentation: {
        title:
          apiContent.presentation?.title ||
          `Week ${apiContent.week} Presentation`,
        slides: apiContent.presentation?.totalSlides || 20,
        topics: apiContent.presentation?.learningObjectives || [],
      },
    };
  };

  // Handle week selection
  const handleWeekSelect = async (week: number) => {
    setSelectedWeek(week);
    await loadWeekContent(week);
  };

  const generateAIContent = async () => {
    if (!course) return;

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
          console.error(`Failed to generate content for week ${weekData.week}`);
          return null;
        }

        return response.json();
      });

      // Wait for all weeks to be generated
      const results = await Promise.allSettled(generatePromises);

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to generate content for week ${index + 1}:`,
            result.reason
          );
        }
      });

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

      if (!response.ok)
        throw new Error(`Failed to generate content for week ${week}`);

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

  if (!course) {
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

  const currentWeekContent = generatedContent[selectedWeek];
  const hasAnyContent = Object.keys(generatedContent).length > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/course/${course.id}`}>
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
                  presentations for all {course.weeklyContent.length} weeks of
                  your course.
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
                    {course.weeklyContent.length}
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
                  {course.weeklyContent.map((week) => (
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

                  {currentWeekContent.mcqs.length === 0 ? (
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
                              {mcq.options.map((option, optIndex) => (
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

                  {currentWeekContent.quiz.length === 0 ? (
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

                  {currentWeekContent.videos.length === 0 ? (
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

                            {video.topics && (
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
                                Search on YouTube
                              </Button>
                              {video.searchQuery && (
                                <p className="text-xs text-gray-500 text-center">
                                  Search: &quot{video.searchQuery}&quot
                                </p>
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
                      PowerPoint Presentation - Week {selectedWeek}
                    </h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PPT
                    </Button>
                  </div>

                  {!currentWeekContent.presentation.topics ||
                  currentWeekContent.presentation.topics.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                      <CardContent>
                        <Presentation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No Presentation Available
                        </h4>
                        <p className="text-gray-500 mb-4">
                          No presentation has been generated for week{" "}
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Presentation className="h-5 w-5 mr-2" />
                          {currentWeekContent.presentation.title}
                        </CardTitle>
                        <CardDescription>
                          {currentWeekContent.presentation.slides} slides
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              Topics Covered:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {currentWeekContent.presentation.topics.map(
                                (topic, index) => (
                                  <Badge key={index} variant="secondary">
                                    {topic}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>

                          <div className="aspect-video rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                            <div className="text-center">
                              <Presentation className="h-16 w-16 mx-auto mb-2 text-blue-500" />
                              <p className="font-medium">PowerPoint Preview</p>
                              <p className="text-sm text-gray-600">
                                {currentWeekContent.presentation.slides} slides
                                ready for download
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                    Content for week {selectedWeek} hasn&apos;t been generated
                    yet. Click below to create AI-generated learning materials.
                  </p>
                  <Button
                    onClick={() => generateWeekContent(selectedWeek)}
                    disabled={isGenerating || isLoadingWeek}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGenerating || isLoadingWeek ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Content for Week {selectedWeek}
                      </>
                    )}
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

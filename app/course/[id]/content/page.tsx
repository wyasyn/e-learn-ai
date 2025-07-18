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
  }>;
  quiz: Array<{
    question: string;
    type: "short" | "essay";
    points: number;
  }>;
  videos: Array<{
    title: string;
    url: string;
    duration: string;
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
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);

  useEffect(() => {
    const courses = JSON.parse(localStorage.getItem("courses") || "[]");
    const foundCourse = courses.find((c: Course) => c.id === params.id);
    setCourse(foundCourse);

    // Load existing generated content
    const savedContent = localStorage.getItem(`content_${params.id}`);
    if (savedContent) {
      setGeneratedContent(JSON.parse(savedContent));
    }
  }, [params.id]);

  const generateAIContent = async () => {
    if (!course) return;

    setIsGenerating(true);

    try {
      // Simulate AI content generation
      const newContent: GeneratedContent[] = course.weeklyContent.map(
        (week) => ({
          week: week.week,
          mcqs: [
            {
              question: `What is the main concept covered in week ${week.week}?`,
              options: [
                "Basic fundamentals",
                "Advanced concepts",
                "Practical applications",
                "Theoretical frameworks",
              ],
              correct: 0,
            },
            {
              question: `Which of the following best describes the learning objective for week ${week.week}?`,
              options: [
                "Understanding core principles",
                "Memorizing definitions",
                "Completing assignments",
                "Taking notes",
              ],
              correct: 0,
            },
          ],
          quiz: [
            {
              question: `Explain the key concepts discussed in week ${week.week}.`,
              type: "short" as const,
              points: 10,
            },
            {
              question: `Analyze and discuss the practical applications of the topics covered in week ${week.week}.`,
              type: "essay" as const,
              points: 25,
            },
          ],
          videos: [
            {
              title: `Week ${week.week}: Introduction to Core Concepts`,
              url: "https://youtube.com/watch?v=example1",
              duration: "15:30",
            },
            {
              title: `Week ${week.week}: Practical Examples and Applications`,
              url: "https://youtube.com/watch?v=example2",
              duration: "22:45",
            },
          ],
          presentation: {
            title: `Week ${week.week}: ${
              week.topics.split(",")[0] || "Course Content"
            }`,
            slides: 25,
            topics: week.topics
              .split(",")
              .map((t) => t.trim())
              .slice(0, 5),
          },
        })
      );

      setGeneratedContent(newContent);
      localStorage.setItem(`content_${params.id}`, JSON.stringify(newContent));
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentWeekContent = generatedContent.find(
    (c) => c.week === selectedWeek
  );

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className=" shadow-sm border-b">
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
                <h1 className="text-xl font-semibold ">AI Generated Content</h1>
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
        {generatedContent.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16  mx-auto mb-4" />
              <h3 className="text-xl font-semibold  mb-2">
                No AI Content Generated Yet
              </h3>
              <p className=" mb-6 max-w-md mx-auto">
                Click the &quot;Generate AI Content&quot; button to create
                comprehensive learning materials including quizzes, videos,
                presentations, and more for all {course.weeklyContent.length}{" "}
                weeks.
              </p>
              <Button
                onClick={generateAIContent}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                      onClick={() => setSelectedWeek(week.week)}
                    >
                      Week {week.week}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            {currentWeekContent && (
              <Tabs defaultValue="mcqs" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="mcqs">Multiple Choice</TabsTrigger>
                  <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="presentations">Presentations</TabsTrigger>
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

                  <div className="space-y-4">
                    {currentWeekContent.mcqs.map((mcq, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Question {index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium mb-3">{mcq.question}</p>
                          <div className="space-y-2">
                            {mcq.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-2 rounded border ${
                                  optIndex === mcq.correct
                                    ? "bg-green-50 border-green-200"
                                    : "bg-gray-50 border-gray-200"
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
                        <CardContent>
                          <p className="">{question.question}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentWeekContent.videos.map((video, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center">
                            <Video className="h-4 w-4 mr-2" />
                            {video.title}
                          </CardTitle>
                          <CardDescription>
                            Duration: {video.duration}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className=" aspect-video rounded-lg flex items-center justify-center mb-3">
                            <Video className="h-12 w-12 " />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                          >
                            View on YouTube
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
                          <h4 className="font-medium mb-2">Topics Covered:</h4>
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

                        <div className=" aspect-video rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Presentation className="h-16 w-16  mx-auto mb-2" />
                            <p className="">PowerPoint Preview</p>
                            <p className="text-sm ">
                              {currentWeekContent.presentation.slides} slides
                              ready for download
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

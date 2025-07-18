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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  Target,
  CheckCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Course {
  id: string;
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

export default function CourseDetails() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const courses = JSON.parse(localStorage.getItem("courses") || "[]");
    const foundCourse = courses.find((c: Course) => c.id === params.id);
    setCourse(foundCourse);
  }, [params.id]);

  if (!course) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold  mb-2">Course not found</h2>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className=" shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold ">{course.name}</h1>
                <p className="text-sm ">{course.code}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={course.status === "active" ? "default" : "secondary"}
              >
                {course.status}
              </Badge>
              <Link href={`/course/${course.id}/content`}>
                <Button>Manage Content</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium ">Students</p>
                  <p className="text-2xl font-bold ">{course.students}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium ">Credits</p>
                  <p className="text-2xl font-bold ">{course.credits}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium ">Weeks</p>
                  <p className="text-2xl font-bold ">
                    {course.weeklyContent.length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium ">Materials</p>
                  <p className="text-2xl font-bold ">
                    {course.uploadedFiles.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Details Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium  mb-2">Description</h4>
                    <p className="">{course.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Level:</span> {course.level}
                    </div>
                    <div>
                      <span className="font-medium">Semester:</span>{" "}
                      {course.semester}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Course Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="">{course.objectives}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Learning Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="">{course.learningOutcomes}</p>
              </CardContent>
            </Card>

            {course.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Prerequisites & Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="">{course.requirements}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Curriculum</CardTitle>
                <CardDescription>
                  Detailed breakdown of topics and materials for each week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {course.weeklyContent.map((week, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4"
                    >
                      <h4 className="font-semibold text-lg mb-2">
                        Week {week.week}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium  mb-1">Topics</h5>
                          <p className="">{week.topics}</p>
                        </div>
                        {week.studyMaterials && (
                          <div>
                            <h5 className="font-medium  mb-1">
                              Study Materials
                            </h5>
                            <p className="">{week.studyMaterials}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Methods</CardTitle>
                <CardDescription>
                  How students will be evaluated in this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="">{course.assessmentMode}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Materials</CardTitle>
                <CardDescription>
                  Files and resources uploaded for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                {course.uploadedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {course.uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3  rounded-lg"
                      >
                        <FileText className="h-5 w-5  mr-3" />
                        <span className="">{file}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className=" text-center py-8">No materials uploaded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

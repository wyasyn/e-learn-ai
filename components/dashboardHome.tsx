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
import { Plus, BookOpen, Users, Brain, University } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./mode-toogle";
import Logout from "./logoutBtn";
import UserAvatar from "./user-avatar";
import { authClient } from "@/lib/auth-client";
import { WeeklyContent } from "@/models/Course";

// Frontend-compatible Course type with string _id
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
  weeklyContent: WeeklyContent;
  uploadedFiles: string[];
  students: number;
  status: "active" | "draft";
  createdAt: Date;
  updatedAt: Date;
  instructorId: string;
}

export default function DashboardHome() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const session = authClient.useSession();

  // Get user data from session
  const user = session.data?.user;

  useEffect(() => {
    // Redirect if not authenticated
    if (session.data === null) {
      router.push("/");
      return;
    }

    // Load courses from database when user is available
    if (user?.id) {
      loadCourses();
    }
  }, [session.data, user?.id, router]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/courses", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourses(data.courses);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while session or courses are loading
  if (session.isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="shadow-sm bg-secondary/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <University className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold sr-only">EduPlatform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserAvatar />
              <span className="text-sm">Welcome, {user.name}</span>
              <Logout />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCourses}
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Courses</p>
                  <p className="text-3xl font-bold">{courses.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active Courses</p>
                  <p className="text-3xl font-bold">
                    {courses.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold">
                    {courses.reduce((sum, course) => sum + course.students, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">AI Generated</p>
                  <p className="text-3xl font-bold">{courses.length * 12}</p>
                  <p className="text-xs">Content items</p>
                </div>
                <Brain className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Courses</h2>
          <Link href="/create-course">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No courses yet</h3>
              <p className="mb-4">
                Create your first course to get started with AI-powered content
                generation
              </p>
              <Link href="/create-course">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <CardDescription>{course.code}</CardDescription>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        course.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>Level: {course.level}</p>
                    <p>Semester: {course.semester}</p>
                    <p>Credits: {course.credits}</p>
                    <p>Students: {course.students}</p>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Link href={`/course/${course._id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                      >
                        View Course
                      </Button>
                    </Link>
                    <Link
                      href={`/course/${course._id}/content`}
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full">
                        Manage Content
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

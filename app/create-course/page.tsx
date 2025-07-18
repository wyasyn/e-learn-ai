"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WeeklyContent {
  week: number;
  topics: string;
  studyMaterials: string;
}

export default function CreateCourse() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    level: "",
    semester: "",
    credits: "",
    description: "",
    objectives: "",
    learningOutcomes: "",
    requirements: "",
    assessmentMode: "",
  });

  const [weeklyContent, setWeeklyContent] = useState<WeeklyContent[]>([
    { week: 1, topics: "", studyMaterials: "" },
  ]);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addWeek = () => {
    setWeeklyContent((prev) => [
      ...prev,
      { week: prev.length + 1, topics: "", studyMaterials: "" },
    ]);
  };

  const removeWeek = (index: number) => {
    if (weeklyContent.length > 1) {
      setWeeklyContent((prev) =>
        prev
          .filter((_, i) => i !== index)
          .map((week, i) => ({ ...week, week: i + 1 }))
      );
    }
  };

  const updateWeeklyContent = (
    index: number,
    field: keyof WeeklyContent,
    value: string | number
  ) => {
    setWeeklyContent((prev) =>
      prev.map((week, i) => (i === index ? { ...week, [field]: value } : week))
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (
        !formData.name ||
        !formData.code ||
        !formData.level ||
        !formData.semester
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (weeklyContent.some((week) => !week.topics.trim())) {
        toast.error("Please provide topics for all weeks");
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add course data
      const courseData = {
        ...formData,
        credits: parseInt(formData.credits),
        weeklyContent,
        status: "draft",
        students: 0,
      };

      formDataToSend.append("courseData", JSON.stringify(courseData));

      // Add files
      uploadedFiles.forEach((file) => {
        formDataToSend.append("files", file);
      });

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "user-id": "default-instructor", // Replace with actual user ID from auth
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create course");
      }

      const result = await response.json();

      toast.success("Course created successfully!");
      router.push(`/course/${result.course._id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create course. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className="  border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold ">Create New Course</h1>
          <p className=" mt-2">
            Set up your course details and let AI generate comprehensive
            learning materials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the fundamental details about your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Introduction to Computer Science"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., CS101"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    onValueChange={(value) => handleInputChange("level", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year-1">Year 1</SelectItem>
                      <SelectItem value="year-2">Year 2</SelectItem>
                      <SelectItem value="year-3">Year 3</SelectItem>
                      <SelectItem value="year-4">Year 4</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange("semester", value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semester-1">Semester 1</SelectItem>
                      <SelectItem value="semester-2">Semester 2</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">Credit Units *</Label>
                  <Input
                    id="credits"
                    type="number"
                    placeholder="3"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) =>
                      handleInputChange("credits", e.target.value)
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>
                Provide detailed information about the course content and
                structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Brief Course Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief overview of what this course covers..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectives">Course Objectives *</Label>
                <Textarea
                  id="objectives"
                  placeholder="List the main objectives students will achieve..."
                  value={formData.objectives}
                  onChange={(e) =>
                    handleInputChange("objectives", e.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learningOutcomes">Learning Outcomes *</Label>
                <Textarea
                  id="learningOutcomes"
                  placeholder="Describe what students will be able to do after completing this course..."
                  value={formData.learningOutcomes}
                  onChange={(e) =>
                    handleInputChange("learningOutcomes", e.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Prerequisites/Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="List any prerequisites or requirements for this course..."
                  value={formData.requirements}
                  onChange={(e) =>
                    handleInputChange("requirements", e.target.value)
                  }
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessmentMode">Mode of Assessment *</Label>
                <Textarea
                  id="assessmentMode"
                  placeholder="Describe how students will be assessed (exams, assignments, projects, etc.)..."
                  value={formData.assessmentMode}
                  onChange={(e) =>
                    handleInputChange("assessmentMode", e.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Content */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Content Plan</CardTitle>
              <CardDescription>
                Define what will be taught each week and study materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyContent.map((week, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Week {week.week}</h4>
                    {weeklyContent.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWeek(index)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Topics to Cover *</Label>
                    <Textarea
                      placeholder="List the main topics and concepts for this week..."
                      value={week.topics}
                      onChange={(e) =>
                        updateWeeklyContent(index, "topics", e.target.value)
                      }
                      required
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Study Materials & Resources</Label>
                    <Textarea
                      placeholder="Specify readings, videos, or other materials students should review..."
                      value={week.studyMaterials}
                      onChange={(e) =>
                        updateWeeklyContent(
                          index,
                          "studyMaterials",
                          e.target.value
                        )
                      }
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addWeek}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Week
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Sample Materials</CardTitle>
              <CardDescription>
                Upload any existing PowerPoints, quizzes, or other materials to
                help AI generate better content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed  rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 " />
                <p className="text-sm  mb-2">
                  Upload PowerPoint presentations, PDFs, quizzes, or other
                  course materials
                </p>
                <input
                  aria-label="file upload"
                  type="file"
                  multiple
                  accept=".ppt,.pptx,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isSubmitting}
                />

                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={isSubmitting}
                >
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </Label>
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Uploaded Files:</h4>
                  <ul className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="text-sm  flex items-center justify-between p-2  rounded"
                      >
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {file.name}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Course...
                </>
              ) : (
                "Create Course & Generate AI Content"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

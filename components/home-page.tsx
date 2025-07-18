import type React from "react";

import { BookOpen, Users, Brain, FileText } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold ">
              AI-Powered University Learning Platform
            </h1>
            <p className="text-xl ">
              Create comprehensive courses with AI-generated content, quizzes,
              and study materials
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4  rounded-lg shadow-sm">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Course Creation</h3>
                <p className="text-sm ">Easy course setup</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4  rounded-lg shadow-sm">
              <Brain className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">AI Content</h3>
                <p className="text-sm ">Auto-generated materials</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4  rounded-lg shadow-sm">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Student Engagement</h3>
                <p className="text-sm ">Interactive learning</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4  rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-semibold">Assessment Tools</h3>
                <p className="text-sm ">Quizzes & tests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

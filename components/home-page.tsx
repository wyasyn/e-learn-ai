import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  FileText,
  Video,
  Users,
  CheckCircle,
  University,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <University className="h-8 w-8" />
            <span className="text-xl font-bold">EduContent AI</span>
          </div>
          <Button asChild>
            <Link href={"/signin"}>Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Generate Educational Content with AI
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create comprehensive course materials, quizzes, presentations, and
          video suggestions powered by advanced AI technology designed for
          educators.
        </p>
        <Button size="lg" asChild className="text-lg px-8 py-3">
          <Link href={"/dashboard"}>Get Started</Link>
        </Button>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need for Course Content
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 mb-2" />
              <CardTitle>Smart MCQs</CardTitle>
              <CardDescription>
                Generate multiple choice questions with detailed explanations
                and varied difficulty levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 mb-2" />
              <CardTitle>Quiz Questions</CardTitle>
              <CardDescription>
                Create comprehensive assessments with rubrics and scoring
                criteria
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Video className="h-8 w-8 mb-2" />
              <CardTitle>Video Suggestions</CardTitle>
              <CardDescription>
                Get curated video recommendations with search queries and
                duration estimates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 mb-2" />
              <CardTitle>Presentations</CardTitle>
              <CardDescription>
                Generate complete PowerPoint presentations with structured
                slides and objectives
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Built for Educators, by Educators
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Pedagogically Sound</h3>
                    <p className="text-muted-foreground">
                      Based on proven educational principles and Bloom&apos;s
                      Taxonomy
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Time-Saving</h3>
                    <p className="text-muted-foreground">
                      Generate weeks of content in minutes, not hours
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Customizable</h3>
                    <p className="text-muted-foreground">
                      Tailored to your course level, objectives, and
                      requirements
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Quality Assured</h3>
                    <p className="text-muted-foreground">
                      Content reviewed by educational experts and AI systems
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Ready to Transform Your Teaching?</CardTitle>
                <CardDescription>
                  Join educators worldwide who are saving time and creating
                  better content with AI assistance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Start Creating Content</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">EduContent AI</span>
          </div>
          <p className="text-sm">
            Empowering educators with AI-generated content that enhances
            learning experiences.
          </p>
        </div>
      </footer>
    </div>
  );
}

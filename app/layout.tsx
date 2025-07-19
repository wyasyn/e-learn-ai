import type { Metadata } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Syllabus AI",
  description:
    "Upload your course, select a week, and let AI create high-quality educational materials aligned with your curriculum.",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://syllabusai.vercel.app",
    description:
      "Upload your course, select a week, and let AI create high-quality educational materials aligned with your curriculum.",
    siteName: "Syllabus AI",
    images: [
      {
        url: "https://www.acadecraft.com/blog/uploads/blog/2023/11/Content_for_Teachingwebp.webp",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={` antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

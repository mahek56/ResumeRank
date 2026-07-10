import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeRank — AI-Powered Resume Ranking",
  description:
    "Upload resumes and a job description, get ranked explainable match scores so recruiters can shortlist faster. Deterministic, transparent, no black-box AI.",
  keywords: [
    "resume ranking",
    "ATS",
    "candidate scoring",
    "recruitment tool",
    "AI hiring",
  ],
  openGraph: {
    title: "ResumeRank — AI-Powered Resume Ranking",
    description:
      "Upload resumes and a job description, get ranked explainable match scores so recruiters can shortlist faster.",
    type: "website",
    locale: "en_US",
    siteName: "ResumeRank",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeRank — AI-Powered Resume Ranking",
    description:
      "Upload resumes and a job description, get ranked explainable match scores so recruiters can shortlist faster.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import React from "react";

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}

export const metadata = {
  title: "About - Am I an AI?",
  description: "Learn about our AI text detection system and how it works.",
};

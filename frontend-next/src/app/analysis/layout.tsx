export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="container mx-auto px-4 py-8">{children}</section>;
}

export const metadata = {
  title: "Text Analysis - Am I an AI?",
  description: "Analyze text to determine if it was written by a human or AI.",
};

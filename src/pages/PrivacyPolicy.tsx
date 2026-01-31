import { Brain, Shield, Database, Eye, Lock, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <section className="pt-32 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            How we collect, use, and protect your information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last Updated: January 2026
          </p>
        </div>
      </section>

      {/* Policy Sections */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto grid gap-8">

          <PolicyCard
            icon={Database}
            title="Information We Collect"
            content={[
              "Email address for authentication.",
              "Questions and answers you submit for analysis.",
              "Generated explanations and reasoning scores.",
              "Basic usage data required to maintain performance."
            ]}
          />

          <PolicyCard
            icon={Brain}
            title="How We Use Your Information"
            content={[
              "To generate AI-powered reasoning evaluations.",
              "To store and display your explanation history.",
              "To improve the platform’s accuracy and usability.",
              "To maintain security and prevent misuse."
            ]}
          />

          <PolicyCard
            icon={Eye}
            title="AI Processing"
            content={[
              "User-submitted content is processed using the Google Gemini API.",
              "We do not sell or share your personal data for advertising purposes.",
              "AI processing is used strictly to generate structured reasoning analysis."
            ]}
          />

          <PolicyCard
            icon={Lock}
            title="Data Storage & Security"
            content={[
              "Authentication and database services are powered by Supabase.",
              "We implement technical safeguards to protect your information.",
              "While we follow best practices, no system guarantees absolute security."
            ]}
          />

          <PolicyCard
            icon={Shield}
            title="Public Explanations"
            content={[
              "You may choose to make explanations public.",
              "Public explanations are accessible via shareable links.",
              "Avoid including sensitive personal data in public content."
            ]}
          />

          <PolicyCard
            icon={Mail}
            title="Contact & Data Requests"
            content={[
              "You may request access, correction, or deletion of your data.",
              "For privacy-related inquiries, contact:",
              "support@explainmydecision.com"
            ]}
          />

        </div>
      </section>

      {/* Footer Note */}
      <section className="py-12 px-4 border-t border-border/40 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-muted-foreground">
            © 2026 Explain My Decision. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

interface PolicyCardProps {
  icon: React.ElementType;
  title: string;
  content: string[];
}

const PolicyCard = ({ icon: Icon, title, content }: PolicyCardProps) => {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-6">
        <Icon className="h-8 w-8 text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <ul className="space-y-3 text-muted-foreground">
          {content.map((item, index) => (
            <li key={index} className="flex gap-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PrivacyPolicy;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  Shield,
  Users,
  BookOpen,
  MessageCircle,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-mental-health.jpg";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleDemoRequest = () => {
    // TODO: Implement demo request functionality
    console.log("Demo requested for:", email);
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary animate-gentle-bounce" />
            <span className="text-2xl font-bold text-foreground">
              MindCare
            </span>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/student-login")}
              className="hover:bg-primary/10"
            >
              Student Portal
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/teacher-portal")}
              className="hover:bg-primary/10"
            >
              Teacher Portal
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/admin-dashboard")}
              className="hover:bg-primary/10"
            >
              Admin Portal
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-5xl font-bold text-foreground leading-tight">
                Supporting Student
                <span className="text-primary block">Mental Wellness</span>
                in Schools
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                An innovative platform that helps schools monitor and support
                student mental health through AI-powered essay analysis and
                thoughtful wellness check-ins.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" className="animate-pulse-glow">
                  Request Demo
                </Button>
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative animate-float">
              <img
                src={heroImage}
                alt="Mental Health Support"
                className="rounded-3xl shadow-card w-full h-auto"
              />
              <div className="absolute -top-4 -right-4 bg-wellness p-4 rounded-2xl shadow-soft animate-gentle-bounce">
                <MessageCircle className="w-8 h-8 text-wellness-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Comprehensive Mental Health Support
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform combines cutting-edge AI technology with
              compassionate care to create a safe space for students to express
              themselves and get the support they need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl text-foreground">
                  Essay Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-lg">
                  AI-powered analysis of student essays to identify emotional
                  patterns and potential concerns.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-wellness rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-wellness-foreground" />
                </div>
                <CardTitle className="text-2xl text-foreground">
                  AI Chatbot Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-lg">
                  24/7 AI companion trained in mental health support to provide
                  immediate assistance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-calm rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-calm-foreground" />
                </div>
                <CardTitle className="text-2xl text-foreground">
                  Wellness Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-lg">
                  Regular wellness surveys to track student mental health trends
                  and identify support needs.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-foreground">
                About MindCare
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe every student deserves to feel supported,
                understood, and mentally healthy. Our team of mental health
                professionals, educators, and technology experts have created a
                platform that bridges the gap between students and the care they
                need.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                By combining innovative AI technology with proven mental health
                practices, we're making mental wellness support accessible,
                non-intrusive, and effective for schools worldwide.
              </p>
              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10K+</div>
                  <div className="text-muted-foreground">
                    Students Supported
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-muted-foreground">Schools Partner</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-muted-foreground">Support Available</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-wellness p-8 rounded-3xl shadow-card">
              <div className="text-center space-y-6">
                <Users className="w-16 h-16 text-wellness-foreground mx-auto" />
                <h3 className="text-2xl font-bold text-wellness-foreground">
                  Our Mission
                </h3>
                <p className="text-wellness-foreground/80 leading-relaxed">
                  To create a world where every student has access to mental
                  health support, where emotional wellness is prioritized, and
                  where technology serves humanity's most essential needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Demo Section */}
      <section className="py-20 px-6 bg-gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Student Wellness?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto">
            Join hundreds of schools already using MindCare to support their
            students' mental health. Schedule a demo to see how our platform
            can benefit your school community.
          </p>

          <Card className="max-w-md mx-auto bg-card/95 backdrop-blur-sm border-0 shadow-glow">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                Request a Demo
              </CardTitle>
              <CardDescription>
                Get a personalized walkthrough of our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="Your school email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-0 bg-muted focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleDemoRequest}
                className="w-full"
                variant="wellness"
                size="lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Demo
              </Button>
              <div className="flex items-center justify-center space-x-4 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  hello@mindcare.edu
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  (555) 123-4567
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold text-foreground">
                  MindCare
                </span>
              </div>
              <p className="text-muted-foreground">
                Supporting student mental wellness through innovative technology
                and compassionate care.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Student Portal</li>
                <li>Teacher Dashboard</li>
                <li>Essay Analysis</li>
                <li>Wellness Surveys</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Training Resources</li>
                <li>Contact Support</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>HIPAA Compliance</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>
              &copy; 2024 MindCare. All rights reserved. Made with ❤️ for
              student wellness.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
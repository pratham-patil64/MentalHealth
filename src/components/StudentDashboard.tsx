import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  MessageCircle, 
  Brain, 
  Upload, 
  History, 
  Heart,
  User,
  LogOut,
  Calendar,
  TrendingUp
} from "lucide-react";

const StudentDashboard = () => {
  const [responses, setResponses] = useState({
    mood: "",
    challenges: "",
    happiness: "",
    sleep: "",
    thoughts: ""
  });
  const navigate = useNavigate(); // Add this line

  const questions = [
    {
      id: "mood",
      question: "How would you describe your overall mood this week?",
      placeholder: "Share how you've been feeling overall..."
    },
    {
      id: "challenges", 
      question: "What was the most challenging part of your week?",
      placeholder: "Tell us about any difficulties you faced..."
    },
    {
      id: "happiness",
      question: "Did anything make you feel especially happy or relaxed?",
      placeholder: "Share moments that brought you joy..."
    },
    {
      id: "sleep",
      question: "How did your sleep and energy levels feel throughout the week?",
      placeholder: "Describe your rest and energy patterns..."
    },
    {
      id: "thoughts",
      question: "Is there anything that's been on your mind a lot lately?",
      placeholder: "Share what's been occupying your thoughts..."
    }
  ];

  const previousEssays = [
    { id: 1, title: "My Summer Vacation", date: "2024-01-15", status: "Analyzed", mood: "positive" },
    { id: 2, title: "Climate Change Essay", date: "2024-01-10", status: "Analyzed", mood: "concerned" },
    { id: 3, title: "Future Goals", date: "2024-01-05", status: "Processing", mood: "hopeful" }
  ];

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const completedQuestions = Object.values(responses).filter(response => response.trim()).length;
  const progressPercentage = (completedQuestions / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Heart className="w-8 h-8 text-primary animate-gentle-bounce" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome back, Alex!</h1>
              <p className="text-muted-foreground">How are you feeling today?</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                // Optionally clear auth state here
                navigate("/student-login");
              }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-gradient-wellness cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-wellness-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-wellness-foreground">Scan New Essay</CardTitle>
                  <CardDescription className="text-wellness-foreground/80">
                    Upload your latest essay for AI analysis and insights
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-gradient-calm cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-8 h-8 text-calm-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-calm-foreground">Chat with AI</CardTitle>
                  <CardDescription className="text-calm-foreground/80">
                    Talk to our mental health support AI anytime
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Weekly Check-in */}
            <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-foreground flex items-center">
                      <Calendar className="w-6 h-6 mr-2 text-primary" />
                      Weekly Wellness Check-in
                    </CardTitle>
                    <CardDescription>
                      Take a moment to reflect on your week. Your responses help us support you better.
                    </CardDescription>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{completedQuestions}/5</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
                <Progress value={progressPercentage} className="mt-4" />
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((q, index) => (
                  <div key={q.id} className="space-y-3 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <label className="text-sm font-medium text-foreground block">
                      {q.question}
                    </label>
                    <Textarea
                      placeholder={q.placeholder}
                      value={responses[q.id as keyof typeof responses]}
                      onChange={(e) => handleResponseChange(q.id, e.target.value)}
                      className="min-h-[100px] rounded-xl border-0 bg-muted focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                ))}
                <Button className="w-full mt-6" size="lg" variant="wellness">
                  <Heart className="w-5 h-5 mr-2" />
                  Submit Check-in
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wellness Score */}
            <Card className="border-0 shadow-card bg-gradient-primary">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-primary-foreground">Your Wellness Score</CardTitle>
                <div className="text-4xl font-bold text-primary-foreground mt-4">85</div>
                <CardDescription className="text-primary-foreground/80">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  +5 from last week
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Previous Essays */}
            <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center">
                  <History className="w-5 h-5 mr-2 text-primary" />
                  Previous Essays
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previousEssays.map((essay) => (
                  <div 
                    key={essay.id} 
                    className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {essay.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{essay.date}</p>
                        <div className="flex items-center mt-2">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            essay.mood === 'positive' ? 'bg-green-500' :
                            essay.mood === 'concerned' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-xs text-muted-foreground capitalize">{essay.mood}</span>
                        </div>
                      </div>
                      <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-primary hover:bg-primary/10">
                  View All Essays
                </Button>
              </CardContent>
            </Card>

            {/* AI Chat Quick Access */}
            <Card className="border-0 shadow-card bg-gradient-calm">
              <CardHeader className="text-center">
                <Brain className="w-12 h-12 text-calm-foreground mx-auto mb-4 animate-float" />
                <CardTitle className="text-xl text-calm-foreground">Need Someone to Talk To?</CardTitle>
                <CardDescription className="text-calm-foreground/80">
                  Our AI companion is here 24/7 to listen and support you
                </CardDescription>
                <Button variant="secondary" className="mt-4 bg-white/20 text-calm-foreground hover:bg-white/30">
                  Start Conversation
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TeacherLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Test credentials for demo
    if (email === "teacher@school.edu" && password === "teacher123") {
      navigate("/teacher-dashboard");
    } else {
      alert("Test credentials: teacher@school.edu / teacher123");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-8 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <Card className="border-0 shadow-glow bg-card/80 backdrop-blur-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-calm rounded-2xl flex items-center justify-center animate-gentle-bounce">
              <Shield className="w-8 h-8 text-calm-foreground" />
            </div>
            <CardTitle className="text-3xl text-foreground">Teacher Portal</CardTitle>
            <CardDescription className="text-lg">
              Access your classroom mental health insights and student support tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">School Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="teacher@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl border-0 bg-muted h-12 focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-xl border-0 bg-muted h-12 focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="secondary" className="w-full" size="lg">
                Access Teacher Dashboard
              </Button>
              
              <div className="text-center space-y-4">
                <Button variant="link" className="text-primary">
                  Forgot your password?
                </Button>
                <p className="text-sm text-muted-foreground">
                  Contact administration for account support
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Protected by FERPA and HIPAA compliance. Student data is secure and confidential.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
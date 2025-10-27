import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Mail, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface StudentLoginProps {
  onGoogleLoginSuccess: (token: string) => void;
}

const StudentLogin = ({ onGoogleLoginSuccess }: StudentLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let the onAuthStateChanged listener in App.tsx handle navigation
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    // Add scopes for Fit and Classroom APIs
    provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.heart_rate.read');
    provider.addScope('https://www.googleapis.com/auth/fitness.body.read');
    provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get the OAuth access token from the result
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        // Pass the token up to App.tsx
        onGoogleLoginSuccess(accessToken);

        // Check if user exists in Firestore, if not, create them (Sign-Up)
        const userDocRef = doc(db, "students", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            profilePicUrl: user.photoURL,
            mentalHealthStatus: "neutral",
            reportsCount: 0,
            needsHelp: false,
            lastEssayDate: "",
          });
        }
        // Navigation will be handled by onAuthStateChanged in App.tsx
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      alert(`Google Sign-In Failed: ${error.message}`);
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
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center animate-gentle-bounce">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl text-foreground">Student Portal</CardTitle>
            <CardDescription className="text-lg">
              Sign in to access your wellness dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
                Sign in with Google
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your.email@school.edu"
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

              <Button type="submit" className="w-full" size="lg">
                Sign In 
              </Button>
              
              <div className="mt-4 text-center text-sm">
                <Button variant="link" onClick={() => navigate("/student-register")}>
                  Don't have an account? Sign up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentLogin;
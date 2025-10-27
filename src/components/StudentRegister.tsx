import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StudentRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, "students", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        name,
        gender,
        mentalHealthStatus: "neutral",
        reportsCount: 0,
        needsHelp: false,
        lastEssayDate: "",
      });
      
      navigate("/student-dashboard");
    } catch (error: any) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-glow bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-center">Student Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleRegister}>
              <Input
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Select onValueChange={setGender} required>
                  <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
              </Select>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate("/student-login")}>
                Already have an account? Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentRegister;
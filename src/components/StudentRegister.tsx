import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StudentRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [division, setDivision] = useState("");
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
        class: studentClass,
        division,
        gender,
        mentalHealthStatus: "neutral",
        reportsCount: 0,
        needsHelp: false,
        lastEssayDate: "",
        essays: [],
      });
    //   alert("Registration successful!");
    //   navigate("/student-dashboard");
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
              <Input
                placeholder="Class (e.g., 10, 11, 12)"
                value={studentClass}
                onChange={e => setStudentClass(e.target.value)}
                required
              />
              <Input
                placeholder="Division (e.g., A, B, C)"
                value={division}
                onChange={e => setDivision(e.target.value)}
                required
              />
              <select
                className="w-full p-2 border rounded"
                value={gender}
                onChange={e => setGender(e.target.value)}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
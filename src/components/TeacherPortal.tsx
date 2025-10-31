import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, LogOut, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Student } from "./StudentDashboard";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Define the Assignment interface
interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  completedBy: string[]; // Array of student UIDs
}

// Define the Test interface
interface Test {
  id: string;
  title: string;
  maxScore: number; // Add maxScore to the Test interface
  scores: Record<string, number>; // Map of student UID to score
}

const TeacherPortal = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] =
    useState(false);
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");
  const [newTestTitle, setNewTestTitle] = useState("");
  const [newTestMaxScore, setNewTestMaxScore] = useState(""); // Add state for the new max score
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [assignmentCompletion, setAssignmentCompletion] = useState<
    Record<string, boolean>
  >({});
  const [studentScores, setStudentScores] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  // Helper function to update a student's stress score
  const updateStudentStressScore = async (
    studentId: string,
    adjustment: number
  ) => {
    const studentDocRef = doc(db, "students", studentId);
    try {
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as Student;
        const currentStress = studentData.stressScore ?? 50; // Default to 50 if not set
        let newStress = currentStress + adjustment;

        // Clamp the score between 0 and 100
        newStress = Math.max(0, Math.min(100, newStress));

        await updateDoc(studentDocRef, {
          stressScore: newStress,
        });
      }
    } catch (error) {
      console.error("Error updating stress score for student:", studentId, error);
    }
  };

  useEffect(() => {
    const studentsQuery = collection(db, "students");
    const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentData = querySnapshot.docs.map(
        (doc) => ({ ...doc.data(), uid: doc.id } as Student)
      );
      setStudents(studentData);
    });

    const assignmentsQuery = collection(db, "assignments");
    const unsubscribeAssignments = onSnapshot(
      assignmentsQuery,
      (querySnapshot) => {
        const assignmentsData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Assignment)
        );
        setAssignments(assignmentsData);
      }
    );

    const testsQuery = collection(db, "tests");
    const unsubscribeTests = onSnapshot(testsQuery, (querySnapshot) => {
      const testsData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Test)
      );
      setTests(testsData);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAssignments();
      unsubscribeTests();
    };
  }, []);

  const handleAddAssignment = async () => {
    if (newAssignmentTitle.trim() === "" || newAssignmentDueDate.trim() === "") {
      alert("Please enter a title and due date.");
      return;
    }
    setLoading(true);
    try {
      const newAssignment = {
        title: newAssignmentTitle,
        dueDate: newAssignmentDueDate,
        completedBy: [],
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "assignments"), newAssignment);

      // Increase stress for all students for the new assignment
      for (const student of students) {
        await updateStudentStressScore(student.uid, 5); // Increase stress by 5
      }

      setNewAssignmentTitle("");
      setNewAssignmentDueDate("");
      setIsAddAssignmentModalOpen(false);
    } catch (error) {
      console.error("Error adding assignment: ", error);
      alert("Failed to add assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async () => {
    if (newTestTitle.trim() === "" || newTestMaxScore.trim() === "") {
      alert("Please enter a title and a max score.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "tests"), {
        title: newTestTitle,
        maxScore: parseFloat(newTestMaxScore), // Save the max score
        scores: {},
        createdAt: serverTimestamp(),
      });

      setNewTestTitle("");
      setNewTestMaxScore("");
      setIsAddTestModalOpen(false);
    } catch (error) {
      console.error("Error adding test: ", error);
      alert("Failed to add test. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentCompletionChange = (
    studentId: string,
    isChecked: boolean
  ) => {
    setAssignmentCompletion((prev) => ({ ...prev, [studentId]: isChecked }));
  };

  const handleScoreChange = (studentId: string, score: string) => {
    setStudentScores((prev) => ({ ...prev, [studentId]: score }));
  };

  const handleSaveAssignmentCompletion = async () => {
    if (!selectedAssignment) return;

    setLoading(true);
    try {
      const updatedCompletedBy = [
        ...selectedAssignment.completedBy,
        ...Object.entries(assignmentCompletion)
          .filter(([, completed]) => completed)
          .map(([studentId]) => studentId),
      ];

      const uniqueCompletedBy = [...new Set(updatedCompletedBy)];

      await updateDoc(doc(db, "assignments", selectedAssignment.id), {
        completedBy: uniqueCompletedBy,
      });

      // Adjust stress for newly completed assignments
      for (const studentId in assignmentCompletion) {
        if (assignmentCompletion[studentId]) {
          await updateStudentStressScore(studentId, -10); // Decrease stress more
        }
      }

      setSelectedAssignment(null);
      setAssignmentCompletion({});
    } catch (error) {
      console.error("Error updating assignment completion: ", error);
      alert("Failed to update assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestScores = async () => {
    if (!selectedTest) return;

    setLoading(true);
    try {
      const updatedScores: Record<string, number> = {
        ...selectedTest.scores,
      };
      for (const studentId in studentScores) {
        const score = parseFloat(studentScores[studentId]);
        if (!isNaN(score)) {
          updatedScores[studentId] = score;

          // Adjust stress based on score
          const percentage = (score / selectedTest.maxScore) * 100;
          if (percentage >= 85) {
            await updateStudentStressScore(studentId, -15); // High score, big stress relief
          } else if (percentage < 50) {
            await updateStudentStressScore(studentId, 20); // Low score, significant stress increase
          } else if (percentage < 70) {
            await updateStudentStressScore(studentId, 10); // Average score, slight stress increase
          }
        }
      }

      await updateDoc(doc(db, "tests", selectedTest.id), {
        scores: updatedScores,
      });

      setSelectedTest(null);
      setStudentScores({});
    } catch (error) {
      console.error("Error saving test scores: ", error);
      alert("Failed to save test scores. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageScore = (test: Test) => {
    const scores = Object.values(test.scores);
    if (scores.length === 0) return "N/A";
    const sum = scores.reduce((total, score) => total + score, 0);
    const average = (sum / scores.length).toFixed(2);
    return `${average} / ${test.maxScore}`; // Display average out of max score
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Teacher Portal
              </h1>
              <p className="text-muted-foreground">
                Manage your students and assignments
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={async () => {
              await signOut(auth);
              navigate("/teacher-login");
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Assignments Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>
                Create and track student assignments.
              </CardDescription>
            </div>
            <Dialog
              open={isAddAssignmentModalOpen}
              onOpenChange={setIsAddAssignmentModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Assignment Title"
                    value={newAssignmentTitle}
                    onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={newAssignmentDueDate}
                    onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddAssignment} disabled={loading}>
                    {loading ? "Saving..." : "Save Assignment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.title}
                      </TableCell>
                      <TableCell>{assignment.dueDate}</TableCell>
                      <TableCell>
                        {assignment.completedBy.length} / {students.length}
                      </TableCell>
                      <TableCell>
                        <Dialog
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedAssignment(null);
                              setAssignmentCompletion({});
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedAssignment(assignment)
                              }
                            >
                              Manage Submissions
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Submissions for: {assignment.title}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                              {students.map((student) => (
                                <div
                                  key={student.uid}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`${assignment.id}-${student.uid}`}
                                    checked={
                                      assignment.completedBy.includes(
                                        student.uid
                                      ) ||
                                      assignmentCompletion[student.uid]
                                    }
                                    disabled={assignment.completedBy.includes(
                                      student.uid
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleAssignmentCompletionChange(
                                        student.uid,
                                        !!checked
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`${assignment.id}-${student.uid}`}
                                  >
                                    {student.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleSaveAssignmentCompletion}
                                disabled={loading}
                              >
                                {loading ? "Saving..." : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Tests Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tests</CardTitle>
              <CardDescription>
                Create and track student test scores.
              </CardDescription>
            </div>
            <Dialog
              open={isAddTestModalOpen}
              onOpenChange={setIsAddTestModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Test
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Test</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Test Title"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max Score"
                    value={newTestMaxScore}
                    onChange={(e) => setNewTestMaxScore(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTest} disabled={loading}>
                    {loading ? "Saving..." : "Save Test"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">
                        {test.title}
                      </TableCell>
                      <TableCell>{calculateAverageScore(test)}</TableCell>
                      <TableCell>
                        <Dialog
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedTest(null);
                              setStudentScores({});
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTest(test)}
                            >
                              Manage Test
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Scores for: {test.title}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                              {students.map((student) => (
                                <div
                                  key={student.uid}
                                  className="flex items-center justify-between"
                                >
                                  <Label htmlFor={`${test.id}-${student.uid}`}>
                                    {student.name}
                                  </Label>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      id={`${test.id}-${student.uid}`}
                                      type="number"
                                      placeholder="Score"
                                      className="w-24"
                                      value={
                                        studentScores[student.uid] ??
                                        test.scores[student.uid] ??
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleScoreChange(
                                          student.uid,
                                          e.target.value
                                        )
                                      }
                                    />
                                    <span>/ {test.maxScore}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleSaveTestScores}
                                disabled={loading}
                              >
                                {loading ? "Saving..." : "Save Scores"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherPortal;
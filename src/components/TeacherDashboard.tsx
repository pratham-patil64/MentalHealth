import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  FileText,
  AlertTriangle,
  Users,
  Heart,
  Brain,
  ArrowLeft,
  Download,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Student } from "./StudentDashboard"; // Import the Student interface

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    null
  );
  const [students, setStudents] = useState<Student[]>([]);

  // Formula to calculate status dynamically
  const getMentalHealthStatus = (student: Student): 'Positive' | 'Neutral' | 'Needs Attention' => {
    const { depressionScore = 0, anxietyScore = 0, stressScore = 0 } = student;

    const thresholds = {
      stress: { moderate: 5, mild: 3 },
      anxiety: { moderate: 7, mild: 4 },
      depression: { moderate: 8, mild: 4 },
    };

    if (
      stressScore >= thresholds.stress.moderate ||
      anxietyScore >= thresholds.anxiety.moderate ||
      depressionScore >= thresholds.depression.moderate
    ) {
      return 'Needs Attention';
    }

    if (
      stressScore < thresholds.stress.mild &&
      anxietyScore < thresholds.anxiety.mild &&
      depressionScore < thresholds.depression.mild
    ) {
      return 'Positive';
    }

    return 'Neutral';
  };

  useEffect(() => {
    const q = collection(db, "students");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const scores = data.scores || {};
        
        return {
          uid: doc.id,
          ...data,
          depressionScore: scores.depression ?? data.depressionScore ?? 0,
          anxietyScore: scores.anxiety ?? data.anxietyScore ?? 0,
          stressScore: scores.stress ?? data.stressScore ?? 0,
        } as Student;
      });

      studentData.sort((a, b) => {
        const statusA = getMentalHealthStatus(a);
        const statusB = getMentalHealthStatus(b);
        if (statusA === "Needs Attention" && statusB !== "Needs Attention") return -1;
        if (statusA !== "Needs Attention" && statusB === "Needs Attention") return 1;
        return 0;
      });
      setStudents(studentData);
    });

    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClass =
      selectedClass === "all" || student.class === selectedClass;
    const matchesDivision =
      selectedDivision === "all" || student.division === selectedDivision;
    return matchesSearch && matchesClass && matchesDivision;
  });

  const totalStudents = students.length;
  const maleStudents = students.filter((s) => s.gender === "Male").length;
  const femaleStudents = students.filter((s) => s.gender === "Female").length;
  const positiveStudents = students.filter(s => getMentalHealthStatus(s) === "Positive").length;
  const negativeStudents = students.filter(s => getMentalHealthStatus(s) === "Needs Attention").length;
  const needsHelpCount = students.filter((s) => s.needsHelp).length;

  const getStatusBadge = (status: 'Positive' | 'Neutral' | 'Needs Attention') => {
    switch (status) {
      case "Positive":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Positive</Badge>;
      case "Needs Attention":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Attention</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Neutral</Badge>;
    }
  };

  const getScoreBadge = (
    score: number | undefined,
    category: "stress" | "anxiety" | "depression"
  ) => {
    if (score === undefined || score === null) return <Badge>N/A</Badge>;

    const thresholds = {
      stress: { severe: 7, moderate: 5, mild: 3 },
      anxiety: { severe: 10, moderate: 7, mild: 4 },
      depression: { severe: 12, moderate: 8, mild: 4 },
    };

    const { severe, moderate, mild } = thresholds[category];

    if (score >= severe) {
      return <Badge className="bg-red-200 text-red-800">Severe ({score})</Badge>;
    } else if (score >= moderate) {
      return <Badge className="bg-orange-200 text-orange-800">Moderate ({score})</Badge>;
    } else if (score >= mild) {
      return <Badge className="bg-yellow-200 text-yellow-800">Mild ({score})</Badge>;
    } else {
      return <Badge className="bg-green-200 text-green-800">Minimal ({score})</Badge>;
    }
  };
  
    // ✅ NEW: Dynamic recommendations based on status
  const getRecommendations = (student: Student) => {
    const status = getMentalHealthStatus(student);

    switch (status) {
      case 'Needs Attention':
        return (
          <div className="space-y-2">
            <p className="text-sm font-bold text-red-700">⚠️ Immediate attention recommended</p>
            <p className="text-sm">• Consider a one-on-one check-in with the student soon.</p>
            <p className="text-sm">• Review recent journal entries for more context.</p>
            <p className="text-sm">• Prepare to contact the school counselor or parents if patterns persist.</p>
          </div>
        );
      case 'Neutral':
        return (
          <div className="space-y-2">
            <p className="text-sm font-bold text-yellow-700"> watchful waiting suggested</p>
            <p className="text-sm">• Continue regular monitoring of weekly check-in scores.</p>
            <p className="text-sm">• Encourage the student to use the AI companion for daily thoughts.</p>
            <p className="text-sm">• No immediate action is required, but observe for trends.</p>
          </div>
        );
      case 'Positive':
        return (
          <div className="space-y-2">
            <p className="text-sm font-bold text-green-700">✅ Student is showing positive signs</p>
            <p className="text-sm">• Acknowledge their progress if the opportunity arises.</p>
            <p className="text-sm">• Encourage continued use of journaling and wellness tools.</p>
            <p className="text-sm">• Continue routine monitoring.</p>
          </div>
        );
      default:
        return <p className="text-sm">No recommendations available.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Monitor student mental health and well-being</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalStudents}</div><p className="text-xs text-muted-foreground">{maleStudents} Male, {femaleStudents} Female</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Positive Mental Health</CardTitle><Heart className="h-4 w-4 text-green-600" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{positiveStudents}</div><p className="text-xs text-muted-foreground">{totalStudents > 0 ? Math.round((positiveStudents / totalStudents) * 100) : 0}% of total</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Need Attention</CardTitle><Brain className="h-4 w-4 text-orange-600" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-orange-600">{negativeStudents}</div><p className="text-xs text-muted-foreground">{totalStudents > 0 ? Math.round((negativeStudents / totalStudents) * 100) : 0}% of total</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Emergency Help</CardTitle><AlertTriangle className="h-4 w-4 text-red-600" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{needsHelpCount}</div><p className="text-xs text-muted-foreground">Require immediate support</p></CardContent>
            </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Student Management</CardTitle>
            <CardDescription>Filter and search through student records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Division" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="A">Division A</SelectItem>
                  <SelectItem value="B">Division B</SelectItem>
                  <SelectItem value="C">Division C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Students Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Depression</TableHead>
                    <TableHead>Anxiety</TableHead>
                    <TableHead>Stress</TableHead>
                    <TableHead>Overall Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.uid}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}{student.division}</TableCell>
                      <TableCell>{getScoreBadge(student.depressionScore, "depression")}</TableCell>
                      <TableCell>{getScoreBadge(student.anxietyScore, "anxiety")}</TableCell>
                      <TableCell>{getScoreBadge(student.stressScore, "stress")}</TableCell>
                      <TableCell>{getStatusBadge(getMentalHealthStatus(student))}</TableCell>
                      <TableCell>
                        <Dialog onOpenChange={(open) => !open && setSelectedStudent(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          {selectedStudent && selectedStudent.uid === student.uid && (
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Student Reports - {selectedStudent.name}</DialogTitle>
                                <DialogDescription>
                                  Class {selectedStudent.class}{selectedStudent.division} •{" "}
                                  {selectedStudent.reportsCount || 0} total reports
                                </DialogDescription>
                              </DialogHeader>
                              <Tabs defaultValue="analysis" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="analysis">Mental Health Analysis</TabsTrigger>
                                  <TabsTrigger value="essays">Essays & Journals</TabsTrigger>
                                </TabsList>
                                <TabsContent value="analysis" className="space-y-4">
                                  <Card>
                                    <CardHeader><CardTitle>Mental Health Summary</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Depression</label>
                                          <div className="mt-1">{getScoreBadge(selectedStudent.depressionScore, "depression")}</div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Anxiety</label>
                                          <div className="mt-1">{getScoreBadge(selectedStudent.anxietyScore, "anxiety")}</div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Stress</label>
                                          <div className="mt-1">{getScoreBadge(selectedStudent.stressScore, "stress")}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Recommendations</label>
                                        {/* ✅ RECOMMENDATIONS ARE NOW DYNAMIC */}
                                        <div className="mt-2 p-4 bg-muted rounded-lg">
                                            {getRecommendations(selectedStudent)}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="flex justify-end pt-4">
          <Button variant="ghost" className="flex items-center gap-2" onClick={async () => { await signOut(auth); navigate("/teacher-login"); }}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
// src/components/AdminDashboard.tsx

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
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
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Student } from "./StudentDashboard";
import { useToast } from "@/components/ui/use-toast";

// Interface for journal entries
interface JournalEntry {
  id: string;
  content: string;
  timestamp: Timestamp;
  sentimentScore?: number;
  sentimentMagnitude?: number;
}
type MentalHealthStatus = 'Positive' | 'Neutral' | 'Needs Attention' | 'Urgent';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    null
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [urgentStudents, setUrgentStudents] = useState<Student[]>([]);

  // Function to determine status
  const getMentalHealthStatus = (student: Student): MentalHealthStatus => {
    if (student.needsHelp) {
      return 'Urgent';
    }
    const { depressionScore = 0, anxietyScore = 0, stressScore = 0 } = student;
    const thresholds = {
      stress: { moderate: 66, mild: 33 },
      anxiety: { moderate: 66, mild: 33 },
      depression: { moderate: 66, mild: 33 },
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

  // useEffect to fetch students and check for alerts
  useEffect(() => {
    const q = collection(db, "students");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let hasUrgentAlerts = false;
      const studentData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const scores = data.scores || {};
        const needsHelp = data.needsHelp || false;
        
        if(needsHelp) {
          hasUrgentAlerts = true;
        }

        return {
          uid: doc.id,
          ...data,
          depressionScore: scores.depression ?? data.depressionScore ?? 0,
          anxietyScore: scores.anxiety ?? data.anxietyScore ?? 0,
          stressScore: scores.stress ?? data.stressScore ?? 0,
          needsHelp: needsHelp,
        } as Student;
      });

      studentData.sort((a, b) => {
        const statusA = getMentalHealthStatus(a);
        const statusB = getMentalHealthStatus(b);
        if (statusA === "Urgent" && statusB !== "Urgent") return -1;
        if (statusA !== "Urgent" && statusB === "Urgent") return 1;
        if (statusA === "Needs Attention" && statusB !== "Needs Attention") return -1;
        if (statusA !== "Needs Attention" && statusB === "Needs Attention") return 1;
        return 0;
      });
      
      setStudents(studentData);

      if (hasUrgentAlerts) {
        setUrgentStudents(studentData.filter(s => s.needsHelp));
        setIsAlertModalOpen(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter students
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

  // Calculate stats
  const totalStudents = students.length;
  const maleStudents = students.filter((s) => s.gender === "Male").length;
  const femaleStudents = students.filter((s) => s.gender === "Female").length;
  const positiveStudents = students.filter(s => getMentalHealthStatus(s) === "Positive").length;
  const negativeStudents = students.filter(s => getMentalHealthStatus(s) === "Needs Attention").length;
  const needsHelpCount = students.filter((s) => s.needsHelp).length;

  // Badge for status
  const getStatusBadge = (status: MentalHealthStatus) => {
    switch (status) {
      case "Urgent":
        return <Badge className="bg-red-600 text-white hover:bg-red-600 animate-pulse">URGENT</Badge>;
      case "Needs Attention":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Attention</Badge>;
      case "Positive":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Positive</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Neutral</Badge>;
    }
  };

  // Badge for scores
  const getScoreBadge = (
    score: number | undefined,
    category: "stress" | "anxiety" | "depression"
  ) => {
    if (score === undefined || score === null) return <Badge>N/A</Badge>;
    const thresholds = {
      stress: { severe: 70, moderate: 50, mild: 30 },
      anxiety: { severe: 70, moderate: 50, mild: 30 },
      depression: { severe: 70, moderate: 50, mild: 30 },
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
  
  // Function to clear the urgent flag
  const handleClearUrgentFlag = async (studentUid: string) => {
    if (!studentUid) return;
    try {
      const studentDocRef = doc(db, "students", studentUid);
      await updateDoc(studentDocRef, {
        needsHelp: false,
        lastUrgentEntry: null, // Clear the urgent entry
        lastUrgentReason: null, // Clear the reason
      });
      toast({
        title: "Student Reviewed",
        description: "The urgent flag has been cleared for this student.",
      });
    } catch (error) {
      console.error("Error clearing flag:", error);
      toast({
        title: "Error",
        description: "Could not clear the flag. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Recommendations based on status
  const getRecommendations = (student: Student) => {
    const status = getMentalHealthStatus(student);

    switch (status) {
      case 'Urgent':
        return (
          <div className="space-y-4 p-4 bg-red-100 rounded-lg border border-red-300">
            <div className="space-y-2">
              <p className="text-sm font-bold text-red-700">‼ URGENT ACTION REQUIRED</p>
              <p className="text-sm text-red-600">• Student's journal flagged for high-risk content.</p>
              <p className="text-sm text-red-600">• **Follow school's emergency protocol immediately.**</p>
              <p className="text-sm text-red-600">• Contact school counselor or designated mental health professional.</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full bg-white border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => handleClearUrgentFlag(student.uid)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Reviewed & Clear Urgent Flag
            </Button>
          </div>
        );
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
            <p className="text-sm font-bold text-green-700">Student is showing positive signs</p>
            <p className="text-sm">• Acknowledge their progress if the opportunity arises.</p>
            <p className="text-sm">• Encourage continued use of journaling and wellness tools.</p>
            <p className="text-sm">• Continue routine monitoring.</p>
          </div>
        );
      default:
        return <p className="text-sm">No recommendations available.</p>;
    }
  };

  // Fetch journals for a student
  const fetchStudentJournals = async (studentUid: string) => {
    if (!studentUid) return;
    setJournalsLoading(true);
    try {
      const entriesRef = collection(db, "journalEntries");
      const q = query(
        entriesRef,
        where("studentUid", "==", studentUid),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedEntries = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as JournalEntry));
      setJournalEntries(fetchedEntries);
    } catch (error) {
      console.error("Error fetching student journals:", error);
    }
    setJournalsLoading(false);
  };

  // --- ‼ THIS IS THE CORRECTED FUNCTION ---
  // It now shows the Score (e.g., -0.80) and Severity (e.g., Strong)
  const getSentimentUI = (score: number | undefined, magnitude: number | undefined) => {
    if (score === undefined) {
      return <Badge variant="outline">Analyzing...</Badge>;
    }

    let text = "Neutral";
    let color = "bg-yellow-100 text-yellow-800";
    let emoji = "😐";

    if (score < -0.25) {
      text = "Negative";
      color = "bg-red-100 text-red-800";
      emoji = "😔";
    } else if (score > 0.25) {
      text = "Positive";
      color = "bg-green-100 text-green-800";
      emoji = "😊";
    }
    
    // This is the Severity score
    let strength = "";
    if (magnitude !== undefined) {
      if (magnitude > 3) strength = "(Strong)";
      else if (magnitude > 1) strength = "(Clear)";
    }

    return (
      <Badge className={`${color} hover:${color}`}>
        {emoji} {text} {strength} (Score: {score.toFixed(2)})
      </Badge>
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Timestamp) => {
      if (!timestamp) return "No date";
      return timestamp.toDate().toLocaleDateString();
  };
  
  // Open exportable report
  const handleExportReport = (studentUid: string) => {
    window.open(`/report/${studentUid}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Urgent Alert Modal */}
        <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
          <DialogContent className="max-w-lg border-red-500 border-2">
            <DialogHeader>
              <DialogTitle className="flex items-center text-2xl text-red-600">
                <AlertTriangle className="w-8 h-8 mr-3 animate-pulse" />
                Urgent Student Alerts
              </DialogTitle>
              <DialogDescription className="pt-2">
                The following students have been flagged for high-risk content in
                their journals. Please review immediately and follow your
                school's emergency protocol.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {urgentStudents.map(student => (
                  <li key={student.uid} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-sm text-red-700">Class {student.class}{student.division}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={() => setIsAlertModalOpen(false)} className="w-full">
              Acknowledge and Close
            </Button>
          </DialogContent>
        </Dialog>
        
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalStudents}</div></CardContent>
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

        {/* Student Management Card */}
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

            {/* Student Table */}
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
                    <TableRow key={student.uid} className={student.needsHelp ? "bg-red-50 hover:bg-red-100" : ""}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}{student.division}</TableCell>
                      <TableCell>{getScoreBadge(student.depressionScore, "depression")}</TableCell>
                      <TableCell>{getScoreBadge(student.anxietyScore, "anxiety")}</TableCell>
                      <TableCell>{getScoreBadge(student.stressScore, "stress")}</TableCell>
                      <TableCell>{getStatusBadge(getMentalHealthStatus(student))}</TableCell>
                      <TableCell>
                        <Dialog onOpenChange={(open) => {
                            if (!open) {
                                setSelectedStudent(null);
                                setJournalEntries([]);
                            }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedStudent(student);
                                fetchStudentJournals(student.uid);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          {selectedStudent && selectedStudent.uid === student.uid && (
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <DialogTitle>Student Reports - {selectedStudent.name}</DialogTitle>
                                    <DialogDescription>
                                      Class {selectedStudent.class}{selectedStudent.division} •{" "}
                                      {selectedStudent.reportsCount || 0} total reports
                                    </DialogDescription>
                                  </div>
                                  <Button variant="outline" onClick={() => handleExportReport(selectedStudent.uid)}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Export Full Report
                                  </Button>
                                </div>
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
                                        <div><label className="text-sm font-medium">Depression</label><div className="mt-1">{getScoreBadge(selectedStudent.depressionScore, "depression")}</div></div>
                                        <div><label className="text-sm font-medium">Anxiety</label><div className="mt-1">{getScoreBadge(selectedStudent.anxietyScore, "anxiety")}</div></div>
                                        <div><label className="text-sm font-medium">Stress</label><div className="mt-1">{getScoreBadge(selectedStudent.stressScore, "stress")}</div></div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Recommendations</label>
                                        <div className="mt-2 p-4 bg-muted rounded-lg">
                                            {getRecommendations(selectedStudent)}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                <TabsContent value="essays" className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Journal Entry Analysis</CardTitle>
                                      <CardDescription>
                                        Sentiment analysis of the student's private journal entries.
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      {journalsLoading ? (
                                        <p>Loading journal entries...</p>
                                      ) : journalEntries.length > 0 ? (
                                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                          {journalEntries.map((entry) => (
                                            <div key={entry.id} className="p-4 rounded-lg border bg-muted/30">
                                              <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                  {formatTimestamp(entry.timestamp)}
                                                </p>
                                                {/* This will now show Score + Severity */}
                                                {getSentimentUI(entry.sentimentScore, entry.sentimentMagnitude)}
                                              </div>
                                              <p className="whitespace-pre-wrap">{entry.content}</p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p>No journal entries found for this student.</p>
                                      )}
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
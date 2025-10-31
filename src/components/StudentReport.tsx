// src/components/StudentReport.tsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { Student } from "./StudentDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Brain, AlertTriangle, Printer, FileText, BookOpen, ClipboardCheck } from "lucide-react";

// Interface for journal entries (same as before)
interface JournalEntry {
  id: string;
  content: string;
  timestamp: Timestamp;
  sentimentScore?: number;
  sentimentMagnitude?: number;
}

// --- NEW: Interfaces for academic data ---
interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  completedBy: string[];
}

interface Test {
  id: string;
  title: string;
  maxScore: number;
  scores: Record<string, number>;
}


// --- ‼ NEW: Helper function to generate the analysis text ---
const generateReportAnalysis = (
  student: Student,
  journals: JournalEntry[],
  pendingAssignmentsCount: number,
  tests: Test[],
  studentId: string
) => {
  const analysisPoints: string[] = [];

  // Check for urgent flag
  if (student.needsHelp) {
    analysisPoints.push("This student has been automatically flagged for high-risk journal content. Immediate intervention is required.");
  }

  // Check scores
  if (student.depressionScore && student.depressionScore >= 50) { // "Severe" threshold
    analysisPoints.push(`Weekly check-ins show scores indicating a 'Severe' level of Depression (${student.depressionScore}).`);
  } else if (student.depressionScore && student.depressionScore >= 50) { // "Moderate"
    analysisPoints.push(`Weekly check-ins show scores indicating a 'Moderate' level of Depression (${student.depressionScore}).`);
  }

  if (student.anxietyScore && student.anxietyScore >= 70) { // "Severe"
    analysisPoints.push(`Weekly check-ins show scores indicating a 'Severe' level of Anxiety (${student.anxietyScore}).`);
  }

  if (student.stressScore && student.stressScore >= 70) { // "Severe"
    analysisPoints.push(`Weekly check-ins show scores indicating a 'Severe' level of Stress (${student.stressScore}).`);
  }

  // --- NEW: Academic analysis ---
  if (pendingAssignmentsCount > 3) {
    analysisPoints.push(`The student has a high number of pending assignments (${pendingAssignmentsCount}), which may be a significant source of stress.`);
  } else if (pendingAssignmentsCount > 0) {
    analysisPoints.push(`The student has ${pendingAssignmentsCount} pending assignments, which could be contributing to their stress levels.`);
  }

  const studentTests = tests.filter(test => test.scores && studentId in test.scores);
  if (studentTests.length > 0) {
    const averageScore = studentTests.reduce((acc, test) => acc + (test.scores[studentId] / test.maxScore), 0) / studentTests.length * 100;
    if (averageScore < 60) {
      analysisPoints.push(`The student's average test score is low (${averageScore.toFixed(2)}%), which may be impacting their self-esteem and stress.`);
    }
  }


  // Check journals
  const highRiskJournals = journals.filter(j => j.sentimentScore !== undefined && j.sentimentScore <= -0.7 && j.sentimentMagnitude !== undefined && j.sentimentMagnitude > 2.0);
  if (highRiskJournals.length > 0) {
    analysisPoints.push(`The journal history contains ${highRiskJournals.length} entries with highly negative and severe sentiment, correlating with the high scores.`);
  }

  if (analysisPoints.length === 0) {
    analysisPoints.push("This student's scores and journal entries are within normal parameters. Routine monitoring is recommended.");
  }

  return (
    <ul className="list-disc space-y-2 pl-5">
      {analysisPoints.map((point, index) => (
        <li key={index}>{point}</li>
      ))}
    </ul>
  );
};


// (getScoreBadge is the same as before)
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

// --- ‼ UPDATED: getSentimentUI to match the dashboard (includes score) ---
const getSentimentUI = (score: number | undefined, magnitude: number | undefined) => {
  if (score === undefined) {
    return <Badge variant="outline">Analyzing...</Badge>;
  }
  let text = "Neutral";
  let color = "bg-yellow-100 text-yellow-800";
  if (score < -0.25) {
    text = "Negative";
    color = "bg-red-100 text-red-800";
  } else if (score > 0.25) {
    text = "Positive";
    color = "bg-green-100 text-green-800";
  }

  // Severity
  let strength = "";
  if (magnitude !== undefined) {
    if (magnitude > 3) strength = "(Strong)";
    else if (magnitude > 1) strength = "(Clear)";
  }

  return (
    <Badge className={`${color} hover:${color}`}>
      {text} {strength} (Score: {score.toFixed(2)})
    </Badge>
  );
};

// (formatTimestamp is the same as before)
const formatTimestamp = (timestamp: Timestamp) => {
  if (!timestamp) return "No date";
  return timestamp.toDate().toLocaleString();
};

const StudentReport = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const studentDocRef = doc(db, "students", studentId);
        const studentSnap = await getDoc(studentDocRef);
        if (studentSnap.exists()) {
          // --- ‼ UPDATED: Ensure scores are read correctly ---
          const data = studentSnap.data() as any;
          const scores = data.scores || {};
          setStudent({
            ...data,
            depressionScore: scores.depression ?? data.depressionScore,
            anxietyScore: scores.anxiety ?? data.anxietyScore,
            stressScore: scores.stress ?? data.stressScore,
            needsHelp: data.needsHelp || false,
          } as Student);
        }

        const entriesRef = collection(db, "journalEntries");
        const q = query(
          entriesRef,
          where("studentUid", "==", studentId),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedEntries = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as JournalEntry));
        setJournalEntries(fetchedEntries);

        // --- NEW: Fetch academic data ---
        const assignmentsQuery = await getDocs(collection(db, "assignments"));
        const fetchedAssignments = assignmentsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
        setAssignments(fetchedAssignments);

        const testsQuery = await getDocs(collection(db, "tests"));
        const fetchedTests = testsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
        setTests(fetchedTests);

      } catch (error) {
        console.error("Error fetching report data:", error);
      }
      setLoading(false);
    };
    fetchReportData();
  }, [studentId]);

  // --- NEW: Calculate pending assignments ---
  const pendingAssignmentsCount = assignments.filter(
    (assignment) =>
      !assignment.completedBy.includes(studentId ?? "") &&
      new Date(assignment.dueDate) < new Date()
  ).length;

  if (loading) {
    return <div className="p-10">Loading report...</div>;
  }

  if (!student) {
    return <div className="p-10">No student data found for this ID.</div>;
  }

  return (
    <div className="bg-white text-black p-10 print:p-0">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <h1 className="text-3xl font-bold">Student Wellness Report</h1>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print to PDF
        </Button>
      </div>

      <section className="mb-8 p-6 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          {student.name}
        </h2>
        {student.needsHelp && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <span className="font-bold">This student has been automatically flagged for urgent review due to high-risk journal content.</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div><strong>Email:</strong> {student.email}</div>
          <div><strong>Class:</strong> {student.class}</div>
          <div><strong>Division:</strong> {student.division}</div>
          <div><strong>Gender:</strong> {student.gender}</div>
          <div><strong>School:</strong> {student.school || "N/A"}</div>
          <div><strong>Parent's Phone:</strong> {student.parentPhone || "N/A"}</div>
        </div>
      </section>

      {/* --- ‼ NEW: ANALYSIS SUMMARY SECTION --- */}
      <section className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          Summary & Analysis
        </h2>
        <div className="text-gray-800">
          {generateReportAnalysis(student, journalEntries, pendingAssignmentsCount, tests, studentId ?? "")}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            Mental Health Scores
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <h3 className="text-lg font-medium">Stress</h3>
              {getScoreBadge(student.stressScore, "stress")}
            </div>
            <div className="text-center">
              <Heart className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <h3 className="text-lg font-medium">Anxiety</h3>
              {getScoreBadge(student.anxietyScore, "anxiety")}
            </div>
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
              <h3 className="text-lg font-medium">Depression</h3>
              {getScoreBadge(student.depressionScore, "depression")}
            </div>
          </div>
        </section>

        {/* --- NEW: ACADEMIC PERFORMANCE SECTION --- */}
        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            Academic Performance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="text-lg font-medium">Pending Assignments</h3>
                  <p className="text-sm text-gray-500">Number of overdue assignments.</p>
                </div>
              </div>
              <div className="text-3xl font-bold">
                {pendingAssignmentsCount}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="text-lg font-medium">Test Scores</h3>
                  <p className="text-sm text-gray-500">Recent test performance.</p>
                </div>
              </div>
              <ul className="list-disc pl-5 text-sm">
                {tests
                  .filter(test => test.scores && studentId && test.scores[studentId] !== undefined)
                  .map(test => (
                    <li key={test.id}>
                      {test.title}: <strong>{test.scores[studentId!]} / {test.maxScore}</strong>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <section className="p-6 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          Journal Entry Analysis
        </h2>
        <div className="space-y-4">
          {journalEntries.length > 0 ? (
            journalEntries.map((entry) => (
              <div key={entry.id} className="p-4 border rounded-md break-inside-avoid">
                <div className="flex justify-between items-center mb-2 pb-2 border-b">
                  <span className="text-sm font-medium text-gray-600">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  {getSentimentUI(entry.sentimentScore, entry.sentimentMagnitude)}
                </div>
                <p className="whitespace-pre-wrap text-gray-800">{entry.content}</p>
              </div>
            ))
          ) : (
            <p>No journal entries found for this student.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentReport;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Heart,
  Brain,
  ArrowLeft,
  Download,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data
const mockStudents = [
  {
    id: 1,
    name: "Emma Johnson",
    class: "10",
    division: "A",
    gender: "Female",
    mentalHealthStatus: "positive",
    needsHelp: false,
    lastEssayDate: "2024-01-15",
    reportsCount: 3,
    essays: [
      { id: 1, title: "My Daily Routine", content: "I wake up every morning feeling grateful...", sentiment: "positive", date: "2024-01-15" },
      { id: 2, title: "School Challenges", content: "Sometimes I find math difficult but I keep trying...", sentiment: "neutral", date: "2024-01-10" }
    ]
  },
  {
    id: 2,
    name: "Alex Smith",
    class: "10",
    division: "B",
    gender: "Male",
    mentalHealthStatus: "negative",
    needsHelp: true,
    lastEssayDate: "2024-01-14",
    reportsCount: 5,
    essays: [
      { id: 3, title: "Feeling Overwhelmed", content: "I've been feeling very stressed lately...", sentiment: "negative", date: "2024-01-14" },
      { id: 4, title: "Family Issues", content: "Things at home have been difficult...", sentiment: "negative", date: "2024-01-12" }
    ]
  },
  {
    id: 3,
    name: "Sarah Williams",
    class: "11",
    division: "A",
    gender: "Female",
    mentalHealthStatus: "positive",
    needsHelp: false,
    lastEssayDate: "2024-01-16",
    reportsCount: 2,
    essays: [
      { id: 5, title: "My Future Dreams", content: "I'm excited about becoming a doctor...", sentiment: "positive", date: "2024-01-16" }
    ]
  },
  {
    id: 4,
    name: "Michael Brown",
    class: "11",
    division: "B",
    gender: "Male",
    mentalHealthStatus: "neutral",
    needsHelp: false,
    lastEssayDate: "2024-01-13",
    reportsCount: 4,
    essays: [
      { id: 6, title: "School Life", content: "School is okay, nothing special happening...", sentiment: "neutral", date: "2024-01-13" }
    ]
  },
  {
    id: 5,
    name: "Lisa Davis",
    class: "12",
    division: "A",
    gender: "Female",
    mentalHealthStatus: "negative",
    needsHelp: true,
    lastEssayDate: "2024-01-11",
    reportsCount: 6,
    essays: [
      { id: 7, title: "Exam Pressure", content: "The pressure to perform well is overwhelming...", sentiment: "negative", date: "2024-01-11" }
    ]
  }
];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filter students based on search and filters
  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "all" || student.class === selectedClass;
    const matchesDivision = selectedDivision === "all" || student.division === selectedDivision;
    return matchesSearch && matchesClass && matchesDivision;
  });

  // Calculate statistics
  const totalStudents = mockStudents.length;
  const maleStudents = mockStudents.filter(s => s.gender === "Male").length;
  const femaleStudents = mockStudents.filter(s => s.gender === "Female").length;
  const positiveStudents = mockStudents.filter(s => s.mentalHealthStatus === "positive").length;
  const negativeStudents = mockStudents.filter(s => s.mentalHealthStatus === "negative").length;
  const needsHelpCount = mockStudents.filter(s => s.needsHelp).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "positive":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Positive</Badge>;
      case "negative":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Attention</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Neutral</Badge>;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Positive</Badge>;
      case "negative":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Negative</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Neutral</Badge>;
    }
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {maleStudents} Male, {femaleStudents} Female
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Mental Health</CardTitle>
              <Heart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{positiveStudents}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((positiveStudents / totalStudents) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              <Brain className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{negativeStudents}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((negativeStudents / totalStudents) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Help</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{needsHelpCount}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate support
              </p>
            </CardContent>
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
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
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
                    <TableHead>Division</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Mental Health Status</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Last Essay</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.division}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{getStatusBadge(student.mentalHealthStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{student.reportsCount}</span>
                          {student.needsHelp && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{student.lastEssayDate}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Reports
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Student Reports - {student.name}</DialogTitle>
                              <DialogDescription>
                                Class {student.class}{student.division} • {student.reportsCount} total reports
                              </DialogDescription>
                            </DialogHeader>
                            
                            <Tabs defaultValue="essays" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="essays">Essays & Journals</TabsTrigger>
                                <TabsTrigger value="analysis">Mental Health Analysis</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="essays" className="space-y-4">
                                {student.essays.map((essay) => (
                                  <Card key={essay.id}>
                                    <CardHeader>
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{essay.title}</CardTitle>
                                        <div className="flex items-center gap-2">
                                          {getSentimentBadge(essay.sentiment)}
                                          <Badge variant="outline">{essay.date}</Badge>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-muted-foreground leading-relaxed">
                                        {essay.content}
                                      </p>
                                    </CardContent>
                                  </Card>
                                ))}
                              </TabsContent>
                              
                              <TabsContent value="analysis" className="space-y-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Mental Health Summary</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">Overall Status</label>
                                        <div className="mt-1">
                                          {getStatusBadge(student.mentalHealthStatus)}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Needs Emergency Help</label>
                                        <div className="mt-1">
                                          <Badge className={student.needsHelp ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                            {student.needsHelp ? "Yes" : "No"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className="text-sm font-medium">Recommendations</label>
                                      <div className="mt-2 p-4 bg-muted rounded-lg">
                                        {student.needsHelp ? (
                                          <div className="space-y-2">
                                            <p className="text-sm">⚠️ <strong>Immediate attention required</strong></p>
                                            <p className="text-sm">• Schedule one-on-one counseling session</p>
                                            <p className="text-sm">• Contact parents/guardians</p>
                                            <p className="text-sm">• Monitor daily check-ins</p>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <p className="text-sm">✅ <strong>Student showing positive mental health signs</strong></p>
                                            <p className="text-sm">• Continue regular monitoring</p>
                                            <p className="text-sm">• Encourage continued journaling</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
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

        {/* Logout Button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => {
              // Optionally clear auth state here
              navigate("/teacher-login");
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
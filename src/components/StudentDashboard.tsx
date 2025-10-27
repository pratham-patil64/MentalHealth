import { useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import GoogleFit from "./GoogleFit";
import GoogleClassroom from "./GoogleClassroom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, MessageCircle, Brain, Upload, History, Heart,
  User as UserIcon, LogOut, Calendar, X, Wind, Flower, Star, Eye, Hand, Ear, Sun, Fingerprint, ArrowLeft, CheckCircle, ClipboardList
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProfilePage from "./ProfilePage";
import Journal from "./Journal";
import PHQ9 from "./PHQ9";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components

export interface Student {
  uid: string;
  name: string;
  email: string;
  class: string;
  division: string;
  gender: string;
  profilePicUrl?: string;
  parentPhone?: string;
  school?: string;
  bloodType?: string;
  mentalHealthStatus: string;
  reportsCount: number;
  needsHelp: boolean;
  lastEssayDate: string;
  phq9Score?: number;
  lastPhq9Date?: Timestamp;
  assignments?: any[];
}

interface RecentEntry {
  id: string;
  content: string;
  timestamp: Timestamp;
}

interface StudentDashboardProps {
  user: User;
  googleAccessToken: string | null;
}

const groundingSteps = [
    { step: 1, number: 5, prompt: "Acknowledge 5 things you can SEE around you.", Icon: Eye },
    { step: 2, number: 4, prompt: "Acknowledge 4 things you can FEEL.", Icon: Hand },
    { step: 3, number: 3, prompt: "Acknowledge 3 things you can HEAR.", Icon: Ear },
    { step: 4, number: 2, prompt: "Acknowledge 2 things you can SMELL.", Icon: Sun },
    { step: 5, number: 1, prompt: "Acknowledge 1 thing you can TASTE.", Icon: Fingerprint },
    { step: 6, number: 0, prompt: "You've completed the exercise. Take a deep breath.", Icon: Heart },
];

const calmingExercises = [
    { id: "5-4-3-2-1-grounding", title: "5-4-3-2-1 Grounding", description: "An interactive exercise to ground yourself in the present moment using your five senses.", Icon: Star, color: "bg-blue-500" },
    { id: "4-7-8-breathing", title: "4-7-8 Breathing", description: "Inhale for 4s, hold for 7s, then exhale slowly for 8s to promote relaxation.", Icon: Flower, color: "bg-purple-500", animationClass: "animate-478-breathing", duration: 19 },
    { id: "mindful-minute", title: "Mindful Minute", description: "Focus on your natural breath for 60 seconds. Let thoughts come and go without judgment.", Icon: Wind, color: "bg-green-500", animationClass: "animate-pulse-slow", duration: 60 },
];


const StudentDashboard = ({ user, googleAccessToken }: StudentDashboardProps) => {
    const [studentData, setStudentData] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
    const [showPhq9, setShowPhq9] = useState(false);
    const [isPhq9ModalOpen, setIsPhq9ModalOpen] = useState(false);
    const [view, setView] = useState<"dashboard" | "profile">("dashboard");
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [activeExercise, setActiveExercise] = useState<(typeof calmingExercises)[0] | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [groundingStep, setGroundingStep] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (activeExercise && countdown > 0 && activeExercise.id !== '5-4-3-2-1-grounding') {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0 && activeExercise && activeExercise.id !== '5-4-3-2-1-grounding') {
            setActiveExercise(null);
        }
        return () => clearTimeout(timer);
    }, [countdown, activeExercise]);

    const startExercise = (exercise: (typeof calmingExercises)[0]) => {
        setActiveExercise(exercise);
        setIsExerciseModalOpen(true);
        if (exercise.id === '5-4-3-2-1-grounding') {
            setGroundingStep(0);
        } else {
            setCountdown(exercise.duration || 0);
        }
    };

    const stopExercise = () => {
        setIsExerciseModalOpen(false);
        setActiveExercise(null);
        setCountdown(0);
        setGroundingStep(0);
    };

    const fetchStudentData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const docRef = doc(db, "students", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Student;
                setStudentData(data);
                if (!data.school || !data.parentPhone || !data.class) {
                    setView("profile");
                } else {
                    setView("dashboard");
                }
                if (data.lastPhq9Date) {
                    const lastDate = data.lastPhq9Date.toDate();
                    const today = new Date();
                    const oneWeek = 7 * 24 * 60 * 60 * 1000;
                    if (today.getTime() - lastDate.getTime() > oneWeek) {
                        setShowPhq9(true);
                    } else {
                        setShowPhq9(false);
                    }
                } else {
                    setShowPhq9(true);
                }
                if(data.school) {
                    const q = query(collection(db, "journalEntries"), where("studentUid", "==", user.uid), orderBy("timestamp", "desc"), limit(3));
                    const querySnapshot = await getDocs(q);
                    const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentEntry));
                    setRecentEntries(entries);
                }
            } else {
                console.error("CRITICAL: User document not found! Forcing profile completion.");
                setView("profile"); // If doc doesn't exist, force profile creation
            }
        } catch (error) {
            console.error("ERROR fetching student data or entries:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, [user]);

    const chatUrl = "https://cdn.botpress.cloud/webchat/v3.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/04/16/16/20250416163745-EVAZ135S.json";
    const handleOpenChat = () => setIsChatOpen(true);
    const handleCloseChat = () => setIsChatOpen(false);
    const handleProfileUpdate = () => {
        fetchStudentData();
        setView("dashboard");
    };
    const handlePhq9Complete = () => {
        setIsPhq9ModalOpen(false);
        setShowPhq9(false);
        fetchStudentData();
    };
    const GroundingIcon = activeExercise?.id === '5-4-3-2-1-grounding' ? groundingSteps[groundingStep].Icon : null;

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-gradient-background"><p>Loading Dashboard...</p></div>;
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-background">
                <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Avatar>
                                <AvatarImage src={studentData?.profilePicUrl} alt={studentData?.name} />
                                <AvatarFallback>{studentData?.name ? studentData.name.charAt(0).toUpperCase() : "S"}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{view === 'profile' ? "Your Profile" : `Welcome, ${studentData?.name || "Student"}!`}</h1>
                                <p className="text-muted-foreground">{view === 'profile' ? "Please keep your details up to date." : "How are you feeling today?"}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="icon" onClick={() => setView(view === 'profile' ? 'dashboard' : 'profile')}>{view === 'profile' ? <ArrowLeft className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}</Button>
                            <Button variant="ghost" size="icon" onClick={async () => {
                                sessionStorage.removeItem('googleAccessToken');
                                await signOut(auth);
                            }}><LogOut className="w-5 h-5" /></Button>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-8 max-w-7xl">
                    {view === 'profile' ? (
                        <ProfilePage user={user} studentData={studentData} onProfileUpdate={handleProfileUpdate} />
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Scan Essay and Chat with AI cards */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-gradient-wellness cursor-pointer group">
                                        <CardHeader className="text-center">
                                            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><Upload className="w-8 h-8 text-wellness-foreground" /></div>
                                            <CardTitle className="text-2xl text-wellness-foreground">Scan New Essay</CardTitle>
                                            <CardDescription className="text-wellness-foreground/80">Upload your latest essay for AI analysis</CardDescription>
                                        </CardHeader>
                                    </Card>
                                    <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-gradient-calm cursor-pointer group" onClick={handleOpenChat}>
                                        <CardHeader className="text-center">
                                            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"><MessageCircle className="w-8 h-8 text-calm-foreground" /></div>
                                            <CardTitle className="text-2xl text-calm-foreground">Chat with AI</CardTitle>
                                            <CardDescription className="text-calm-foreground/80">Talk to our mental health support AI</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </div>

                                {/* Calming Exercises Card */}
                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-2xl text-foreground flex items-center"><Wind className="w-6 h-6 mr-3 text-primary" />Calming Exercises</CardTitle><CardDescription>Take a moment for yourself. Try one of these exercises to relax and refocus.</CardDescription></CardHeader>
                                    <CardContent className="grid md:grid-cols-3 gap-4">
                                        {calmingExercises.map((exercise) => (
                                            <div key={exercise.id} className="p-6 rounded-2xl bg-muted hover:bg-muted/80 transition-colors cursor-pointer group text-center flex flex-col items-center" onClick={() => startExercise(exercise)}>
                                                <div className={`w-16 h-16 rounded-full ${exercise.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}><exercise.Icon className="w-8 h-8 text-white" /></div>
                                                <h3 className="font-bold text-lg text-foreground">{exercise.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{exercise.description.split('.')[0]}.</p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Google Fit Card */}
                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-2xl text-foreground flex items-center">Google Fit Data</CardTitle><CardDescription>Your activity and sleep patterns from Google Fit.</CardDescription></CardHeader>
                                    <CardContent><GoogleFit accessToken={googleAccessToken} /></CardContent>
                                </Card>

                                {/* Google Classroom Card */}
                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-2xl text-foreground flex items-center">Google Classroom</CardTitle><CardDescription>View your upcoming assignments.</CardDescription></CardHeader>
                                    <CardContent><GoogleClassroom accessToken={googleAccessToken} /></CardContent>
                                </Card>

                                {/* Weekly Journal Card */}
                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-2xl text-foreground flex items-center"><Calendar className="w-6 h-6 mr-2 text-primary" />Weekly Journal</CardTitle><CardDescription>A private space for your thoughts and feelings.</CardDescription></CardHeader>
                                    <CardContent>{user && <Journal user={user} />}</CardContent>
                                </Card>
                            </div>

                            {/* Aside Column */}
                            <aside className="space-y-6">
                                {/* Weekly Check-in Card */}
                                {showPhq9 ? (
                                    <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm text-center">
                                        <CardHeader><CardTitle className="text-xl text-foreground flex items-center justify-center"><ClipboardList className="w-5 h-5 mr-2 text-primary" />Weekly Check-in</CardTitle><CardDescription>It's time for your weekly mental health check-in.</CardDescription></CardHeader>
                                        <CardContent><Button onClick={() => setIsPhq9ModalOpen(true)}>Open Test</Button></CardContent>
                                    </Card>
                                ) : (
                                    <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                        <CardHeader><CardTitle className="text-xl text-foreground flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-500" />Weekly Check-in Complete</CardTitle><CardDescription>You have completed your check-in for this week.</CardDescription></CardHeader>
                                        <CardContent>
                                            <div className="flex justify-center items-center"><Calendar className="w-24 h-24 text-primary" /></div>
                                            <p className="text-center text-muted-foreground mt-4">Your next check-in is in { studentData?.lastPhq9Date ? 7 - Math.floor((new Date().getTime() - studentData.lastPhq9Date.toDate().getTime()) / (1000 * 3600 * 24)) : 7 } days.</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Recent Journals Card */}
                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-xl text-foreground flex items-center"><History className="w-5 h-5 mr-2 text-primary" />Recent Journals</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        {recentEntries.length > 0 ? (
                                        recentEntries.map((entry) => (
                                            <div key={entry.id} className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors cursor-pointer group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 overflow-hidden"><h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{entry.content}</h4><p className="text-sm text-muted-foreground mt-1">{entry.timestamp?.toDate().toLocaleDateString()}</p></div>
                                                <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            </div>
                                        ))
                                        ) : ( <p className="text-sm text-muted-foreground text-center p-4">Your recent journal entries will appear here.</p>)}
                                        <Button variant="ghost" className="w-full text-primary hover:bg-primary/10">View All Journals</Button>
                                    </CardContent>
                                </Card>

                                {/* Need to Talk Card */}
                                <Card className="border-0 shadow-card bg-gradient-calm">
                                    <CardHeader className="text-center"><Brain className="w-12 h-12 text-calm-foreground mx-auto mb-4 animate-float" /><CardTitle className="text-xl text-calm-foreground">Need Someone to Talk To?</CardTitle><CardDescription className="text-calm-foreground/80">Our AI companion is here 24/7 to listen and support you</CardDescription><Button variant="secondary" className="mt-4 bg-white/20 text-calm-foreground hover:bg-white/30" onClick={handleOpenChat}>Start Conversation</Button></CardHeader>
                                </Card>
                            </aside>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals and Style Block */}
            <Dialog open={isPhq9ModalOpen} onOpenChange={setIsPhq9ModalOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle className="text-2xl">Weekly Mental Health Check-in</DialogTitle><DialogDescription>Over the last 2 weeks, how often have you been bothered by any of the following problems?</DialogDescription></DialogHeader><PHQ9 user={user} onComplete={handlePhq9Complete} /></DialogContent></Dialog>
            <Dialog open={isExerciseModalOpen} onOpenChange={stopExercise}><DialogContent className="max-w-md text-center p-8">{activeExercise && (<><DialogHeader><div className={`mx-auto w-24 h-24 rounded-full ${activeExercise.color} flex items-center justify-center mb-4`}><activeExercise.Icon className="w-12 h-12 text-white" /></div><DialogTitle className="text-3xl font-bold">{activeExercise.title}</DialogTitle></DialogHeader>{activeExercise.id === '5-4-3-2-1-grounding' ? (<div className="my-8 text-center animate-fade-in">{GroundingIcon && <GroundingIcon className="w-16 h-16 text-primary mx-auto mb-4" />}<p className="text-2xl font-semibold">{groundingSteps[groundingStep].prompt}</p></div>) : (<div className="my-8 flex justify-center items-center"><div className={`w-48 h-48 rounded-full border-4 border-muted flex items-center justify-center ${activeExercise.animationClass}`}><span className="text-5xl font-bold text-foreground">{countdown}s</span></div></div>)}{activeExercise.id === '5-4-3-2-1-grounding' ? (<Button onClick={() => groundingStep < groundingSteps.length - 1 ? setGroundingStep(groundingStep + 1) : stopExercise()} className="w-full">{groundingStep < groundingSteps.length - 1 ? "Done" : "Finish"}</Button>) : (<Button onClick={stopExercise} variant="outline" className="w-full">Stop Exercise</Button>)}</>)}</DialogContent></Dialog>
            {isChatOpen && (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-card rounded-2xl shadow-xl w-full h-full flex flex-col max-w-4xl max-h-[90vh]"><div className="p-3 border-b flex justify-between items-center bg-muted/50 rounded-t-2xl"><h3 className="font-bold text-lg flex items-center"><MessageCircle className="w-5 h-5 mr-2" />AI Assistant</h3><Button variant="ghost" size="icon" onClick={handleCloseChat} className="rounded-full"><X className="w-5 h-5" /></Button></div><iframe src={chatUrl} className="w-full h-full border-0 rounded-b-2xl" title="Botpress Chat"></iframe></div></div>)}
            <style>{`@keyframes breathe-478 { 0% { transform: scale(0.8); } 21% { transform: scale(1); } 58% { transform: scale(1); } 100% { transform: scale(0.8); } } .animate-478-breathing { animation: breathe-478 19s infinite ease-in-out; } .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; } .animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </>
    );
};

export default StudentDashboard;
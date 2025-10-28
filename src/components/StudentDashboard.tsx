// StudentDashboard.tsx

import { useState, useEffect, useCallback } from "react";
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
  FileText, MessageCircle, Brain, History, Heart, Check,
  User as UserIcon, LogOut, Calendar, X, Wind, Flower, Star, Eye, Hand, Ear, Sun, Fingerprint, ArrowLeft, ClipboardList
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import ProfilePage from "./ProfilePage";
import Journal from "./Journal";
import WeeklyCheckinChat from "./WeeklyCheckinChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BehavioralScores } from "@/lib/healthCalculations";

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
  // Unified scores, 0-100, lower is better
  anxietyScore?: number;
  stressScore?: number;
  depressionScore?: number;
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
    const [behavioralScores, setBehavioralScores] = useState<BehavioralScores | null>(null);
    const [isGeneralChatOpen, setIsGeneralChatOpen] = useState(false);
    const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
    const [view, setView] = useState<"dashboard" | "profile">("dashboard");
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [activeExercise, setActiveExercise] = useState<(typeof calmingExercises)[0] | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [groundingStep, setGroundingStep] = useState(0);
    const [hasChattedThisWeek, setHasChattedThisWeek] = useState(false);
    const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);

    const getWeekBoundaries = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0,0,0,0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);
        return { start: Timestamp.fromDate(monday), end: Timestamp.fromDate(sunday) };
    }

    const fetchStudentData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const docRef = doc(db, "students", user.uid);
            const docSnap = await getDoc(docRef);
            let currentStudentData: Student | null = null;

            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                // This logic correctly reads scores from the top level OR a nested 'scores' object
                const scores = data.scores || {};
                currentStudentData = {
                    ...data,
                    depressionScore: scores.depression ?? data.depressionScore,
                    anxietyScore: scores.anxiety ?? data.anxietyScore,
                    stressScore: scores.stress ?? data.stressScore,
                } as Student;
                
                setStudentData(currentStudentData);

                if (!currentStudentData.school || !currentStudentData.parentPhone || !currentStudentData.class) {
                    setView("profile");
                } else {
                    setView("dashboard");
                }
            } else {
                setView("profile");
            }
            const { start, end } = getWeekBoundaries(new Date());
            const qChats = query(collection(db, "weeklyChats"), where("studentUid", "==", user.uid), where("chatDate", ">=", start), where("chatDate", "<=", end));
            const chatSnapshot = await getDocs(qChats);
            setHasChattedThisWeek(!chatSnapshot.empty);

            if (currentStudentData?.school) {
                const qJournals = query(collection(db, "journalEntries"), where("studentUid", "==", user.uid), orderBy("timestamp", "desc"), limit(3));
                const querySnapshot = await getDocs(qJournals);
                setRecentEntries(querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RecentEntry)));
            }
        } catch (error) { console.error("ERROR fetching data:", error); } 
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

    // --- Unified Scoring Function ---
    const calculateAndSaveUnifiedScores = useCallback(async () => {
        if (!user) return;

        // 1. Get Chat Data (fetch all "yes" counts for the month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const monthlyChatsSnapshot = await getDocs(query(collection(db, "weeklyChats"), where("studentUid", "==", user.uid), where("chatDate", ">=", Timestamp.fromDate(startOfMonth)), where("chatDate", "<=", Timestamp.fromDate(endOfMonth))));
        
        let totalAnxietyYes = 0, totalDepressionYes = 0, totalStressYes = 0;
        const chatCount = monthlyChatsSnapshot.size > 0 ? monthlyChatsSnapshot.size : 1;
        
        monthlyChatsSnapshot.docs.forEach((d) => {
            const data = d.data();
            if (data.anxietyResponses) totalAnxietyYes += data.anxietyResponses.filter(Boolean).length;
            if (data.depressionResponses) totalDepressionYes += data.depressionResponses.filter(Boolean).length;
            if (data.stressResponses) totalStressYes += data.stressResponses.filter(Boolean).length;
        });

        // 2. Get Google Fit Data (from state)
        // behavioralScores has 100 as GOOD, 0 as BAD. Default to 50 if not available.
        const activityScore = behavioralScores?.activityScore ?? 50;
        const sleepScore = behavioralScores?.sleepScore ?? 50;

        // 3. Unified Scoring Logic
        // Convert all scores to "Factors" (0-100, where 100 is WORSE)
        const sleepFactor = 100 - sleepScore;
        const activityFactor = 100 - activityScore;

        const avgAnxietyYes = totalAnxietyYes / chatCount;
        const avgDepressionYes = totalDepressionYes / chatCount;
        const avgStressYes = totalStressYes / chatCount;
        
        // Assuming max 5 "yes" answers per category per chat, convert to 0-100 scale
        const anxietyChatFactor = Math.min(100, (avgAnxietyYes / 5) * 100);
        const depressionChatFactor = Math.min(100, (avgDepressionYes / 5) * 100);
        const stressChatFactor = Math.min(100, (avgStressYes / 5) * 100);

        // Weighted averages: 60% self-reported (chat), 40% behavioral (Fit)
        const finalAnxietyScore = Math.round((anxietyChatFactor * 0.6) + (sleepFactor * 0.4));
        const finalDepressionScore = Math.round((depressionChatFactor * 0.6) + (activityFactor * 0.3) + (sleepFactor * 0.1));
        const finalStressScore = Math.round((stressChatFactor * 0.6) + (sleepFactor * 0.2) + (activityFactor * 0.2));

        // 4. Save to Firestore
        const studentDocRef = doc(db, "students", user.uid);
        await setDoc(studentDocRef, {
            anxietyScore: finalAnxietyScore,
            depressionScore: finalDepressionScore,
            stressScore: finalStressScore,
        }, { merge: true });

        // Update local state immediately for responsiveness
        setStudentData(prev => prev ? {
            ...prev,
            anxietyScore: finalAnxietyScore,
            depressionScore: finalDepressionScore,
            stressScore: finalStressScore,
        } : null);
        
    }, [user, behavioralScores]); // Removed fetchStudentData from dependencies

    // This effect triggers the calculation when Fit data arrives
    useEffect(() => {
        if (behavioralScores) {
            calculateAndSaveUnifiedScores();
        }
    }, [behavioralScores, calculateAndSaveUnifiedScores]);

    // *** THIS IS THE FIX ***
    // Wrap the handleScoresCalculated function in useCallback
    // This stops it from being re-created on every render, breaking the loop.
    const handleScoresCalculated = useCallback((scores: BehavioralScores) => {
        setBehavioralScores(scores);
    }, []); // Empty dependency array means this function never changes
    
    // This triggers calculation after a chat
    const handleCheckinComplete = () => {
        setIsCheckinModalOpen(false);
        // We call fetchStudentData first to ensure we have the latest chat,
        // then recalculate.
        fetchStudentData().then(() => {
            calculateAndSaveUnifiedScores();
        });
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (activeExercise && countdown > 0 && activeExercise.id !== '5-4-3-2-1-grounding') {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0 && activeExercise && activeExercise.id !== '5-4-3-2-1-grounding') {
            setActiveExercise(null);
        }
        return () => clearTimeout(timer);
    }, [countdown, activeExercise]);

    const startExercise = (exercise: (typeof calmingExercises)[0]) => {
        setActiveExercise(exercise); setIsExerciseModalOpen(true);
        if (exercise.id === '5-4-3-2-1-grounding') setGroundingStep(0);
        else setCountdown(exercise.duration || 0);
    };

    const stopExercise = () => { setIsExerciseModalOpen(false); setActiveExercise(null); setCountdown(0); setGroundingStep(0); };
    
    const generalChatUrl = "https://cdn.botpress.cloud/webchat/v3.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/04/16/16/20250416163745-EVAZ135S.json";
    const handleOpenGeneralChat = () => setIsGeneralChatOpen(true);
    const handleCloseGeneralChat = () => setIsGeneralChatOpen(false);
    
    const handleProfileUpdate = () => { fetchStudentData(); setView("dashboard"); };
    
    const GroundingIcon = activeExercise?.id === '5-4-3-2-1-grounding' ? groundingSteps[groundingStep].Icon : null;

    if (loading) return <div className="flex h-screen items-center justify-center bg-gradient-background"><p>Loading Dashboard...</p></div>;

    return (
        <>
            <div className="min-h-screen bg-gradient-background">
                <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Avatar><AvatarImage src={studentData?.profilePicUrl} alt={studentData?.name} /><AvatarFallback>{studentData?.name ? studentData.name.charAt(0).toUpperCase() : "S"}</AvatarFallback></Avatar>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{view === 'profile' ? "Your Profile" : `Welcome, ${studentData?.name || "Student"}!`}</h1>
                                <p className="text-muted-foreground">{view === 'profile' ? "Please keep your details up to date." : "How are you feeling today?"}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="icon" onClick={() => setView(v => v === 'profile' ? 'dashboard' : 'profile')}>{view === 'profile' ? <ArrowLeft className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}</Button>
                            <Button variant="ghost" size="icon" onClick={async () => { sessionStorage.removeItem('googleAccessToken'); await signOut(auth); }}><LogOut className="w-5 h-5" /></Button>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-8 max-w-7xl">
                    {view === 'profile' ? (
                        <ProfilePage user={user} studentData={studentData} onProfileUpdate={handleProfileUpdate} />
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card 
                                        onClick={!hasChattedThisWeek ? () => setIsCheckinModalOpen(true) : undefined}
                                        className={`border-0 shadow-card hover:shadow-glow transition-all duration-300 group ${
                                            hasChattedThisWeek 
                                            ? 'bg-gradient-to-br from-gray-500 to-gray-600 cursor-not-allowed' 
                                            : 'bg-gradient-wellness hover:scale-105 cursor-pointer'
                                        }`}
                                    >
                                        <CardHeader className="text-center">
                                            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300">
                                                {hasChattedThisWeek ? <Check className="w-8 h-8 text-white" /> : <ClipboardList className="w-8 h-8 text-wellness-foreground" />}
                                            </div>
                                            <CardTitle className="text-2xl text-white">
                                                {hasChattedThisWeek ? "Check-in Complete" : "Start Weekly Check-in"}
                                            </CardTitle>
                                            <CardDescription className="text-white/80">
                                                {hasChattedThisWeek ? "You're all set for this week!" : "Answer a few questions with our guided chat."}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>

                                    <Card className="border-0 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 bg-gradient-calm cursor-pointer group" onClick={handleOpenGeneralChat}>
                                        <CardHeader className="text-center">
                                            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300"><MessageCircle className="w-8 h-8 text-calm-foreground" /></div>
                                            <CardTitle className="text-2xl text-calm-foreground">AI Companion</CardTitle>
                                            <CardDescription className="text-calm-foreground/80">Talk about anything on your mind.</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </div>
                                
                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-2xl text-foreground flex items-center"><Brain className="w-6 h-6 mr-3 text-primary" />Your Unified Wellness Scores</CardTitle>
                                        <CardDescription>Calculated from your check-ins and Google Fit data (Scores 0-100, lower is better).</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Depression</p><p className="text-3xl font-bold text-foreground">{studentData?.depressionScore ?? 'N/A'}<span className="text-lg text-muted-foreground">/100</span></p></div>
                                        <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Anxiety</p><p className="text-3xl font-bold text-foreground">{studentData?.anxietyScore ?? 'N/A'}<span className="text-lg text-muted-foreground">/100</span></p></div>
                                        <div className="p-4 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Stress</p><p className="text-3xl font-bold text-foreground">{studentData?.stressScore ?? 'N/A'}<span className="text-lg text-muted-foreground">/100</span></p></div>
                                    </CardContent>
                                </Card>
                                
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

                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-2xl text-foreground flex items-center">Google Fit Data</CardTitle><CardDescription>Your activity and sleep patterns from Google Fit.</CardDescription></CardHeader>
                                    <CardContent><GoogleFit accessToken={googleAccessToken} onScoresCalculated={handleScoresCalculated}/></CardContent>
                                </Card>

                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-2xl text-foreground flex items-center">Google Classroom</CardTitle><CardDescription>View your upcoming assignments.</CardDescription></CardHeader>
                                    <CardContent><GoogleClassroom accessToken={googleAccessToken} /></CardContent>
                                </Card>

                                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                                    <CardHeader><CardTitle className="text-2xl text-foreground flex items-center"><Calendar className="w-6 h-6 mr-2 text-primary" />Weekly Journal</CardTitle><CardDescription>A private space for your thoughts and feelings.</CardDescription></CardHeader>
                                    <CardContent>{user && <Journal user={user} />}</CardContent>
                                </Card>
                            </div>
                            <aside className="space-y-6">
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
                                <Card className="border-0 shadow-card bg-gradient-calm">
                                    <CardHeader className="text-center"><Brain className="w-12 h-12 text-calm-foreground mx-auto mb-4 animate-float" /><CardTitle className="text-xl text-calm-foreground">Need Someone to Talk To?</CardTitle><CardDescription className="text-calm-foreground/80">Our AI companion is here 24/7 to listen and support you</CardDescription><Button variant="secondary" className="mt-4 bg-white/20 text-calm-foreground hover:bg-white/30" onClick={handleOpenGeneralChat}>Start Conversation</Button></CardHeader>
                                </Card>
                            </aside>
                        </div>
                    )}
                </main>
            </div>
            
            <Dialog open={isCheckinModalOpen} onOpenChange={setIsCheckinModalOpen}>
                <DialogContent className="max-w-lg p-0 border-0 bg-transparent">
                    <DialogTitle className="sr-only">Weekly Check-in Chat</DialogTitle>
                    <DialogDescription className="sr-only">A guided chat to check on your mental well-being for the week.</DialogDescription>
                    <WeeklyCheckinChat user={user} onComplete={handleCheckinComplete} />
                </DialogContent>
            </Dialog>

            {isGeneralChatOpen && (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-card rounded-2xl shadow-xl w-full h-full flex flex-col max-w-4xl max-h-[90vh]"><div className="p-3 border-b flex justify-between items-center bg-muted/50 rounded-t-2xl"><h3 className="font-bold text-lg flex items-center"><MessageCircle className="w-5 h-5 mr-2" />AI Companion</h3><Button variant="ghost" size="icon" onClick={handleCloseGeneralChat} className="rounded-full"><X className="w-5 h-5" /></Button></div><iframe src={generalChatUrl} className="w-full h-full border-0 rounded-b-2xl" title="Botpress Chat"></iframe></div></div>)}
            
            <Dialog open={isExerciseModalOpen} onOpenChange={stopExercise}>
                <DialogContent className="max-w-md text-center p-8">
                    {activeExercise && (
                        <>
                            <DialogTitle className="sr-only">{activeExercise.title}</DialogTitle>
                            <DialogDescription className="sr-only">An interactive modal for the {activeExercise.title} calming exercise.</DialogDescription>
                            <div className={`mx-auto w-24 h-24 rounded-full ${activeExercise.color} flex items-center justify-center mb-4`}>
                                {activeExercise.Icon && <activeExercise.Icon className="w-12 h-12 text-white" />}
                            </div>
                            <h2 className="text-3xl font-bold">{activeExercise.title}</h2>
                            {activeExercise.id === '5-4-3-2-1-grounding' ? (
                                <div className="my-8 text-center animate-fade-in">
                                    {GroundingIcon && <GroundingIcon className="w-16 h-16 text-primary mx-auto mb-4" />}
                                    <p className="text-2xl font-semibold">{groundingSteps[groundingStep].prompt}</p>
</div>
                            ) : (
                                <div className="my-8 flex justify-center items-center">
                                    <div className={`w-48 h-48 rounded-full border-4 border-muted flex items-center justify-center ${activeExercise.animationClass}`}>
                                        <span className="text-5xl font-bold text-foreground">{countdown}s</span>
                                    </div>
                                </div>
                            )}
                            {activeExercise.id === '5-4-3-2-1-grounding' ? (
                                <Button onClick={() => groundingStep < groundingSteps.length - 1 ? setGroundingStep(s => s + 1) : stopExercise()} className="w-full">
                                    {groundingStep < groundingSteps.length - 1 ? "Done" : "Finish"}
                                </Button>
                            ) : (
                                <Button onClick={stopExercise} variant="outline" className="w-full">Stop Exercise</Button>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
            <style>{`@keyframes breathe-478 { 0% { transform: scale(0.8); } 21% { transform: scale(1); } 58% { transform: scale(1); } 100% { transform: scale(0.8); } } .animate-478-breathing { animation: breathe-478 19s infinite ease-in-out; } .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; } .animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </>
    );
};

export default StudentDashboard;
// GoogleFit.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateBehavioralScores, BehavioralScores } from '@/lib/healthCalculations';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface GoogleFitProps {
  accessToken: string | null;
  onScoresCalculated: (scores: BehavioralScores) => void;
}

const GoogleFit = ({ accessToken, onScoresCalculated }: GoogleFitProps) => {
    const [profile, setProfile] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [sleep, setSleep] = useState<any[]>([]);
    const [heartRate, setHeartRate] = useState<any[]>([]);
    const [calories, setCalories] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // New state for manual sleep input
    const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
    const [manualSleep, setManualSleep] = useState("");
    const [avgSteps, setAvgSteps] = useState(0); // Store avg steps

    useEffect(() => {
        const fetchData = async () => {
            if (!accessToken) return;
            setIsLoading(true);
            setError(null);
            try {
                const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
                const profileResponse = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`);
                setProfile(profileResponse.data);

                const endTime = new Date();
                const startTime = new Date();
                startTime.setDate(endTime.getDate() - 7);
                const requestBodyBase = {
                    bucketByTime: { durationMillis: 86400000 },
                    startTimeMillis: startTime.getTime(),
                    endTimeMillis: endTime.getTime(),
                };
                
                // Fetch Steps
                const stepsResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }] }, { headers });
                let dailySteps: { date: string, steps: number }[] = [];
                let calculatedAvgSteps = 0;
                if (stepsResponse.data.bucket) {
                    dailySteps = stepsResponse.data.bucket.map((bucket: any) => ({ 
                        date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(), 
                        steps: bucket.dataset[0]?.point?.[0]?.value?.[0]?.intVal || 0 
                    }));
                    setSteps(dailySteps);
                    if (dailySteps.length > 0) {
                        const totalSteps = dailySteps.reduce((sum, day) => sum + day.steps, 0);
                        calculatedAvgSteps = totalSteps / dailySteps.length;
                        setAvgSteps(calculatedAvgSteps); // Store avg steps
                    }
                }

                // Fetch Sleep
                const sleepResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }] }, { headers });
                let dailySleep: { date: string, hours: number }[] = [];
                let sleepDataFound = false;
                if (sleepResponse.data.bucket) {
                    dailySleep = sleepResponse.data.bucket.map((bucket: any) => {
                        let totalSleepNanos = 0;
                        if (bucket.dataset[0]?.point?.length > 0) {
                            totalSleepNanos = bucket.dataset[0].point
                                .filter((p: any) => [1, 2, 4].includes(p.value[0].intVal)) // Light, Deep, REM
                                .reduce((total: number, point: any) => total + (point.endTimeNanos - point.startTimeNanos), 0);
                        }
                        return { 
                            date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(), 
                            hours: totalSleepNanos > 0 ? parseFloat((totalSleepNanos / 3.6e+12).toFixed(2)) : 0 
                        };
                    });
                    setSleep(dailySleep);
                    sleepDataFound = dailySleep.length > 0 && dailySleep.some(day => day.hours > 0);
                }

                // *** LOGIC FOR MANUAL INPUT ***
                if (sleepDataFound) {
                    // Happy path: Sleep data exists
                    const totalSleep = dailySleep.reduce((sum, day) => sum + day.hours, 0);
                    const avgSleepHours = totalSleep / dailySleep.length;
                    const newScores = calculateBehavioralScores(avgSleepHours, calculatedAvgSteps);
                    onScoresCalculated(newScores);
                } else {
                    // Sad path: No sleep data
                    setError("Google Fit sleep data not found. Please enter it manually.");
                    setIsSleepModalOpen(true); // Open the modal
                }

                // Fetch other data for display
                const heartResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.heart_rate.bpm' }] }, { headers });
                if (heartResponse.data.bucket) setHeartRate(heartResponse.data.bucket.map((b: any) => ({ date: new Date(parseInt(b.startTimeMillis)).toLocaleDateString(), bpm: Math.round(b.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0) })));
                
                const caloriesResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.calories.expended' }] }, { headers });
                if (caloriesResponse.data.bucket) setCalories(caloriesResponse.data.bucket.map((b: any) => ({ date: new Date(parseInt(b.startTimeMillis)).toLocaleDateString(), calories: Math.round(b.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0) })));
            } catch (err: any) {
                console.error("Google Fit API Error:", err.response ? err.response.data : err.message);
                if (err.response?.status === 401 || err.response?.status === 403) {
                     setError("Access denied. Please sign out and sign back in with Google.");
                } else {
                     setError("Could not fetch Google Fit data.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [accessToken, onScoresCalculated]);

    // Handler for the manual sleep modal
    const handleManualSleepSubmit = () => {
        const manualAvgSleepHours = parseFloat(manualSleep);
        if (isNaN(manualAvgSleepHours) || manualAvgSleepHours < 0 || manualAvgSleepHours > 24) {
            setError("Please enter a valid number of hours (e.g., 7.5).");
            return;
        }
        // Use avgSteps from state, and manual sleep from input
        const newScores = calculateBehavioralScores(manualAvgSleepHours, avgSteps);
        onScoresCalculated(newScores);
        setIsSleepModalOpen(false);
        setManualSleep("");
        setError(null); // Clear error after submission
    };

    if (!accessToken) {
        return <p className="text-center text-muted-foreground">Please sign in with Google to connect Google Fit.</p>
    }
    if (isLoading) {
        return <p className="text-center">Loading Google Fit data...</p>
    }
    // Don't show "No data" if modal is open
    if (!profile && !isLoading && !isSleepModalOpen) {
        return <p className="text-center text-muted-foreground">No Google Fit data to display.</p>
    }

    return (
        <div>
            {/* Display error message if one exists */}
            {error && !isSleepModalOpen && <p className="text-center text-red-500 mb-4">{error}</p>}

            <div className="grid md:grid-cols-2 gap-8">
                <Card><CardHeader><CardTitle>Weekly Steps</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={steps}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="steps" fill="#8884d8" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Weekly Sleep (Hours)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={sleep}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="hours" fill="#82ca9d" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Weekly Heart Rate (Avg BPM)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={heartRate}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="bpm" fill="#ffc658" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Weekly Calories Burned</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={calories}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="calories" fill="#ff8042" /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>

            {/* Manual Sleep Input Modal */}
            <Dialog open={isSleepModalOpen} onOpenChange={setIsSleepModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sleep Data Not Found</DialogTitle>
                        <DialogDescription>
                            We couldn't find any sleep data from Google Fit for the past week.
                            Please manually enter your average nightly sleep to help us calculate your scores.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sleep-hours" className="text-right">
                                Avg. Sleep
                            </Label>
                            <Input
                                id="sleep-hours"
                                type="number"
                                value={manualSleep}
                                onChange={(e) => setManualSleep(e.target.value)}
                                placeholder="e.g., 7.5"
                                className="col-span-3"
                            />
                        </div>
                        {error && <p className="text-center text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleManualSleepSubmit}>Submit Sleep Data</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GoogleFit;
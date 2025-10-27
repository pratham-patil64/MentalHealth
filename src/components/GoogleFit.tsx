import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GoogleFitProps {
  accessToken: string | null;
}

const GoogleFit = ({ accessToken }: GoogleFitProps) => {
    const [profile, setProfile] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [sleep, setSleep] = useState<any[]>([]);
    const [heartRate, setHeartRate] = useState<any[]>([]);
    const [calories, setCalories] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
                const startTimeMillis = startTime.getTime();
                const endTimeMillis = endTime.getTime();

                const requestBodyBase = {
                    bucketByTime: { durationMillis: 86400000 },
                    startTimeMillis,
                    endTimeMillis,
                };
                
                const stepsResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }] }, { headers });
                if (stepsResponse.data.bucket) {
                    setSteps(stepsResponse.data.bucket.map((bucket: any) => ({ date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(), steps: bucket.dataset[0]?.point?.[0]?.value?.[0]?.intVal || 0 })));
                }

                const sleepResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }] }, { headers });
                if (sleepResponse.data.bucket) {
                    setSleep(sleepResponse.data.bucket.map((bucket: any) => {
                        let totalSleepNanos = 0;
                        if (bucket.dataset[0]?.point?.length > 0) {
                            totalSleepNanos = bucket.dataset[0].point.reduce((total: number, point: any) => total + (point.endTimeNanos - point.startTimeNanos), 0);
                        }
                        return { date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(), hours: totalSleepNanos > 0 ? parseFloat((totalSleepNanos / 3.6e+12).toFixed(2)) : 0 };
                    }));
                }

                const heartResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.heart_rate.bpm' }] }, { headers });
                if (heartResponse.data.bucket) {
                    setHeartRate(heartResponse.data.bucket.map((bucket: any) => ({ date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(), bpm: Math.round(bucket.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0) })));
                }

                const caloriesResponse = await axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', { ...requestBodyBase, aggregateBy: [{ dataTypeName: 'com.google.calories.expended' }] }, { headers });
                if (caloriesResponse.data.bucket) {
                    setCalories(caloriesResponse.data.bucket.map((bucket: any) => ({ date: new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString(), calories: Math.round(bucket.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0) })));
                }

            } catch (err: any) {
                console.error("Google Fit API Error:", err.response ? err.response.data : err.message);
                setError("Could not fetch Google Fit data. Please sign out and sign back in with Google.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [accessToken]);

    if (!accessToken) {
        return <p className="text-center text-muted-foreground">Please sign in with Google on the login page to connect Google Fit.</p>
    }
    
    if (isLoading) {
        return <p className="text-center">Loading Google Fit data...</p>
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>
    }
    
    if (!profile) {
        return <p className="text-center text-muted-foreground">No Google Fit data to display.</p>
    }

    return (
        <div>
            <div className="grid md:grid-cols-2 gap-8">
                <Card><CardHeader><CardTitle>Weekly Steps</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={steps}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="steps" fill="#8884d8" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Weekly Sleep</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={sleep}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="hours" fill="#82ca9d" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Weekly Heart Rate (Avg BPM)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={heartRate}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="bpm" fill="#ffc658" /></BarChart></ResponsiveContainer></CardContent></Card>
                <Card><CardHeader><CardTitle>Weekly Calories Burned</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={calories}><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Bar dataKey="calories" fill="#ff8042" /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>
        </div>
    );
};

export default GoogleFit;
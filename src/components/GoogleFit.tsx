// src/components/GoogleFit.tsx

import { useState, useEffect } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GoogleFit = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [sleep, setSleep] = useState<any[]>([]);
    const [heartRate, setHeartRate] = useState<any[]>([]);
    const [calories, setCalories] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            setUser(codeResponse);
            setError(null); // Clear previous errors on new login
        },
        onError: (error) => {
            console.error('Google Login Failed:', error);
            setError('Login Failed. Please try again.');
        },
        // IMPORTANT: Added scopes for heart rate and calories
        scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.body.read',
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            setError(null);

            try {
                // 1. Fetch user profile
                const profileResponse = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                    headers: { Authorization: `Bearer ${user.access_token}`, Accept: 'application/json' },
                });
                setProfile(profileResponse.data);

                // 2. Set time range for the last 7 days
                const endTime = new Date();
                const startTime = new Date();
                startTime.setDate(endTime.getDate() - 7);
                const startTimeMillis = startTime.getTime();
                const endTimeMillis = endTime.getTime();

                const requestBodyBase = {
                    bucketByTime: { durationMillis: 86400000 }, // 1 day in milliseconds
                    startTimeMillis,
                    endTimeMillis,
                };
                
                const headers = {
                    Authorization: `Bearer ${user.access_token}`,
                    'Content-Type': 'application/json',
                };

                // 3. --- STEPS REQUEST ---
                const stepsResponse = await axios.post(
                    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
                    {
                        ...requestBodyBase,
                        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
                    },
                    { headers }
                );

                if (stepsResponse.data.bucket) {
                    const stepsData = stepsResponse.data.bucket.map((bucket: any) => {
                        const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
                        const value = bucket.dataset[0]?.point?.[0]?.value?.[0]?.intVal || 0;
                        return { date, steps: value };
                    });
                    setSteps(stepsData);
                }

                // 4. --- SLEEP REQUEST ---
                const sleepResponse = await axios.post(
                    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
                    {
                        ...requestBodyBase,
                         aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }],
                    },
                    { headers }
                );
                
                if (sleepResponse.data.bucket) {
                     const sleepData = sleepResponse.data.bucket.map((bucket: any) => {
                        const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
                        let totalSleepNanos = 0;
                        if (bucket.dataset[0]?.point?.length > 0) {
                            totalSleepNanos = bucket.dataset[0].point.reduce((total: number, point: any) => {
                                return total + (point.endTimeNanos - point.startTimeNanos);
                            }, 0);
                        }
                        const hours = totalSleepNanos > 0 ? parseFloat((totalSleepNanos / 3.6e+12).toFixed(2)) : 0;
                        return { date, hours };
                    });
                    setSleep(sleepData);
                }

                // 5. --- HEART RATE REQUEST ---
                const heartResponse = await axios.post(
                    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
                    {
                        ...requestBodyBase,
                        aggregateBy: [{ dataTypeName: 'com.google.heart_rate.bpm' }],
                    },
                    { headers }
                );

                if (heartResponse.data.bucket) {
                    const heartData = heartResponse.data.bucket.map((bucket: any) => {
                        const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
                        const value = bucket.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0;
                        return { date, bpm: Math.round(value) };
                    });
                    setHeartRate(heartData);
                }

                // 6. --- CALORIES EXPENDED REQUEST ---
                const caloriesResponse = await axios.post(
                    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
                    {
                        ...requestBodyBase,
                        aggregateBy: [{ dataTypeName: 'com.google.calories.expended' }],
                    },
                    { headers }
                );

                if (caloriesResponse.data.bucket) {
                    const caloriesData = caloriesResponse.data.bucket.map((bucket: any) => {
                        const date = new Date(parseInt(bucket.startTimeMillis)).toLocaleDateString();
                        const value = bucket.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0;
                        return { date, calories: Math.round(value) };
                    });
                    setCalories(caloriesData);
                }

            } catch (err: any) {
                if (err.response) {
                    console.error("Google Fit API Error Response:", err.response.data);
                    const errorMessage = err.response.data?.error?.message || "An unknown error occurred while fetching Google Fit data.";
                    setError(`Error: ${errorMessage}. Check console for details.`);
                } else {
                    console.error("Google Fit Request Error:", err.message);
                    setError("A network error occurred. Please check your connection.");
                }
            }
        };
        fetchData();
    }, [user]);

    const logOut = () => {
        googleLogout();
        setProfile(null);
        setUser(null);
        setSteps([]);
        setSleep([]);
        setHeartRate([]);
        setCalories([]);
        setError(null);
    };

    return (
        <div>
            {profile ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Google Fit Data for {profile.name}</h2>
                        <Button onClick={logOut}>Log out</Button>
                    </div>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Steps</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={steps}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="steps" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Sleep</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={sleep}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="hours" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Heart Rate (Avg BPM)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={heartRate}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="bpm" fill="#ffc658" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Calories Burned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={calories}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="calories" fill="#ff8042" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Connect to Google Fit</h2>
                    <p className="text-muted-foreground mb-6">Connect your Google Fit account to get insights into your activity and sleep patterns.</p>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <Button onClick={() => login()}>Sign in with Google</Button>
                </div>
            )}
        </div>
    );
};

export default GoogleFit;
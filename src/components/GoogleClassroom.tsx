import { useState, useEffect } from 'react';
import axios from 'axios';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GoogleClassroomProps {
  accessToken: string | null;
}

const GoogleClassroom = ({ accessToken }: GoogleClassroomProps) => {
    const [courses, setCourses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any>({});
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchClassroomData = async () => {
            if (!accessToken) return;

            setIsLoading(true);
            setError(null);

            try {
                const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };

                const coursesResponse = await axios.get('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', { headers });
                const studentCourses = coursesResponse.data.courses || [];
                setCourses(studentCourses);

                if (studentCourses.length > 0) {
                    const assignmentsPromises = studentCourses.map(async (course: any) => {
                        const courseworkResponse = await axios.get(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, { headers });
                        return { courseId: course.id, assignments: courseworkResponse.data.courseWork || [] };
                    });
                    const assignmentsResults = await Promise.all(assignmentsPromises);
                    const assignmentsByCourse = assignmentsResults.reduce((acc: any, result) => {
                        acc[result.courseId] = result.assignments.filter((a: any) => a.dueDate);
                        return acc;
                    }, {});
                    setAssignments(assignmentsByCourse);
                }
            } catch (err: any) {
                console.error("Google Classroom API Error:", err.response ? err.response.data : err.message);
                setError("Could not fetch Classroom data. Please sign out and sign back in with Google.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassroomData();
    }, [accessToken]);

    const formatDate = (date: any) => {
        if (!date) return 'No due date';
        return new Date(date.year, date.month - 1, date.day).toLocaleDateString();
    }

    if (!accessToken) {
        return <p className="text-center text-muted-foreground">Please sign in with Google on the login page to connect Classroom.</p>;
    }

    if (isLoading) {
        return <p className="text-center">Loading Google Classroom data...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>
    }

    if (courses.length === 0) {
        return <p className="text-center text-muted-foreground">No active Google Classroom courses found.</p>
    }

    return (
        <div>
            <Accordion type="single" collapsible className="w-full">
                {courses.map(course => (
                    <AccordionItem value={course.id} key={course.id}>
                        <AccordionTrigger>{course.name}</AccordionTrigger>
                        <AccordionContent>
                            {assignments[course.id] && assignments[course.id].length > 0 ? (
                                <ul className="space-y-2">
                                    {assignments[course.id].map((assignment: any) => (
                                        <li key={assignment.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                                            <a href={assignment.alternateLink} target="_blank" rel="noopener noreferrer" className="hover:underline">{assignment.title}</a>
                                            <span className="text-sm text-muted-foreground">Due: {formatDate(assignment.dueDate)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground">No upcoming assignments in this course.</p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default GoogleClassroom;
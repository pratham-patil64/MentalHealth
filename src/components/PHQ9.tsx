import { useState } from "react";
import { db } from "@/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface PHQ9Props {
  user: User;
  onComplete: () => void;
}

const questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way",
];

const options = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

const PHQ9 = ({ user, onComplete }: PHQ9Props) => {
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(-1));
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAnswerChange = (questionIndex: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = parseInt(value, 10);
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (answers.includes(-1)) {
      toast({
        title: "Incomplete Form",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const score = answers.reduce((total, answer) => total + answer, 0);
    let mentalHealthStatus = "positive";
    if (score >= 10) {
        mentalHealthStatus = "negative";
    } else if (score >= 5) {
        mentalHealthStatus = "neutral";
    }

    // Check for self-harm thoughts (last question)
    const needsHelp = answers[8] > 0;

    try {
      const studentDocRef = doc(db, "students", user.uid);
      await setDoc(
        studentDocRef,
        {
          phq9Score: score,
          lastPhq9Date: Timestamp.now(),
          mentalHealthStatus,
          needsHelp,
        },
        { merge: true }
      );

      toast({
        title: "Thank You!",
        description: "Your weekly check-in has been submitted.",
      });

      onComplete();
    } catch (error) {
      console.error("Error submitting PHQ-9:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
      {questions.map((question, index) => (
        <div key={index} className="space-y-3 pb-4 border-b last:border-b-0">
          <Label className="font-semibold text-foreground text-base">
            {index + 1}. {question}
          </Label>
          <RadioGroup
            onValueChange={(value) => handleAnswerChange(index, value)}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2"
          >
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value.toString()} id={`q${index}-o${option.value}`} />
                <Label htmlFor={`q${index}-o${option.value}`} className="font-normal cursor-pointer">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
      <div className="pt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Answers"}
          </Button>
      </div>
    </form>
  );
};

export default PHQ9;
// src/components/WeeklyCheckinChat.tsx

import { useState, useEffect, useRef } from "react";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Bot, User as UserIcon } from "lucide-react";

interface WeeklyCheckinChatProps {
  user: User;
  onComplete: () => void;
}

const allQuestions = [
  // Stress Questions (DASS-21 inspired)
  { category: 'stress', text: "Over the last week, how often have you found it hard to wind down?" },
  { category: 'stress', text: "Over the last week, how often have you been easily annoyed or irritable?" },
  { category: 'stress', text: "Over the last week, how often have you felt nervous, anxious or on edge?" },
  // Anxiety Questions (GAD-7 inspired)
  { category: 'anxiety', text: "Over the last week, how often have you been unable to stop or control worrying?" },
  { category: 'anxiety', text: "Over the last week, how often have you been worrying too much about different things?" },
  { category: 'anxiety', text: "Over the last week, how often have you had trouble relaxing?" },
  { category: 'anxiety', text: "Over the last week, how often have you felt afraid as if something awful might happen?" },
  // Depression Questions (PHQ-9 inspired)
  { category: 'depression', text: "Over the last week, how often have you had little interest or pleasure in doing things?" },
  { category: 'depression', text: "Over the last week, how often have you been feeling down, depressed, or hopeless?" },
  { category: 'depression', text: "Over the last week, how often have you had trouble falling or staying asleep, or sleeping too much?" },
  { category: 'depression', text: "Over the last week, how often have you been feeling tired or having little energy?" },
  { category: 'depression', text: "Over the last week, how often have you been feeling bad about yourself—or that you are a failure or have let yourself or your family down?" },
];

// Standard 0-3 scoring options
const answerOptions = [
    { text: "Not at all", score: 0 },
    { text: "Several days", score: 1 },
    { text: "More than half the days", score: 2 },
    { text: "Nearly every day", score: 3 },
];

const WeeklyCheckinChat = ({ user, onComplete }: WeeklyCheckinChatProps) => {
  const [conversation, setConversation] = useState<{ sender: 'bot' | 'user'; text: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // State now holds numbers instead of booleans
  const [answers, setAnswers] = useState<Record<string, number[]>>({
    stress: [],
    anxiety: [],
    depression: [],
  });
  const [isAnswering, setIsAnswering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (conversation.length === 0) {
      addMessage("bot", "Hi! Let's start your weekly check-in by answering a few questions.");
      setTimeout(() => askNextQuestion(), 1000);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    if (conversation.length > 1 && currentQuestionIndex > 0) {
      const timer = setTimeout(() => {
        askNextQuestion();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex]);


  const addMessage = (sender: 'bot' | 'user', text: string) => {
    setConversation(prev => [...prev, { sender, text }]);
  };

  const askNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length) {
      addMessage("bot", allQuestions[currentQuestionIndex].text);
      setIsAnswering(true);
    } else {
      addMessage("bot", "That's all for this week. Thank you for sharing!");
      saveResults(answers);
    }
  };

  // Function now accepts the score (number) and the answer text (string)
  const handleAnswer = (score: number, text: string) => {
    if (currentQuestionIndex >= allQuestions.length) {
      return;
    }

    addMessage("user", text); // Display the chosen text in the chat
    setIsAnswering(false);
    
    const currentQuestion = allQuestions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.category]: [...prev[currentQuestion.category], score], // Store the score
    }));

    setCurrentQuestionIndex(prev => prev + 1);
  };

  const saveResults = async (finalAnswers: typeof answers) => {
    setIsLoading(true);
    try {
      // New Scoring: Sum the scores for each category instead of counting 'true' values.
      const stressScore = finalAnswers.stress.reduce((sum, current) => sum + current, 0);
      const anxietyScore = finalAnswers.anxiety.reduce((sum, current) => sum + current, 0);
      const depressionScore = finalAnswers.depression.reduce((sum, current) => sum + current, 0);

      await addDoc(collection(db, "weeklyChats"), {
        studentUid: user.uid,
        chatDate: Timestamp.now(),
        weekOfMonth: Math.ceil(new Date().getDate() / 7),
        stressResponses: finalAnswers.stress,
        anxietyResponses: finalAnswers.anxiety,
        depressionResponses: finalAnswers.depression,
        scores: {
          stress: stressScore,
          anxiety: anxietyScore,
          depression: depressionScore,
        },
      });

      const studentDocRef = doc(db, "students", user.uid);
      await updateDoc(studentDocRef, {
        stressScore,
        anxietyScore,
        depressionScore,
      });

      toast({
        title: "Check-in complete!",
        description: "Your responses have been saved.",
      });

      setTimeout(onComplete, 1500);
    } catch (error) {
      console.error("Error saving chat results:", error);
      toast({
        title: "Error",
        description: "Could not save your responses. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] bg-background rounded-lg shadow-lg">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-muted/50 rounded-t-lg">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'bot' && <Bot className="w-8 h-8 p-1.5 bg-primary text-primary-foreground rounded-full" />}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.sender === 'bot' 
                ? 'bg-card border rounded-tl-none' 
                : 'bg-primary text-primary-foreground rounded-br-none'
            }`}>
              <p>{msg.text}</p>
            </div>
            {msg.sender === 'user' && <UserIcon className="w-8 h-8 p-1.5 bg-muted text-foreground rounded-full" />}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t bg-card rounded-b-lg">
        {isAnswering ? (
          // New UI: Display four buttons for the 0-3 scale
          <div className="grid grid-cols-2 gap-3">
            {answerOptions.map((option) => (
              <Button 
                key={option.score} 
                onClick={() => handleAnswer(option.score, option.text)} 
                variant="outline"
                size="lg"
                className="h-auto py-3"
              >
                {option.text}
              </Button>
            ))}
          </div>
        ) : (
          <Button disabled className="w-full">
            {isLoading ? "Saving..." : "Please wait..."}
          </Button>
        )}
      </div>
    </div>
  );
};

export default WeeklyCheckinChat;
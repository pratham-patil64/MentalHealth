// src/components/WeeklyCheckinChat.tsx

import { useState, useEffect, useRef } from "react";
import { db } from "@/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Bot, User as UserIcon } from "lucide-react";

interface WeeklyCheckinChatProps {
  user: User;
  onComplete: () => void;
}

const allQuestions = [
  // Anxiety Questions
  { category: 'anxiety', text: "Over the last week, have you felt nervous, anxious or on edge due to academic pressure?" },
  { category: 'anxiety', text: "Have you been unable to stop worrying about your academic affairs?" },
  { category: 'anxiety', text: "Have you been easily annoyed or irritated because of academic pressure?" },
  { category: 'anxiety', text: "Have you worried too much about academic affairs?" },
  { category: 'anxiety', text: "Have you felt afraid, as if something awful might happen?" },
  // Depression Questions
  { category: 'depression', text: "Have you had little interest or pleasure in doing things?" },
  { category: 'depression', text: "Have you been feeling down, depressed or hopeless?" },
  { category: 'depression', text: "Have you had a poor appetite or been overeating?" },
  { category: 'depression', text: "Have you been feeling bad about yourself—or that you are a failure or have let yourself or your family down?" },
  { category: 'depression', text: "Have you been having trouble concentrating on things, such as reading books or watching television?" },
  { category: 'depression', text: "Have you had thoughts that you would be better off dead, or of hurting yourself?" },
  // Stress Questions
  { category: 'stress', text: "Have you felt upset due to something that happened in your academic affairs?" },
  { category: 'stress', text: "Have you been able to control irritations in your academic / university affairs?" },
];

const WeeklyCheckinChat = ({ user, onComplete }: WeeklyCheckinChatProps) => {
  const [conversation, setConversation] = useState<{ sender: 'bot' | 'user'; text: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ anxiety: boolean[], depression: boolean[], stress: boolean[] }>({ anxiety: [], depression: [], stress: [] });
  const [isAnswering, setIsAnswering] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting from the bot
  useEffect(() => {
    setConversation([{ sender: 'bot', text: "Hello! It's time for our weekly check-in. I'm here to listen without judgment. I'll ask a few simple 'Yes' or 'No' questions." }]);
    setTimeout(() => {
        setConversation(prev => [...prev, { sender: 'bot', text: allQuestions[0].text }]);
    }, 1500);
  }, []);
  
  // Scroll to bottom of chat on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const saveResults = async (finalAnswers: typeof answers) => {
    setIsLoading(true);
    try {
      await addDoc(collection(db, "weeklyChats"), {
        studentUid: user.uid,
        chatDate: Timestamp.now(),
        weekOfMonth: Math.ceil(new Date().getDate() / 7),
        anxietyResponses: finalAnswers.anxiety,
        depressionResponses: finalAnswers.depression,
        stressResponses: finalAnswers.stress,
      });
      toast({ title: "Check-in complete!", description: "Thank you for sharing. Your responses have been saved." });
      setTimeout(onComplete, 1500);
    } catch (error) {
      console.error("Error saving chat results:", error);
      toast({ title: "Error", description: "Could not save your responses. Please try again.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: boolean) => {
    if (!isAnswering) return;

    // 1. Show user's answer
    setConversation(prev => [...prev, { sender: 'user', text: answer ? 'Yes' : 'No' }]);
    setIsAnswering(false);

    // 2. Store the answer internally
    const currentQuestion = allQuestions[currentQuestionIndex];
    const updatedAnswers = { ...answers };
    updatedAnswers[currentQuestion.category as keyof typeof answers].push(answer);
    setAnswers(updatedAnswers);

    // 3. Empathetic bot response & next question
    setTimeout(() => {
      setConversation(prev => [...prev, { sender: 'bot', text: "Thank you for sharing." }]);

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < allQuestions.length) {
        setTimeout(() => {
          setCurrentQuestionIndex(nextIndex);
          setConversation(prev => [...prev, { sender: 'bot', text: allQuestions[nextIndex].text }]);
          setIsAnswering(true);
        }, 1200);
      } else {
        // End of chat
        setTimeout(() => {
          setConversation(prev => [...prev, { sender: 'bot', text: "That's all for this week. Thank you for taking the time to check in with yourself." }]);
          saveResults(updatedAnswers);
        }, 1200);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col h-[70vh]">
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
          <div className="flex justify-center gap-4">
            <Button onClick={() => handleAnswer(true)} size="lg" className="w-1/2 bg-green-600 hover:bg-green-700">Yes</Button>
            <Button onClick={() => handleAnswer(false)} size="lg" className="w-1/2 bg-red-600 hover:bg-red-700">No</Button>
          </div>
        ) : (
          <p className="text-center text-muted-foreground animate-pulse">{isLoading ? "Saving..." : "Thinking..."}</p>
        )}
      </div>
    </div>
  );
};

export default WeeklyCheckinChat;
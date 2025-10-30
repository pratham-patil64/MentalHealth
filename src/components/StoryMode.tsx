import React, { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Student } from './StudentDashboard';

interface StoryModeProps {
  user: User;
  studentData: Student | null;
  onStoryComplete: () => void;
}

// --- STORY CONTENT FOR THE WEEK ---
const weeklyStory = [
  {
    level: 1,
    title: "The Test",
    scenario: "You wake up with a jolt. Today's the day of the big physics test you've been dreading. You studied, but you're still not confident. Your stomach is in knots.",
    image: "/src/assets/story-images/level1.png",
    choices: [
      {
        text: "Skip breakfast to cram in one last review session.",
        scores: { stress: 2, anxiety: 3, depression: 0 },
        consequence: "The last-minute cramming just makes you feel more confused, and your stomach growls through the entire test, breaking your concentration."
      },
      {
        text: "Eat a healthy breakfast and trust that you've prepared enough.",
        scores: { stress: -2, anxiety: -2, depression: 0 },
        consequence: "Having some food helps calm your nerves. You walk into the test feeling more grounded and ready to focus."
      },
      {
        text: "Vent your anxiety to a friend on the way to school.",
        scores: { stress: -1, anxiety: -1, depression: 0 },
        consequence: "Your friend reassures you that everyone's nervous. Sharing the feeling makes it seem less intimidating, and you feel supported."
      }
    ]
  },
  {
    level: 2,
    title: "Group Project Conflict",
    scenario: "You're in a group project and one member, Alex, isn't pulling their weight. The deadline is this Friday and their section is still completely empty.",
    image: "/src/assets/story-images/level2.png",
    choices: [
        {
            text: "Do Alex's work for them. It's easier than confronting them.",
            scores: { stress: 3, anxiety: 1, depression: 2 },
            consequence: "You're resentful and exhausted from the extra work. Alex doesn't learn anything, and your grade might still suffer from the rushed quality."
        },
        {
            text: "Talk to Alex privately and ask if everything is okay.",
            scores: { stress: -1, anxiety: -1, depression: -1 },
            consequence: "Alex confides they've been struggling with family issues and were afraid to ask for help. You work out a plan together to get the work done."
        },
        {
            text: "Complain about Alex to the other group members.",
            scores: { stress: 1, anxiety: 2, depression: 1 },
            consequence: "The group dynamic becomes tense and awkward. The project gets done, but there's a lot of resentment and bad feelings."
        }
    ]
  },
  {
    level: 3,
    title: "The Party Invitation",
    scenario: "You get invited to a popular classmate's party on Saturday night. You're excited but also nervous. You don't know many people who will be there.",
    image: "/src/assets/story-images/level3.png",
    choices: [
        {
            text: "Decide not to go. It's too much social pressure.",
            scores: { stress: 0, anxiety: -1, depression: 2 },
            consequence: "You feel relieved at first, but seeing everyone's fun posts on Sunday makes you feel lonely and isolated."
        },
        {
            text: "Go, but stick to your phone in the corner.",
            scores: { stress: 1, anxiety: 2, depression: 1 },
            consequence: "You feel awkward and invisible. Being physically present but mentally absent makes the anxiety worse than staying home."
        },
        {
            text: "Ask a close friend to go with you for support.",
            scores: { stress: -1, anxiety: -2, depression: -1 },
            consequence: "Having a friend by your side gives you the confidence to mingle. You end up meeting a few new people and have a decent time."
        }
    ]
  },
  {
    level: 4,
    title: "A Disappointing Grade",
    scenario: "You get back an essay you worked really hard on, and the grade is much lower than you expected. You feel a wave of disappointment and frustration.",
    image: "/src/assets/story-images/level4.png",
    choices: [
        {
            text: "Shove the essay in your bag and try to forget about it.",
            scores: { stress: 1, anxiety: 1, depression: 2 },
            consequence: "The bad feeling lingers. You've learned nothing from the feedback and feel like a failure, which impacts your motivation for other classes."
        },
        {
            text: "Read the teacher's comments and ask to discuss it with them.",
            scores: { stress: -2, anxiety: -1, depression: -1 },
            consequence: "The teacher clarifies their feedback and offers you a chance to revise a section for extra credit. You feel empowered and understand the material better."
        },
        {
            text: "Assume the teacher is unfair and complain about them.",
            scores: { stress: 2, anxiety: 0, depression: 1 },
            consequence: "You feel momentarily justified, but it doesn't change your grade or help you improve. You develop a negative attitude towards the class."
        }
    ]
  },
  {
    level: 5,
    title: "Feeling Overwhelmed",
    scenario: "It's been a long week. You have homework, chores, and you promised to help your friend with their project. You feel like you have no time for yourself.",
    image: "/src/assets/story-images/level5.png",
    choices: [
        {
            text: "Pull an all-nighter to get everything done.",
            scores: { stress: 4, anxiety: 2, depression: 1 },
            consequence: "You're completely drained the next day. Your work is sloppy, and you're irritable with everyone. You feel burned out."
        },
        {
            text: "Prioritize the most important tasks and let some things go.",
            scores: { stress: -3, anxiety: -1, depression: 0 },
            consequence: "It feels weird not doing everything, but you finish your most critical homework and get some rest. You realize the world didn't end."
        },
        {
            text: "Cancel on your friend to make time for yourself.",
            scores: { stress: -1, anxiety: 1, depression: 0 },
            consequence: "You feel guilty, but taking an evening to just relax and recharge helps you tackle your other tasks more effectively later."
        }
    ]
  },
  {
    level: 6,
    title: "An Argument at Home",
    scenario: "You have a disagreement with your parents about your curfew. Voices are raised, and you end up storming off to your room, feeling angry and misunderstood.",
    image: "/src/assets/story-images/level6.png",
    choices: [
        {
            text: "Slam the door and blast music to drown everything out.",
            scores: { stress: 1, anxiety: 0, depression: 1 },
            consequence: "It provides a temporary escape, but the anger and resentment remain. The issue is unresolved and likely to come up again."
        },
        {
            text: "Write down your feelings in a journal to process them.",
            scores: { stress: -2, anxiety: -1, depression: 0 },
            consequence: "Organizing your thoughts on paper helps you understand your own perspective better and calms you down significantly."
        },
        {
            text: "Wait an hour, then go back and calmly explain your point of view.",
            scores: { stress: -1, anxiety: -2, depression: -1 },
            consequence: "After cooling off, the conversation is much more productive. Your parents listen, and you work towards a compromise you can all live with."
        }
    ]
  },
  {
    level: 7,
    title: "Social Media Envy",
    scenario: "You're scrolling through Instagram and see photos of a group of classmates on a fun trip that you weren't invited to. A sharp pang of envy and loneliness hits you.",
    image: "/src/assets/story-images/level7.png",
    choices: [
        {
            text: "Keep scrolling, comparing your life to theirs.",
            scores: { stress: 1, anxiety: 2, depression: 3 },
            consequence: "You fall into a rabbit hole of comparison, feeling worse with every post. Your self-esteem takes a serious hit."
        },
        {
            text: "Close the app and do something you enjoy, like reading or drawing.",
            scores: { stress: -2, anxiety: -2, depression: -1 },
            consequence: "By shifting your focus to a fulfilling activity, you reclaim your time and mood. You remember that social media is just a highlight reel."
        },
        {
            text: "Reach out to a different friend and make plans to hang out.",
            scores: { stress: -1, anxiety: -1, depression: -2 },
            consequence: "Making a real-life connection reminds you that you have your own friends and life. The feeling of FOMO fades as you enjoy their company."
        }
    ]
  },
  {
    level: 8,
    title: "A Friend in Need",
    scenario: "Your best friend seems really down lately. They've been quiet and canceling plans. You're worried about them, but you don't know what to say.",
    image: "/src/assets/story-images/level8.png",
    choices: [
        {
            text: "Avoid them, assuming they want to be left alone.",
            scores: { stress: 0, anxiety: 1, depression: 1 },
            consequence: "Your friend feels even more isolated, thinking nobody cares. The distance between you grows."
        },
        {
            text: "Send a simple text: 'Hey, thinking of you. No pressure to reply.'",
            scores: { stress: -1, anxiety: -1, depression: -1 },
            consequence: "Your friend feels a glimmer of support without the pressure of a full conversation. It opens the door for them to talk when they're ready."
        },
        {
            text: "Insist they tell you what's wrong right now.",
            scores: { stress: 1, anxiety: 1, depression: 0 },
            consequence: "The pressure makes your friend shut down even more. They're not ready to talk, and your insistence feels like an interrogation."
        }
    ]
  },
  {
    level: 9,
    title: "Future Worries",
    scenario: "Lately, you've been feeling intense pressure about the future—college, careers, what you're supposed to do with your life. It feels paralyzing.",
    image: "/src/assets/story-images/level9.png",
    choices: [
        {
            text: "Spend hours researching every possible career, getting more overwhelmed.",
            scores: { stress: 2, anxiety: 3, depression: 1 },
            consequence: "Information overload sets in. Instead of clarity, you feel more lost and anxious than ever before."
        },
        {
            text: "Talk to a school counselor or a trusted adult about your fears.",
            scores: { stress: -2, anxiety: -2, depression: -1 },
            consequence: "They help you break it down into smaller, manageable steps and reassure you that it's normal to feel this way. The future feels less terrifying."
        },
        {
            text: "Ignore it and distract yourself with video games or TV shows.",
            scores: { stress: 0, anxiety: 1, depression: 2 },
            consequence: "The distraction works for a while, but the anxiety comes rushing back whenever you're alone with your thoughts."
        }
    ]
  },
  {
    level: 10,
    title: "A Moment of Kindness",
    scenario: "You see a new student sitting alone at lunch, looking nervous. Part of you wants to invite them over, but you're worried it might be awkward.",
    image: "/src/assets/story-images/level10.png",
    choices: [
        {
            text: "Decide against it. It's not your responsibility.",
            scores: { stress: 0, anxiety: 0, depression: 1 },
            consequence: "You avoid the potential awkwardness, but you also miss an opportunity to make someone's day and possibly make a new friend."
        },
        {
            text: "Give them a small, friendly smile as you walk by.",
            scores: { stress: -1, anxiety: -1, depression: -1 },
            consequence: "It's a small gesture, but the student's face lights up. You feel a warm sense of connection and kindness."
        },
        {
            text: "Walk over and say, 'Hey, do you want to come sit with us?'",
            scores: { stress: 0, anxiety: -2, depression: -2 },
            consequence: "It's a little awkward for a minute, but they are incredibly grateful. You end up having a great conversation and feel good for making a positive impact."
        }
    ]
  }
];

const StoryMode = ({ user, studentData, onStoryComplete }: StoryModeProps) => {
    const [gameState, setGameState] = useState<'loading' | 'playing' | 'finished'>('loading');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [showConsequence, setShowConsequence] = useState<string | null>(null);

    useEffect(() => {
        const fetchStoryProgress = async () => {
            if (!user) return;
            setGameState('loading');
            try {
                const storyDocRef = doc(db, "students", user.uid, "storyModes", "weeklyStory");
                const docSnap = await getDoc(storyDocRef);
                const today = new Date().setHours(0, 0, 0, 0);

                if (docSnap.exists() && docSnap.data().lastPlayed?.toDate().setHours(0, 0, 0, 0) === today) {
                    setGameState('finished');
                } else {
                    setCurrentLevel(1);
                    setGameState('playing');
                }
            } catch (error) {
                console.error("Error fetching story progress:", error);
                setCurrentLevel(1);
                setGameState('playing');
            }
        };

        fetchStoryProgress();
    }, [user]);

    const handleChoice = async (choice: any) => {
        if (!studentData || showConsequence) return;

        setShowConsequence(choice.consequence);

        const newScores = {
            stress: (studentData.stressScore || 0) + choice.scores.stress,
            anxiety: (studentData.anxietyScore || 0) + choice.scores.anxiety,
            depression: (studentData.depressionScore || 0) + choice.scores.depression,
        };

        newScores.stress = Math.max(0, Math.min(100, newScores.stress));
        newScores.anxiety = Math.max(0, Math.min(100, newScores.anxiety));
        newScores.depression = Math.max(0, Math.min(100, newScores.depression));

        const studentDocRef = doc(db, "students", user.uid);
        await setDoc(studentDocRef, { scores: newScores }, { merge: true });

        const nextLevel = currentLevel + 1;

        setTimeout(async () => {
            setShowConsequence(null);
            if (nextLevel > weeklyStory.length) {
                const storyDocRef = doc(db, "students", user.uid, "storyModes", "weeklyStory");
                await setDoc(storyDocRef, { lastPlayed: Timestamp.now(), completed: true });
                setGameState('finished');
            } else {
                setCurrentLevel(nextLevel);
            }
        }, 4500);
    };

    if (gameState === 'loading') {
        return <div className="flex items-center justify-center p-8 min-h-[450px]"><p>Loading your story...</p></div>;
    }

    if (gameState === 'finished') {
        return (
            <Card className="text-center p-8 border-0 shadow-card bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Great Job!</CardTitle>
                    <CardDescription className="text-lg mt-2">You've completed this week's story scenarios. Your choices help you learn and grow.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={onStoryComplete} size="lg">Back to Dashboard</Button>
                </CardContent>
            </Card>
        );
    }
    
    const currentStoryPart = weeklyStory.find(s => s.level === currentLevel);

    return (
        <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm overflow-hidden min-h-[500px] flex flex-col">
            {showConsequence ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <p className="text-xl text-muted-foreground animate-fade-in">{showConsequence}</p>
                </div>
            ) : currentStoryPart ? (
                <>
                    <img src={currentStoryPart.image} alt={currentStoryPart.title} className="w-full h-48 object-cover bg-muted" onError={(e) => e.currentTarget.style.display='none'}/>
                    <CardHeader className="p-8">
                        <CardTitle className="text-3xl text-foreground mb-2">{currentStoryPart.title}</CardTitle>
                        <CardDescription className="text-lg leading-relaxed">{currentStoryPart.scenario}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-end">
                        <div className="space-y-4">
                            {currentStoryPart.choices.map((choice, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="lg"
                                    className="w-full justify-start text-left h-auto py-4 transition-all hover:bg-primary/10 hover:border-primary"
                                    onClick={() => handleChoice(choice)}
                                >
                                    {choice.text}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </>
            ) : (
                 <Card className="text-center p-8 border-0 shadow-card bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Story Complete!</CardTitle>
                        <CardDescription className="text-lg mt-2">You've navigated the challenges of the week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={onStoryComplete} size="lg">Return to Dashboard</Button>
                    </CardContent>
                </Card>
            )}
        </Card>
    );
};

export default StoryMode;
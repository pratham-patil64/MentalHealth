import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Heart, Star } from 'lucide-react';

interface MindCareGameProps {
  onClose: () => void;
}

const quizData = [
  {
    age: 10,
    situation: "Your friend didn't invite you to their birthday party.",
    image: "age-10.png",
    choices: [
      { text: "Stay home and play games", score: 2, insight: "You distract yourself, showing self-comfort.", emoji: "🎮" },
      { text: "Confront your friend", score: 5, insight: "You communicate openly, healthy assertiveness.", emoji: "💬" },
      { text: "Ignore it completely", score: -3, insight: "Bottling emotions may hurt later.", emoji: "😶" },
    ],
    mentalHealthInsight: "Learning emotional communication early improves self-esteem."
  },
  {
    age: 11,
    situation: "Your parents buy you a new bicycle!",
    image: "age-11.png",
    choices: [
      { text: "Ride it every day", score: 5, insight: "Promotes exercise and joy.", emoji: "🌟" },
      { text: "Sell it to save money", score: 0, insight: "Practical but no emotional reward.", emoji: "💰" },
      { text: "Leave it unused", score: -4, insight: "Missed opportunity for happiness.", emoji: "😐" },
    ],
    mentalHealthInsight: "Physical activity builds resilience and positive mood."
  },
  {
    age: 12,
    situation: "A bully teases you at school.",
    image: "age-12.png",
    choices: [
      { text: "Stand up to the bully", score: 6, insight: "Confidence and boundary-setting.", emoji: "💪" },
      { text: "Ignore them", score: 2, insight: "Emotional control, but no resolution.", emoji: "🙈" },
      { text: "Avoid school", score: -6, insight: "Fear avoidance hurts confidence.", emoji: "😰" },
    ],
    mentalHealthInsight: "Facing fear and seeking help strengthens mental toughness."
  },
  {
    age: 13,
    situation: "You get a chance to join a school sports team.",
    image: "age-13.png",
    choices: [
      { text: "Join the team", score: 6, insight: "Builds teamwork and self-worth.", emoji: "🏆" },
      { text: "Focus on studies", score: 2, insight: "Balance matters, but social loss possible.", emoji: "📚" },
      { text: "Say no (too shy)", score: -4, insight: "Missed growth opportunity.", emoji: "😔" },
    ],
    mentalHealthInsight: "Involvement in group activities lowers stress and boosts happiness."
  },
  {
    age: 14,
    situation: "You find a stray puppy on your way home.",
    image: "age-14.png",
    choices: [
      { text: "Adopt it", score: 5, insight: "Empathy and responsibility grow.", emoji: "❤️" },
      { text: "Take it to shelter", score: 3, insight: "Good deed, practical.", emoji: "🏠" },
      { text: "Ignore it", score: -2, insight: "Missed compassion moment.", emoji: "😕" },
    ],
    mentalHealthInsight: "Caring for others improves emotional wellbeing."
  },
  {
    age: 15,
    situation: "Exams are near, but your friends invite you to a party.",
    image: "age-15.png",
    choices: [
      { text: "Go to the party", score: 2, insight: "Social release is healthy, balance is key.", emoji: "🥳" },
      { text: "Stay home and study", score: 4, insight: "Good self-discipline.", emoji: "✏️" },
      { text: "Panic and skip both", score: -5, insight: "Poor stress management.", emoji: "😱" },
    ],
    mentalHealthInsight: "Balance between relaxation and responsibility is vital."
  },
  {
    age: 16,
    situation: "You get your first part-time job offer.",
    image: "age-16.png",
    choices: [
      { text: "Take the job", score: 5, insight: "Boosts confidence and independence.", emoji: "🌟" },
      { text: "Focus on school", score: 2, insight: "Stability, but slower growth.", emoji: "🎓" },
      { text: "Reject (fear of failure)", score: -3, insight: "Anxiety avoidance reduces self-belief.", emoji: "😬" },
    ],
    mentalHealthInsight: "Taking small challenges boosts resilience and identity."
  },
  {
    age: 17,
    situation: "You fail your driving test.",
    image: "age-17.png",
    choices: [
      { text: "Try again", score: 5, insight: "Resilience and optimism.", emoji: "💪" },
      { text: "Give up for now", score: -1, insight: "Acceptable but lowers momentum.", emoji: "😞" },
      { text: "Blame the examiner", score: -4, insight: "Poor emotional control.", emoji: "😠" },
    ],
    mentalHealthInsight: "Growth mindset keeps self-esteem stable during setbacks."
  },
  {
    age: 18,
    situation: "You finish school and get into college.",
    image: "age-18.png",
    choices: [
      { text: "Choose nearby college", score: 3, insight: "Comfort zone, moderate happiness.", emoji: "🏡" },
      { text: "Go to a far city", score: 6, insight: "Adventure and self-growth.", emoji: "✈️" },
      { text: "Skip college for now", score: -5, insight: "Possible regret, isolation.", emoji: "😔" },
    ],
    mentalHealthInsight: "Autonomy and new experiences enrich mental development."
  },
  {
    age: 19,
    situation: "Your friends plan a trip abroad.",
    image: "age-19.png",
    choices: [
      { text: "Go on the trip", score: 5, insight: "Social connection, new experiences.", emoji: "🎒" },
      { text: "Save the money", score: 2, insight: "Smart planning, balanced mindset.", emoji: "🏦" },
      { text: "Refuse (anxiety)", score: -4, insight: "Fear limits joy and confidence.", emoji: "😰" },
    ],
    mentalHealthInsight: "Balanced risk-taking builds confidence and happiness."
  },
  {
    age: 20,
    situation: "Choose between your passion and a stable career.",
    image: "age-20.png",
    choices: [
      { text: "Follow your passion", score: 6, insight: "Long-term happiness and fulfillment.", emoji: "🌈" },
      { text: "Take the stable job", score: 3, insight: "Security, but moderate satisfaction.", emoji: "💼" },
      { text: "Choose by others' opinions", score: -5, insight: "Loss of autonomy affects mental health.", emoji: "😟" },
    ],
    mentalHealthInsight: "Self-driven choices create purpose and life satisfaction."
  }
];

const MindCareGame = ({ onClose }: MindCareGameProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showInsight, setShowInsight] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const handleAnswer = (choiceScore: number, index: number) => {
    setScore(s => s + choiceScore);
    setShowInsight(index);

    setTimeout(() => {
      setShowInsight(null);
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        setGameOver(true);
      }
    }, 2500);
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
    setShowInsight(null);
  };

  const currentQuestion = quizData[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;

  const imagePath = new URL(`../assets/game-images/${currentQuestion.image}`, import.meta.url).href;

  return (
    <div className="w-full max-w-md mx-auto h-screen max-h-[800px] bg-gradient-to-b from-sky-400 to-green-300 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Close Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose} 
        className="absolute top-3 right-3 z-30 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg"
      >
        <X className="w-5 h-5" />
      </Button>

      {!gameOver ? (
        <div className="relative h-full flex flex-col">
          {/* Top Status Bar */}
          <div className="relative z-20 px-4 pt-3 pb-2 bg-gradient-to-b from-purple-600 to-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-pink-400 text-pink-400" />
                <span className="text-white font-bold text-lg">MindCare Life</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-400 rounded-full px-3 py-1 shadow-md">
                <Star className="w-4 h-4 fill-yellow-600 text-yellow-600" />
                <span className="text-yellow-900 font-bold">{score}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-purple-800/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Background Image Area */}
          <div className="relative flex-1 overflow-hidden">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${imagePath})`,
              }}
            />
            
            {/* Age Badge - Moved to bottom and borders removed */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-white rounded-full px-6 py-2 shadow-xl">
                <span className="text-purple-600 font-black text-2xl">AGE {currentQuestion.age}</span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Question & Choices */}
          <div className="relative z-20 bg-white rounded-t-3xl px-5 pt-5 pb-6 shadow-2xl">
            {/* Question Text */}
            <div className="mb-4">
              <h3 className="text-gray-800 font-bold text-lg text-center leading-tight">
                {currentQuestion.situation}
              </h3>
            </div>

            {/* Choices Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {currentQuestion.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(choice.score, index)}
                  disabled={showInsight !== null}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-2xl font-bold text-xs transition-all duration-300 shadow-lg border-4
                    ${showInsight === null 
                      ? 'bg-gradient-to-b from-blue-400 to-blue-600 border-blue-700 hover:scale-105 active:scale-95 text-white' 
                      : showInsight === index
                        ? choice.score > 0 
                          ? 'bg-gradient-to-b from-green-400 to-green-600 border-green-700 scale-105 text-white' 
                          : 'bg-gradient-to-b from-red-400 to-red-600 border-red-700 scale-105 text-white'
                        : 'bg-gray-300 border-gray-400 opacity-50 text-gray-600'
                    }
                    disabled:cursor-not-allowed
                  `}
                  style={{ minHeight: '100px' }}
                >
                  <span className="text-3xl mb-2">{choice.emoji}</span>
                  <span className="text-center leading-tight uppercase" style={{ fontSize: '10px' }}>
                    {choice.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Insight Display */}
            {showInsight !== null && (
              <div className={`p-3 rounded-xl text-center text-sm font-medium text-white animate-in slide-in-from-bottom duration-300 ${
                currentQuestion.choices[showInsight].score > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}>
                💡 {currentQuestion.choices[showInsight].insight}
              </div>
            )}

            {/* Mental Health Tip */}
            <div className="mt-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 border-2 border-purple-200">
              <p className="text-purple-800 text-xs text-center font-semibold">
                🧠 {currentQuestion.mentalHealthInsight}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Journey Complete!
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-2xl mb-6 border-4 border-yellow-400">
            <p className="text-gray-600 text-lg mb-2">Final Score</p>
            <p className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {score}
            </p>
          </div>
          <p className="text-white text-lg mb-8 max-w-xs leading-relaxed font-medium drop-shadow">
            Every choice shaped your journey. Keep growing! 🌱
          </p>
          <Button 
            onClick={restartGame}
            className="bg-white hover:bg-gray-100 text-purple-600 text-xl px-10 py-6 rounded-full shadow-xl hover:scale-110 transition-transform font-bold border-4 border-yellow-400"
          >
            🔄 Play Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default MindCareGame;
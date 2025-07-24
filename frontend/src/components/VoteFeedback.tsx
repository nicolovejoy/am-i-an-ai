import { useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { Card } from "./ui";
import type { Identity } from "@shared/schemas";

interface VoteFeedbackProps {
  votedFor: Identity;
  correctAnswer: Identity;
  pointsEarned: number;
  totalScore: number;
  onContinue: () => void;
}

export default function VoteFeedback({
  votedFor,
  correctAnswer,
  pointsEarned,
  totalScore,
  onContinue,
}: VoteFeedbackProps) {
  const isCorrect = votedFor === correctAnswer;
  const [showPoints, setShowPoints] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(totalScore - pointsEarned);

  useEffect(() => {
    // Show points animation after a short delay
    const pointsTimer = setTimeout(() => setShowPoints(true), 300);
    
    // Animate score counter
    if (pointsEarned > 0) {
      const scoreTimer = setTimeout(() => {
        const duration = 500;
        const steps = 20;
        const increment = pointsEarned / steps;
        let current = 0;
        
        const interval = setInterval(() => {
          current += increment;
          if (current >= pointsEarned) {
            setAnimatedScore(totalScore);
            clearInterval(interval);
          } else {
            setAnimatedScore(Math.floor(totalScore - pointsEarned + current));
          }
        }, duration / steps);
        
        return () => clearInterval(interval);
      }, 600);
      
      return () => clearTimeout(scoreTimer);
    }
    
    return () => clearTimeout(pointsTimer);
  }, [pointsEarned, totalScore]);

  return (
    <Card className="text-center">
      <div className="py-8">
        {/* Result Icon */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
          isCorrect ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isCorrect ? (
            <FiCheckCircle className="w-10 h-10 text-green-600" />
          ) : (
            <FiXCircle className="w-10 h-10 text-red-600" />
          )}
        </div>

        {/* Result Message */}
        <h3 className={`text-2xl font-bold mb-2 ${
          isCorrect ? 'text-green-600' : 'text-red-600'
        }`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </h3>

        <p className="text-slate-600 mb-4">
          The human response was from <span className="font-semibold">Participant {correctAnswer}</span>
        </p>

        {/* Points Animation */}
        <div className={`transition-all duration-300 ${
          showPoints ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
        }`}>
          <div className={`text-3xl font-bold mb-4 ${
            isCorrect ? 'text-green-600' : 'text-slate-400'
          }`}>
            {isCorrect ? `+${pointsEarned}` : '+0'} points
          </div>
        </div>

        {/* Total Score */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-slate-600 mb-1">Your Score</div>
          <div className="text-3xl font-bold text-slate-800">
            {animatedScore}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Next Round
        </button>
      </div>
    </Card>
  );
}
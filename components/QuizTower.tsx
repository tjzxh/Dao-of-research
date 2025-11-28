import React, { useState, useEffect } from 'react';
import { PlayerStats, QuizQuestion } from '../types';
import { generateQuizQuestions } from '../services/geminiService';
import { Brain, CheckCircle, XCircle, Loader2, PartyPopper } from 'lucide-react';

interface QuizTowerProps {
  player: PlayerStats;
  onComplete: (correct: number, total: number) => void;
  onCancel: () => void;
}

const QuizTower: React.FC<QuizTowerProps> = ({ player, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const qs = await generateQuizQuestions(player.rankTitle);
      setQuestions(qs);
      setLoading(false);
    };
    fetchQuestions();
  }, [player.rankTitle]);

  const handleAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === questions[currentIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      onComplete(score + (selectedOption === questions[currentIndex].correctIndex ? 1 : 0), questions.length);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">正在从题库检索试题...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">题库检索失败。</p>
        <button onClick={onCancel} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">离开</button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center">
          <Brain className="mr-2" /> 摸鱼答题 - 第 {currentIndex + 1} 题
        </h3>
        <span className="bg-white/20 px-3 py-1 rounded-full text-xs">难度: {currentQ.difficulty}</span>
      </div>

      <div className="p-6">
        <p className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">{currentQ.question}</p>

        <div className="space-y-4">
          {currentQ.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-5 rounded-xl border-2 transition-all shadow-sm font-medium ";
            if (selectedOption === null) {
              btnClass += "border-slate-100 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md";
            } else if (idx === currentQ.correctIndex) {
              btnClass += "border-green-500 bg-green-50 text-green-800";
            } else if (selectedOption === idx) {
              btnClass += "border-red-500 bg-red-50 text-red-800";
            } else {
              btnClass += "border-slate-100 opacity-50 grayscale";
            }

            return (
              <button key={idx} disabled={selectedOption !== null} onClick={() => handleAnswer(idx)} className={btnClass}>
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {selectedOption !== null && idx === currentQ.correctIndex && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {selectedOption === idx && idx !== currentQ.correctIndex && <XCircle className="w-6 h-6 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-8 p-5 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-900 animate-fade-in relative">
            <PartyPopper className="absolute -top-3 -right-3 text-yellow-500 w-8 h-8 bg-white rounded-full p-1 border border-yellow-200" />
            <h4 className="font-bold text-sm uppercase tracking-wide mb-2 opacity-70">答案解析</h4>
            <p className="text-md">{currentQ.explanation}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
           {showExplanation ? (
             <button 
                onClick={nextQuestion} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/30"
              >
                {currentIndex === questions.length - 1 ? "查看成绩" : "下一题"}
              </button>
           ) : (
             <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 px-4 py-2">这题太难不做</button>
           )}
        </div>
      </div>
    </div>
  );
};

export default QuizTower;
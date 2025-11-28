import React, { useState, useEffect } from 'react';
import { generateDailyDiary, analyzeTreeHolePost } from '../services/geminiService';
import { PlayerStats } from '../types';
import { MessageCircle, Heart, Share2, Book, Send, RefreshCw } from 'lucide-react';

interface SocialHubProps {
  player: PlayerStats;
  onBuffReceived: (buff: string) => void;
}

const SocialHub: React.FC<SocialHubProps> = ({ player }) => {
  const [diaryEntry, setDiaryEntry] = useState<string | null>(player.diary?.content || null);
  const [loadingDiary, setLoadingDiary] = useState(false);
  
  const [ventText, setVentText] = useState('');
  const [ventResponse, setVentResponse] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    // Generate Diary if not exists for today or requested
    if (!diaryEntry) {
        handleGenerateDiary();
    }
  }, []);

  const handleGenerateDiary = async () => {
      setLoadingDiary(true);
      const text = await generateDailyDiary(player);
      setDiaryEntry(text);
      setLoadingDiary(false);
  };

  const handlePost = async () => {
    if (!ventText.trim()) return;
    setIsPosting(true);
    const response = await analyzeTreeHolePost(ventText);
    setVentResponse(response);
    setVentText('');
    setIsPosting(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      
      {/* Daily Diary (New) */}
      <div className="bg-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-slate-100 flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl text-slate-800 flex items-center">
                <Book className="w-5 h-5 mr-2 text-indigo-600" />
                学术日记 (Daily Log)
            </h3>
            <button onClick={handleGenerateDiary} disabled={loadingDiary} className="text-slate-400 hover:text-indigo-600 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loadingDiary ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="bg-yellow-50/50 p-6 rounded-xl border border-yellow-100 min-h-[200px] font-serif text-slate-700 leading-relaxed italic shadow-sm">
             {loadingDiary ? (
                 <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                     正在回顾今日的学术生涯...
                 </div>
             ) : (
                 <>
                    <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                    {diaryEntry}
                 </>
             )}
          </div>
          
          <div className="mt-4 text-xs text-slate-400 text-center">
              日记内容基于你今天的真实游戏行为生成。
          </div>
        </div>
      </div>

      {/* Tree Hole (Venting) */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col h-[450px]">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-slate-700 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-cyan-600" />
            匿名树洞
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">LIVE</span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
          {/* Simulated feed */}
          <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 border border-slate-100">
            <p>"导师说这周不交初稿就让我延毕，现在手都在抖..."</p>
            <div className="flex gap-4 mt-3 text-xs text-slate-400 border-t border-slate-200 pt-2">
              <span className="flex items-center hover:text-red-400 cursor-pointer transition-colors"><Heart className="w-3 h-3 mr-1"/> 42</span>
              <span className="flex items-center hover:text-blue-400 cursor-pointer transition-colors"><Share2 className="w-3 h-3 mr-1"/> 回复</span>
            </div>
          </div>
          
          {ventResponse && (
             <div className="bg-cyan-50 border border-cyan-100 p-4 rounded-xl text-sm animate-fade-in shadow-sm">
               <div className="flex items-center mb-2">
                   <div className="w-6 h-6 rounded-full bg-cyan-200 flex items-center justify-center text-xs mr-2">🤖</div>
                   <p className="font-bold text-cyan-800 text-xs">自动回复机</p>
               </div>
               <p className="text-cyan-900 leading-relaxed">{ventResponse}</p>
             </div>
          )}
        </div>

        <div className="relative mt-auto">
          <textarea
            value={ventText}
            onChange={(e) => setVentText(e.target.value)}
            placeholder="最近压力大吗？在这里写下来..."
            className="w-full bg-slate-50 rounded-xl p-4 pr-12 text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none h-24 border border-slate-200 transition-all focus:bg-white"
          />
          <button 
            onClick={handlePost}
            disabled={isPosting || !ventText}
            className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all transform hover:-translate-y-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialHub;
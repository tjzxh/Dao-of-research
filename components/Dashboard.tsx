
import React, { useEffect, useState } from 'react';
import { GameState } from '../types';
import { generateDailyMotto } from '../services/geminiService';
import { Scroll, Zap, Activity, Trophy, CheckCircle, Lock, Quote, User, FileText, Star } from 'lucide-react';

interface DashboardProps {
  gameState: GameState;
}

const Dashboard: React.FC<DashboardProps> = ({ gameState }) => {
  const { player } = gameState;
  const [motto, setMotto] = useState<string>(player.motto || "Loading...");

  useEffect(() => {
      // Only fetch on mount to avoid refreshing when citations/stats update in real-time
      const fetchMotto = async () => {
          if (!player.motto) {
              const m = await generateDailyMotto(player);
              setMotto(m);
          } else {
              setMotto(player.motto);
          }
      };
      fetchMotto();
  }, []); // Empty dependency array -> Run once on mount

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-fade-in p-2 max-w-6xl mx-auto">
      
      {/* 1. PROFILE CARD (Compact, Left, Span 4) */}
      <div className="md:col-span-4 glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center border border-white/60">
        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-indigo-100 to-transparent z-0"></div>
        
        <div className="z-10 mt-2">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-indigo-50 mx-auto mb-3">
                {player.avatar}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{player.rankTitle}</h2>
            <div className="flex items-center justify-center gap-1 mt-1 text-amber-600 font-mono text-sm">
                <Star className="w-3 h-3 fill-current" />
                <span>Citations: {player.citations}</span>
            </div>
        </div>

        <div className="w-full mt-6 space-y-3">
            <StatRow icon={<Zap className="w-4 h-4 text-yellow-500"/>} label="体力" val={player.stamina} max={player.maxStamina} color="bg-yellow-400" />
            <StatRow icon={<Activity className="w-4 h-4 text-pink-500"/>} label="心情" val={player.mood} max={player.maxMood} color="bg-pink-400" />
            <StatRow icon={<User className="w-4 h-4 text-cyan-500"/>} label="灵感" val={player.inspiration} max={player.maxInspiration} color="bg-cyan-400" />
        </div>
        
        {/* Motto Section - Always Visible */}
        <div className="mt-6 bg-slate-50 p-3 rounded-xl w-full border border-slate-100 relative">
            <Quote className="w-4 h-4 text-slate-300 absolute top-2 left-2" />
            <p className="text-xs text-slate-600 italic font-serif px-2 pt-2">"{motto}"</p>
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: Quest Log & Logs (Span 4) */}
      <div className="md:col-span-4 flex flex-col gap-4">
          
          {/* Active Quests */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg flex-1 border border-white/60">
              <h3 className="text-sm font-bold text-slate-700 flex items-center mb-3">
                  <CheckCircle className="w-4 h-4 mr-2 text-indigo-500"/> 任务日志 (Quest Log)
              </h3>
              <div className="space-y-2">
                  {player.quests.filter(q => !q.completed).slice(0, 3).map(quest => (
                      <div key={quest.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-slate-700 truncate w-3/4">{quest.title}</span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded">{quest.type}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full" style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}></div>
                          </div>
                      </div>
                  ))}
                  {player.quests.filter(q => !q.completed).length === 0 && <div className="text-xs text-slate-400 text-center py-4">暂无任务</div>}
              </div>
          </div>

          {/* Activity Log (Compact) */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg h-40 overflow-hidden border border-white/60">
               <h3 className="text-sm font-bold text-slate-700 flex items-center mb-2">
                  <Scroll className="w-4 h-4 mr-2 text-slate-500"/> 行动记录
              </h3>
              <ul className="text-[11px] text-slate-500 space-y-1.5 font-mono">
                  {player.activities.slice(-5).reverse().map((act, i) => (
                      <li key={i} className="truncate">• {act}</li>
                  ))}
              </ul>
          </div>
      </div>

      {/* 3. RIGHT COLUMN: Papers & Achievements (Span 4) */}
      <div className="md:col-span-4 flex flex-col gap-4">
          
          {/* Published Papers List */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg flex-1 border border-white/60">
              <h3 className="text-sm font-bold text-slate-700 flex items-center mb-3">
                  <FileText className="w-4 h-4 mr-2 text-cyan-600"/> 成果列表 (Publications)
              </h3>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {gameState.inventory.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-4">暂无发表</div>
                  ) : (
                      gameState.inventory.map((paper, idx) => (
                          <div key={idx} className={`p-2 rounded-lg border text-xs flex justify-between items-start ${
                              paper.status === 'ACCEPTED' ? 'bg-green-50 border-green-100' :
                              paper.status === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
                          }`}>
                              <div className="truncate flex-1">
                                <p className="font-bold text-slate-700 truncate">{paper.title}</p>
                                <p className="text-[10px] text-slate-500">{paper.tier} • {paper.status}</p>
                              </div>
                              {paper.status === 'ACCEPTED' && (
                                  <div className="flex flex-col items-end">
                                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-mono ml-2">
                                          Cited: {paper.citations}
                                      </span>
                                  </div>
                              )}
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* Achievements Icons */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg border border-white/60">
              <h3 className="text-sm font-bold text-slate-700 flex items-center mb-3">
                  <Trophy className="w-4 h-4 mr-2 text-amber-500"/> 成就
              </h3>
              <div className="flex flex-wrap gap-2">
                  {player.achievements.map((ach) => (
                      <div key={ach.id} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${
                          ach.unlocked ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-300'
                      }`} title={ach.name + ": " + ach.desc}>
                          {ach.unlocked ? ach.icon : <Lock className="w-3 h-3"/>}
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

const StatRow = ({ icon, label, val, max, color }: any) => (
  <div className="flex items-center text-xs w-full">
    <div className="flex items-center text-slate-500 w-16">
        {icon} <span className="ml-1">{label}</span>
    </div>
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-2">
        <div className={`h-full ${color}`} style={{ width: `${(val / max) * 100}%` }}></div>
    </div>
    <span className="text-slate-400 font-mono w-6 text-right">{val}</span>
  </div>
);

export default Dashboard;

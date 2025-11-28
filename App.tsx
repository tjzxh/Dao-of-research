import { useState, useEffect } from 'react';
import { GameState, View, PlayerStats, SkillStats, GameLocation, RandomEvent, PaperResult, Reward } from './types';
import Dashboard from './components/Dashboard';
import QuizTower from './components/QuizTower';
import PaperForge from './components/PaperForge';
import NPCInteraction from './components/NPCLab';
import WorldMap from './components/WorldMap';
import SocialHub from './components/SocialHub';
import SportsGround from './components/SportsGround';
import { LayoutDashboard, Gamepad2, Scroll, MessageSquare, Map as MapIcon, Compass, Bell, Book, Star, Gift } from 'lucide-react';

const INITIAL_PLAYER: PlayerStats = {
  stamina: 80,
  maxStamina: 100,
  mood: 75,
  maxMood: 100,
  inspiration: 20,
  maxInspiration: 100,
  reputation: 100,
  citations: 0,
  rankTitle: '学术小白 (Novice)',
  papersPublished: 0,
  avatar: '🎓',
  activities: [], 
  achievements: [
      { id: '1', name: '初入师门', desc: '第一次登录游戏', icon: '🚪', unlocked: true },
      { id: '2', name: '学术新星', desc: '引用数突破 100', icon: '🌟', unlocked: false },
      { id: '3', name: '灌水大师', desc: '发表5篇论文', icon: '📝', unlocked: false },
  ],
  quests: [
      { id: 'q1', title: '每日签到: 查看日记', progress: 0, maxProgress: 1, reward: 'Mood +5', completed: false, type: 'DAILY' },
      { id: 'q2', title: '发表第一篇SCI', progress: 0, maxProgress: 1, reward: 'Rep +200', completed: false, type: 'MAIN' },
  ]
};

const INITIAL_SKILLS: SkillStats = {
  theory: 10,
  experiment: 15,
  writing: 10,
  presentation: 5,
  survival: 20
};

// Helper component moved to top to avoid hoisting issues
const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start space-x-0 lg:space-x-3 px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-gradient-to-r from-indigo-900/80 to-slate-800 text-white shadow-lg border border-indigo-500/30' 
        : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
    }`}
    title={label}
  >
    <span className={`transition-colors ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`}>{icon}</span>
    <span className="hidden lg:block font-medium text-sm tracking-wide">{label}</span>
  </button>
);

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    player: INITIAL_PLAYER,
    skills: INITIAL_SKILLS,
    inventory: [],
    currentView: View.DASHBOARD
  });
  
  const [activeLocation, setActiveLocation] = useState<GameLocation | null>(null);
  const [toast, setToast] = useState<{title: string, desc: string, icon?: any} | null>(null);

  // --- Citation Growth Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
        setGameState(prev => {
            let totalNewCitations = 0;
            let updated = false;

            const newInventory = prev.inventory.map(paper => {
                // If paper is accepted/revision, it has citation potential
                if ((paper.status === 'ACCEPTED' || paper.status.includes('REVISION')) && paper.potential > 0) {
                     // 10% chance to gain citations per tick
                     if (Math.random() < 0.1) {
                         const gain = Math.ceil(Math.random() * (paper.potential / 5));
                         totalNewCitations += gain;
                         updated = true;
                         return { ...paper, citations: paper.citations + gain };
                     }
                }
                return paper;
            });

            if (!updated) return prev;

            return {
                ...prev,
                player: {
                    ...prev.player,
                    citations: prev.player.citations + totalNewCitations,
                    rankTitle: (prev.player.citations + totalNewCitations) > 200 ? '学术大牛 (Prof)' : prev.player.rankTitle
                },
                inventory: newInventory
            };
        });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);


  const updateStats = (updates: Partial<PlayerStats>) => {
    setGameState(prev => ({
      ...prev,
      player: { ...prev.player, ...updates }
    }));
  };

  const addActivity = (act: string) => {
      setGameState(prev => ({
          ...prev,
          player: { ...prev.player, activities: [...prev.player.activities, act] }
      }));
  }

  const handleNav = async (view: View) => {
    setGameState(prev => ({ ...prev, currentView: view }));
  };

  const checkQuests = (type: string, amount: number = 1) => {
      setGameState(prev => {
          const newQuests = prev.player.quests.map(q => {
             if (q.title.includes(type) && !q.completed) {
                 const newProg = Math.min(q.maxProgress, q.progress + amount);
                 return { ...q, progress: newProg, completed: newProg >= q.maxProgress };
             }
             return q;
          });
          return { ...prev, player: { ...prev.player, quests: newQuests } };
      });
  };

  // --- Handlers ---

  const handleQuizComplete = (correct: number, total: number) => {
    const xpGain = correct * 10;
    updateStats({
        mood: Math.min(100, gameState.player.mood + 5),
        reputation: gameState.player.reputation + xpGain,
        activities: [...gameState.player.activities, `答题摸鱼(${correct}/${total})`]
    });
    setGameState(prev => ({ ...prev, currentView: View.DASHBOARD }));
    setToast({ title: "摸鱼结束", desc: `心情 +5, 声望 +${xpGain}` });
  };

  const handlePaperForged = (result: PaperResult) => {
    const isAccepted = result.status === 'ACCEPTED' || result.status === 'MINOR_REVISION';
    
    setGameState(prev => {
        const newCount = prev.player.papersPublished + (isAccepted ? 1 : 0);
        // Citations start at 0 and grow over time in the loop above
        
        // Check Achievements
        const newAchievements = prev.player.achievements.map(a => {
            if (a.id === '3' && newCount >= 5) return { ...a, unlocked: true };
            return a;
        });

        // Determine Mood effect
        let moodChange = -10; // Tired
        if (result.status === 'ACCEPTED') moodChange = 20;
        if (result.status === 'REJECTED') moodChange = -20;

        return {
            ...prev,
            player: {
                ...prev.player,
                stamina: Math.max(0, prev.player.stamina - 20),
                mood: Math.min(100, Math.max(0, prev.player.mood + moodChange)),
                papersPublished: newCount,
                achievements: newAchievements,
                activities: [...prev.player.activities, `论文${result.status}: ${result.title}`]
            },
            inventory: [result, ...prev.inventory],
            currentView: View.DASHBOARD
        };
    });
    
    if (isAccepted) checkQuests('发表');
    if (result.tier.includes('SCI')) checkQuests('SCI');
  };

  const handleSportsComplete = (collectedPoints: number, levelReached: number) => {
    updateStats({
        stamina: Math.max(0, gameState.player.stamina - 15),
        mood: Math.min(100, gameState.player.mood + 10),
        inspiration: Math.min(gameState.player.maxInspiration, gameState.player.inspiration + collectedPoints),
        activities: [...gameState.player.activities, `秘境探索至第${levelReached}层`]
    });
    setGameState(prev => ({
        ...prev,
        skills: { ...prev.skills, survival: prev.skills.survival + levelReached },
        currentView: View.DASHBOARD
    }));
    checkQuests('秘境');
  };

  const handleLocationSelect = (loc: GameLocation) => {
      setActiveLocation(loc);
      addActivity(`造访了${loc.name}`);
      setGameState(prev => ({ ...prev, currentView: View.NPC_INTERACTION }));
  };

  const handleTaskTriggered = (task: RandomEvent) => {
      setToast({ 
          title: `任务触发: ${task.title}`, 
          desc: `${task.description}`,
          icon: <Bell className="w-5 h-5 text-yellow-600" />
      });
      addActivity(`接到了任务: ${task.title}`);
  };

  const handleRewardTriggered = (reward: Reward) => {
      setToast({
          title: "获得馈赠！",
          desc: `${reward.message} (${reward.type} +${reward.amount})`,
          icon: <Gift className="w-5 h-5 text-pink-600" />
      });
      
      const updates: Partial<PlayerStats> = {};
      if (reward.type === 'STAMINA') updates.stamina = Math.min(100, gameState.player.stamina + reward.amount);
      if (reward.type === 'MOOD') updates.mood = Math.min(100, gameState.player.mood + reward.amount);
      if (reward.type === 'INSPIRATION') updates.inspiration = Math.min(100, gameState.player.inspiration + reward.amount);
      if (reward.type === 'CITATION') updates.citations = gameState.player.citations + reward.amount;
      
      updateStats(updates);
  };

  // --- Render View ---

  const renderContent = () => {
    switch (gameState.currentView) {
      case View.DASHBOARD:
        return <Dashboard gameState={gameState} />;
      case View.QUIZ_TOWER:
        return <QuizTower player={gameState.player} onComplete={handleQuizComplete} onCancel={() => handleNav(View.DASHBOARD)} />;
      case View.PAPER_FORGE:
        return <PaperForge skills={gameState.skills} onPaperForged={handlePaperForged} onExit={() => handleNav(View.DASHBOARD)} />;
      case View.WORLD_MAP:
        return <WorldMap onSelectLocation={handleLocationSelect} />;
      case View.NPC_INTERACTION:
        return activeLocation ? (
            <NPCInteraction 
                player={gameState.player} 
                npc={activeLocation.npc} 
                onClose={() => handleNav(View.WORLD_MAP)} 
                onTaskTriggered={handleTaskTriggered}
                onRewardTriggered={handleRewardTriggered}
            />
        ) : <div>Error</div>;
      case View.SOCIAL_HUB:
        return <SocialHub player={gameState.player} onBuffReceived={() => {}} />;
      case View.SPORTS:
        return <SportsGround player={gameState.player} onComplete={handleSportsComplete} onCancel={() => handleNav(View.DASHBOARD)} />;
      default:
        return <div>Unknown Realm</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-800 bg-[#f3f4f6]">
      {/* Sidebar */}
      <nav className="md:w-20 lg:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col z-20 shadow-2xl transition-all">
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-center lg:justify-start">
           <Book className="w-8 h-8 text-indigo-400 lg:mr-3"/>
           <div className="hidden lg:block">
               <h1 className="text-lg font-serif text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-bold tracking-wider">学术修仙</h1>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest">Grad School RPG</p>
           </div>
        </div>
        
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          <NavBtn active={gameState.currentView === View.DASHBOARD} onClick={() => handleNav(View.DASHBOARD)} icon={<LayoutDashboard />} label="总览" />
          
          <div className="hidden lg:block pt-6 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center"><Star className="w-3 h-3 mr-1"/>修炼</div>
          <NavBtn active={gameState.currentView === View.PAPER_FORGE} onClick={() => handleNav(View.PAPER_FORGE)} icon={<Scroll />} label="论文炼炉" />
          <NavBtn active={gameState.currentView === View.SPORTS} onClick={() => handleNav(View.SPORTS)} icon={<Compass />} label="秘境探索" />
          <NavBtn active={gameState.currentView === View.QUIZ_TOWER} onClick={() => handleNav(View.QUIZ_TOWER)} icon={<Gamepad2 />} label="摸鱼答题" />
          
          <div className="hidden lg:block pt-6 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center"><MessageSquare className="w-3 h-3 mr-1"/>社交</div>
          <NavBtn active={gameState.currentView === View.WORLD_MAP} onClick={() => handleNav(View.WORLD_MAP)} icon={<MapIcon />} label="校园地图" />
          <NavBtn active={gameState.currentView === View.SOCIAL_HUB} onClick={() => handleNav(View.SOCIAL_HUB)} icon={<Bell />} label="树洞" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>

        {/* Global Toast */}
        {toast && (
            <div className="fixed bottom-6 right-6 max-w-sm bg-white/95 backdrop-blur border-l-4 border-indigo-400 shadow-2xl rounded-lg p-5 animate-slide-up z-50 cursor-pointer" onClick={() => setToast(null)}>
                <div className="flex items-start">
                    <div className="bg-indigo-50 p-2 rounded-full mr-3">
                        {toast.icon || <Bell className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{toast.title}</h4>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{toast.desc}</p>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
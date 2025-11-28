import React, { useState, useEffect } from 'react';
import { generatePaperReview } from '../services/geminiService';
import { Loader2, Zap, Bomb, Coffee, Crosshair } from 'lucide-react';
import { SkillStats, PaperResult } from '../types';

interface PaperForgeProps {
  skills: SkillStats;
  onPaperForged: (result: PaperResult) => void;
  onExit: () => void;
}

const TYPES = ['DATA', 'THEORY', 'WRITING', 'COFFEE', 'BUG'];
const SPECIAL_TYPES = ['BOMB', 'LASER'];
const GRID_SIZE = 6;

const PaperForge: React.FC<PaperForgeProps> = ({ skills, onPaperForged, onExit }) => {
  const [grid, setGrid] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20); 
  const [selected, setSelected] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStatus, setGameStatus] = useState<'PLAYING' | 'GENERATING' | 'REVIEW'>('PLAYING');
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const [hasTriggeredEvent, setHasTriggeredEvent] = useState(false);
  
  // Review Result State
  const [result, setResult] = useState<PaperResult | null>(null);

  useEffect(() => { initGrid(); }, []);

  const initGrid = () => {
    const newGrid = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => 
      TYPES[Math.floor(Math.random() * TYPES.length)]
    );
    setGrid(newGrid);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'DATA': return <span className="text-xl">📊</span>;
      case 'THEORY': return <span className="text-xl">🧠</span>;
      case 'WRITING': return <span className="text-xl">✍️</span>;
      case 'COFFEE': return <Coffee className="w-5 h-5 text-amber-700" />;
      case 'BUG': return <span className="text-xl">👹</span>;
      case 'BOMB': return <Bomb className="w-6 h-6 text-red-600 animate-pulse" />;
      case 'LASER': return <Crosshair className="w-6 h-6 text-indigo-600 animate-spin-slow" />;
      default: return null;
    }
  };

  const handleTileClick = (index: number) => {
    if (gameStatus !== 'PLAYING' || isProcessing) return;
    if (grid[index] === 'BOMB') { activateBomb(index); return; }
    if (grid[index] === 'LASER') { activateLaser(index); return; }
    
    if (selected === null) { setSelected(index); } else {
      if (selected === index) { setSelected(null); return; }
      const diff = Math.abs(selected - index);
      const isAdjacent = (diff === 1 && Math.floor(selected / GRID_SIZE) === Math.floor(index / GRID_SIZE)) || diff === GRID_SIZE;
      if (isAdjacent) { swapAndCheck(selected, index); } else { setSelected(index); }
    }
  };

  const activateBomb = (idx: number) => {
      setIsProcessing(true);
      setMoves(m => Math.max(0, m - 1));
      showEvent("灵感炸弹！清除3x3区域！");
      
      const row = Math.floor(idx / GRID_SIZE);
      const col = idx % GRID_SIZE;
      const newGrid = [...grid];
      let cleared = 0;

      for(let r = Math.max(0, row-1); r <= Math.min(GRID_SIZE-1, row+1); r++) {
          for(let c = Math.max(0, col-1); c <= Math.min(GRID_SIZE-1, col+1); c++) {
              const targetIdx = r * GRID_SIZE + c;
              if(newGrid[targetIdx] !== 'EMPTY') { 
                  newGrid[targetIdx] = 'EMPTY'; 
                  cleared++; 
              }
          }
      }
      
      setScore(s => s + (cleared * 30));
      fillBoard(newGrid);
  };

  const activateLaser = (idx: number) => {
      setIsProcessing(true);
      setMoves(m => Math.max(0, m - 1));
      showEvent("全行全列消除！");
      
      const row = Math.floor(idx / GRID_SIZE);
      const col = idx % GRID_SIZE;
      const newGrid = [...grid];
      let cleared = 0;
      
      // Clear Row
      for(let c=0; c<GRID_SIZE; c++) { 
          if(newGrid[row * GRID_SIZE + c] !== 'EMPTY') { newGrid[row * GRID_SIZE + c] = 'EMPTY'; cleared++; }
      }
      // Clear Col
      for(let r=0; r<GRID_SIZE; r++) { 
          if(newGrid[r * GRID_SIZE + col] !== 'EMPTY') { newGrid[r * GRID_SIZE + col] = 'EMPTY'; cleared++; }
      }
      
      setScore(s => s + (cleared * 50));
      fillBoard(newGrid);
  };

  const showEvent = (msg: string) => {
      setEventMsg(msg);
      setTimeout(() => setEventMsg(null), 2500);
  };

  const triggerContextEvent = (matchedTypes: string[]) => {
      if (hasTriggeredEvent) return; 
      if (Math.random() > 0.3) return; 

      if (matchedTypes.includes('BUG')) {
          setScore(s => Math.max(0, s - 30));
          showEvent("发现重大逻辑漏洞！(分数 -30)");
          setHasTriggeredEvent(true);
      } else if (matchedTypes.includes('COFFEE')) {
          setMoves(m => m + 3);
          showEvent("深夜外卖到了 (步数 +3)");
          setHasTriggeredEvent(true);
      }
  };

  const swapAndCheck = async (idx1: number, idx2: number) => {
    setIsProcessing(true);
    const newGrid = [...grid];
    [newGrid[idx1], newGrid[idx2]] = [newGrid[idx2], newGrid[idx1]];
    setGrid(newGrid);
    setSelected(null);
    setMoves(m => m - 1);
    
    setTimeout(() => {
        const matches = findMatches(newGrid);
        if (matches.size > 0) { processMatches(newGrid, matches); } else {
             [newGrid[idx2], newGrid[idx1]] = [newGrid[idx1], newGrid[idx2]];
             setGrid(newGrid);
             setIsProcessing(false);
        }
    }, 200);
  };

  const findMatches = (currentGrid: string[]) => {
      let matches = new Set<number>();
      const matchGroups: number[][] = []; 
      
      // Horizontal
      for (let r = 0; r < GRID_SIZE; r++) {
          let currentMatch: number[] = [];
          for (let c = 0; c < GRID_SIZE; c++) {
              const i = r * GRID_SIZE + c;
              if (c === 0) { currentMatch.push(i); } else {
                  const prev = r * GRID_SIZE + (c - 1);
                  if (currentGrid[i] === currentGrid[prev] && !SPECIAL_TYPES.includes(currentGrid[i])) { currentMatch.push(i); } 
                  else { if (currentMatch.length >= 3) matchGroups.push([...currentMatch]); currentMatch = [i]; }
              }
          }
          if (currentMatch.length >= 3) matchGroups.push([...currentMatch]);
      }
      
      // Vertical
      for (let c = 0; c < GRID_SIZE; c++) {
          let currentMatch: number[] = [];
          for (let r = 0; r < GRID_SIZE; r++) {
              const i = r * GRID_SIZE + c;
              if (r === 0) { currentMatch.push(i); } else {
                  const prev = (r - 1) * GRID_SIZE + c;
                  if (currentGrid[i] === currentGrid[prev] && !SPECIAL_TYPES.includes(currentGrid[i])) { currentMatch.push(i); } 
                  else { if (currentMatch.length >= 3) matchGroups.push([...currentMatch]); currentMatch = [i]; }
              }
          }
          if (currentMatch.length >= 3) matchGroups.push([...currentMatch]);
      }
      
      matchGroups.forEach(group => group.forEach(idx => matches.add(idx)));
      return { size: matches.size, indices: matches, groups: matchGroups };
  };

  const processMatches = (currentGrid: string[], matchData: { size: number, indices: Set<number>, groups: number[][] }) => {
      let roundScore = 0;
      let matchedTypes: string[] = [];
      const spawnSpecials: { idx: number, type: string }[] = [];

      matchData.groups.forEach(group => {
          const type = currentGrid[group[0]];
          matchedTypes.push(type);
          
          // Spawn Logic
          if (group.length === 4) {
              spawnSpecials.push({ idx: group[1], type: 'BOMB' });
          } else if (group.length >= 5) {
              spawnSpecials.push({ idx: group[2], type: 'LASER' });
          }

          let multiplier = 50; 
          if (type === 'BUG') multiplier = -20; 
          if (type === 'COFFEE') multiplier = 80;

          roundScore += (group.length * multiplier);
      });

      setScore(s => s + roundScore);
      triggerContextEvent(matchedTypes);
      
      matchData.indices.forEach(idx => { currentGrid[idx] = 'EMPTY'; });
      spawnSpecials.forEach(spawn => { currentGrid[spawn.idx] = spawn.type; });
      
      fillBoard(currentGrid);
  };

  const fillBoard = (currentGrid: string[]) => {
      for (let c = 0; c < GRID_SIZE; c++) {
          let writePtr = GRID_SIZE - 1;
          for (let r = GRID_SIZE - 1; r >= 0; r--) {
              const idx = r * GRID_SIZE + c;
              if (currentGrid[idx] !== 'EMPTY') {
                  const targetIdx = writePtr * GRID_SIZE + c;
                  currentGrid[targetIdx] = currentGrid[idx];
                  if (targetIdx !== idx) currentGrid[idx] = 'EMPTY';
                  writePtr--;
              }
          }
      }
      for (let i = 0; i < currentGrid.length; i++) {
          if (currentGrid[i] === 'EMPTY') { currentGrid[i] = TYPES[Math.floor(Math.random() * TYPES.length)]; }
      }
      setGrid([...currentGrid]);
      setTimeout(() => {
          const matches = findMatches(currentGrid);
          if (matches.size > 0) { processMatches(currentGrid, matches); } else { setIsProcessing(false); }
      }, 300);
  };

  useEffect(() => {
    if (moves <= 0 && gameStatus === 'PLAYING' && !isProcessing) {
      finishGame();
    }
  }, [moves, isProcessing]);

  const finishGame = async () => {
    setGameStatus('GENERATING');
    const bugCount = grid.filter(t => t === 'BUG').length;
    const finalScore = Math.max(0, score - (bugCount * 10));
    
    const paperResult = await generatePaperReview(finalScore, skills);
    setResult(paperResult);
    setGameStatus('REVIEW');
  };

  const handleCollect = () => {
      if (result) onPaperForged(result);
  };

  if (gameStatus === 'GENERATING') {
    return (
      <div className="flex flex-col items-center justify-center h-96 glass-panel rounded-xl">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-serif text-slate-800">Reviewer #2 正在磨刀霍霍...</h2>
        <p className="text-slate-500 mt-2">（系统正在生成审稿意见）</p>
      </div>
    );
  }

  if (gameStatus === 'REVIEW' && result) {
      return (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl border border-slate-200 animate-slide-up relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-t-xl"></div>
              
              <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">{result.title}</h2>
              <div className="flex items-center gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      result.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 
                      result.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                      {result.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Tier: {result.tier}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 font-mono text-sm text-slate-600 relative">
                  <QuoteIcon className="w-6 h-6 text-slate-200 absolute -top-3 -left-2 bg-slate-50"/>
                  <p>"{result.feedback}"</p>
                  <p className="text-right mt-2 text-xs font-bold">— Reviewer #2</p>
              </div>

              <div className="flex justify-between items-center mb-8 px-4">
                  <div className="text-center">
                      <p className="text-xs text-slate-400 uppercase">Score</p>
                      <p className="text-xl font-bold text-slate-700">{result.score}</p>
                  </div>
                  <div className="text-center">
                      <p className="text-xs text-slate-400 uppercase">Initial Citations</p>
                      <p className="text-xl font-bold text-slate-500">0</p>
                      <p className="text-[10px] text-slate-400">(Will grow over time)</p>
                  </div>
              </div>

              <button onClick={handleCollect} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                  收下反馈 (Accept Fate)
              </button>
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-amber-200 shadow-2xl relative">
      {eventMsg && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce text-center min-w-[200px]">
              <span className="text-2xl block mb-2">⚡</span>
              <p className="font-bold">{eventMsg}</p>
          </div>
      )}

      <div className="flex justify-between w-full mb-6 gap-4">
        <div className="flex-1 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100 flex flex-col items-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">学术积分</p>
          <p className="text-3xl font-mono text-amber-600 font-bold">{score}</p>
        </div>
        <div className="flex-1 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 flex flex-col items-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">剩余步数</p>
          <p className={`text-3xl font-mono font-bold ${moves < 5 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>{moves}</p>
        </div>
      </div>

      <div className="grid gap-2 bg-slate-200 p-3 rounded-2xl shadow-inner border border-slate-300" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
        {grid.map((type, idx) => (
          <button key={idx} onClick={() => handleTileClick(idx)} className={`
              w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 relative
              ${selected === idx ? 'bg-white ring-4 ring-cyan-400 z-10 scale-110 shadow-xl' : 'bg-white hover:scale-105'}
              ${type === 'BUG' ? 'bg-slate-100 border border-slate-200' : ''}
              ${type === 'BOMB' ? 'bg-red-50 border-2 border-red-200' : ''}
              ${type === 'LASER' ? 'bg-indigo-50 border-2 border-indigo-200' : ''}
            `}>
            {getIcon(type)}
            {type === 'BOMB' && <div className="absolute -bottom-1 -right-1 text-[8px] bg-red-100 text-red-800 px-1 rounded">BOMB</div>}
            {type === 'LASER' && <div className="absolute -bottom-1 -right-1 text-[8px] bg-indigo-100 text-indigo-800 px-1 rounded">LASER</div>}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center text-xs text-slate-500 space-y-1">
          <p>消除 <span className="text-amber-700 font-bold">☕</span> 大幅得分，残留 <span className="text-slate-600 font-bold">👹</span> 扣分。</p>
          <p>4连 = <span className="text-red-600 font-bold">炸弹</span> (3x3)，5连 = <span className="text-indigo-600 font-bold">激光</span> (行列消除)</p>
      </div>
      <div className="mt-4">
        <button onClick={onExit} className="text-slate-400 hover:text-red-500 underline text-sm transition-colors">放弃草稿 (Quit)</button>
      </div>
    </div>
  );
};

const QuoteIcon = ({className}: {className: string}) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.896 14.912 16 16.017 16H19.017C19.569 16 20.017 15.552 20.017 15V9C20.017 8.448 19.569 8 19.017 8H15.017C14.465 8 14.017 7.552 14.017 7V3H19.017C20.674 3 22.017 4.343 22.017 6V15C22.017 16.657 20.674 18 19.017 18H16.017V21H14.017ZM5.0166 21L5.0166 18C5.0166 16.896 5.912 16 7.0166 16H10.0166C10.569 16 11.0166 15.552 11.0166 15V9C11.0166 8.448 10.569 8 10.0166 8H6.0166C5.46432 8 5.0166 7.552 5.0166 7V3H10.0166C11.6736 3 13.0166 4.343 13.0166 6V15C13.0166 16.657 11.6736 18 10.0166 18H7.0166V21H5.0166Z" /></svg>
)

export default PaperForge;
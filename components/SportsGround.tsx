import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerStats } from '../types';
import { Compass, Zap, Coffee, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Map as MapIcon } from 'lucide-react';

interface SportsGroundProps {
  player: PlayerStats;
  onComplete: (collected: number, level: number) => void;
  onCancel: () => void;
}

// Config
const BASE_W = 10;
const BASE_H = 8;
const MAX_LEVEL = 5;
const MOB_MOVE_INTERVAL = 800; // ms

type Position = { x: number; y: number };
type CellType = 'EMPTY' | 'WALL' | 'ITEM_IDEA' | 'ITEM_COFFEE' | 'EXIT' | 'START';

const SportsGround: React.FC<SportsGroundProps> = ({ player, onComplete, onCancel }) => {
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [map, setMap] = useState<CellType[][]>([]);
  const [itemsCollected, setItemsCollected] = useState(0); 
  const [coffeesCollected, setCoffeesCollected] = useState(0);
  const [mobs, setMobs] = useState<Position[]>([]);
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  
  // Refs for interval access to state
  const playerPosRef = useRef(playerPos);
  const mobsRef = useRef(mobs);
  const gameOverRef = useRef(gameOver);
  const gameWonRef = useRef(gameWon);

  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { mobsRef.current = mobs; }, [mobs]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { gameWonRef.current = gameWon; }, [gameWon]);

  // Initialize Level
  const startLevel = (lvl: number) => {
    const w = BASE_W + lvl;
    const h = BASE_H + Math.floor(lvl / 2);
    const mobCount = 1 + Math.floor(lvl * 0.8);
    const itemsCount = 3 + lvl;
    const coffeeCount = Math.floor(lvl / 2) + 1;

    const newMap: CellType[][] = Array(h).fill(null).map(() => Array(w).fill('EMPTY'));
    
    // Walls
    const wallChance = 0.15 + (lvl * 0.02);
    for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
            if (x===0 && y===0) continue;
            if (Math.random() < wallChance) newMap[y][x] = 'WALL';
        }
    }

    // Items & Exit placement (omitted checks for brevity, assuming probabilistic placement works well enough for demo)
    let placed = 0;
    while(placed < itemsCount) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        if (newMap[y][x] === 'EMPTY' && (x!==0 || y!==0)) { newMap[y][x] = 'ITEM_IDEA'; placed++; }
    }
    placed = 0;
    while(placed < coffeeCount) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        if (newMap[y][x] === 'EMPTY' && (x!==0 || y!==0)) { newMap[y][x] = 'ITEM_COFFEE'; placed++; }
    }
    let exitPlaced = false;
    while(!exitPlaced) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        if (x > w/2 && y > h/2 && newMap[y][x] !== 'WALL') { newMap[y][x] = 'EXIT'; exitPlaced = true; }
    }
    
    // Mobs
    const newMobs = [];
    for(let i=0; i<mobCount; i++) {
        let mx, my;
        do {
            mx = Math.floor(Math.random() * w);
            my = Math.floor(Math.random() * h);
        } while (mx < 3 && my < 3);
        newMobs.push({ x: mx, y: my });
    }

    setMap(newMap);
    setMobs(newMobs);
    setPlayerPos({ x: 0, y: 0 });
    setIsPlaying(true);
    setGameOver(false);
    setGameWon(false);
    setMessage("");
  };

  // --- Game Loop for Mobs ---
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
        if (gameOverRef.current || gameWonRef.current) return;

        const currentMobs = mobsRef.current;
        const pPos = playerPosRef.current;
        const h = map.length;
        const w = map[0]?.length || 0;
        if(w === 0) return;

        const newMobs = currentMobs.map(mob => {
            const directions = [{dx:0, dy:1}, {dx:0, dy:-1}, {dx:1, dy:0}, {dx:-1, dy:0}];
            // Bias towards player (simple AI)
            if (Math.random() > 0.4) {
                if (pPos.x > mob.x) directions.push({dx:1, dy:0}, {dx:1, dy:0});
                if (pPos.x < mob.x) directions.push({dx:-1, dy:0}, {dx:-1, dy:0});
                if (pPos.y > mob.y) directions.push({dx:0, dy:1}, {dx:0, dy:1});
                if (pPos.y < mob.y) directions.push({dx:0, dy:-1}, {dx:0, dy:-1});
            }

            const dir = directions[Math.floor(Math.random() * directions.length)];
            const nx = mob.x + dir.dx;
            const ny = mob.y + dir.dy;

            // Bounds check
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && map[ny][nx] !== 'WALL' && map[ny][nx] !== 'EXIT') {
                return { x: nx, y: ny };
            }
            return mob; // Stay still if blocked
        });

        setMobs(newMobs);

        // Collision Check after mob move
        const hit = newMobs.some(m => m.x === pPos.x && m.y === pPos.y);
        if (hit) {
            setGameOver(true);
            setMessage("被随机游走的Bug怪撞飞了！");
        }

    }, MOB_MOVE_INTERVAL);

    return () => clearInterval(interval);
  }, [isPlaying, map]);


  // Player Movement
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameOver || gameWon || !isPlaying) return;

    const h = map.length;
    const w = map[0].length;
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newX < 0 || newX >= w || newY < 0 || newY >= h) return;
    if (map[newY][newX] === 'WALL') return;

    setPlayerPos({ x: newX, y: newY });
    checkEvents(newX, newY);
  }, [playerPos, map, gameOver, gameWon, isPlaying]);

  const checkEvents = (px: number, py: number) => {
      // Check collision with mobs (Player moved into mob)
      const hitMob = mobs.some(m => m.x === px && m.y === py);
      if (hitMob) {
          setGameOver(true);
          setMessage("你一头撞进了Bug堆里！");
          return;
      }

      if (map[py][px] === 'ITEM_IDEA') {
          const newMap = [...map]; newMap[py] = [...newMap[py]]; newMap[py][px] = 'EMPTY';
          setMap(newMap); setItemsCollected(c => c + 1);
      } else if (map[py][px] === 'ITEM_COFFEE') {
          const newMap = [...map]; newMap[py] = [...newMap[py]]; newMap[py][px] = 'EMPTY';
          setMap(newMap); setCoffeesCollected(c => c + 1);
      }

      if (map[py][px] === 'EXIT') {
          setGameWon(true);
          setMessage(level < MAX_LEVEL ? `区域${level}净化完毕！` : "全图通关！");
      }
  };

  const handleNextLevel = () => {
      if (level < MAX_LEVEL) {
          setLevel(l => l + 1);
          startLevel(level + 1);
      } else {
          onComplete(itemsCollected + (coffeesCollected * 2), level);
      }
  };

  const handleCashOut = () => {
      onComplete(itemsCollected + (coffeesCollected * 2), level);
  };

  // Input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if(e.key === 'ArrowUp') movePlayer(0, -1);
        if(e.key === 'ArrowDown') movePlayer(0, 1);
        if(e.key === 'ArrowLeft') movePlayer(-1, 0);
        if(e.key === 'ArrowRight') movePlayer(1, 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movePlayer]);

  if (!isPlaying) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 glass-panel rounded-3xl shadow-xl animate-fade-in">
             <div className="bg-cyan-100 p-6 rounded-full mb-6 text-cyan-600 animate-bounce">
                <MapIcon className="w-16 h-16" />
             </div>
             <h2 className="text-3xl font-serif font-bold mb-4 text-slate-800">秘境探索 (Maze)</h2>
             <p className="text-slate-600 mb-8 text-center max-w-md leading-relaxed">
                 在动态变化的迷宫中寻找灵感。小心！那些Bug怪（<span className="text-red-500 font-bold">👹</span>）是活的，它们会随机游走并试图包围你。
             </p>
             <div className="flex gap-4">
                 <button onClick={() => startLevel(1)} className="bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-cyan-700 transition shadow-lg hover:scale-105">
                     开始第 1 层
                 </button>
                 <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 px-4 py-2 font-medium">返回</button>
             </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto glass-panel rounded-3xl shadow-2xl p-6 border-slate-200">
      <div className="flex justify-between w-full mb-6 items-center bg-slate-100 p-4 rounded-xl border border-slate-200">
        <div>
           <h2 className="text-lg font-bold flex items-center text-slate-700">
             <Compass className="mr-2 text-cyan-600"/> 第 {level} 层
           </h2>
        </div>
        <div className="flex space-x-6 font-mono text-lg font-bold">
           <span className="text-yellow-600 flex items-center" title="灵感"><Zap className="w-5 h-5 mr-2 text-yellow-500 fill-current"/> {itemsCollected}</span>
           <span className="text-amber-800 flex items-center" title="咖啡"><Coffee className="w-5 h-5 mr-2 text-amber-700"/> {coffeesCollected}</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl shadow-inner border-4 border-slate-300">
          <div className="grid gap-0 bg-slate-50" style={{ gridTemplateColumns: `repeat(${map[0]?.length || 1}, 1fr)` }}>
              {map.map((row, y) => (
                  row.map((cell, x) => {
                      const isPlayer = playerPos.x === x && playerPos.y === y;
                      const isMob = mobs.some(m => m.x === x && m.y === y);
                      
                      let content = '';
                      let bg = (x + y) % 2 === 0 ? 'bg-slate-200' : 'bg-slate-100'; 
                      if (cell === 'WALL') bg = 'bg-slate-700 shadow-md z-10';
                      
                      if (cell === 'EXIT') content = '🚪';
                      if (cell === 'ITEM_IDEA') content = '💡';
                      if (cell === 'ITEM_COFFEE') content = '☕';
                      if (isMob) content = '👹';
                      if (isPlayer) content = player.avatar; 

                      return (
                          <div key={`${x}-${y}`} className={`w-8 h-8 md:w-11 md:h-11 flex items-center justify-center text-xl md:text-2xl ${bg} transition-all duration-200`}>
                              {content}
                          </div>
                      );
                  })
              ))}
          </div>

          {(gameOver || gameWon) && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
                  <h3 className={`text-3xl font-serif font-bold mb-4 ${gameWon ? 'text-green-600' : 'text-red-500'}`}>
                      {gameWon ? '区域净化完成！' : '探索失败'}
                  </h3>
                  <p className="text-slate-600 mb-8 font-medium">{message}</p>
                  
                  <div className="flex gap-4">
                     {gameWon ? (
                         <>
                            {level < MAX_LEVEL && (
                                <button onClick={handleNextLevel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition">
                                    进入下一层
                                </button>
                            )}
                            <button onClick={handleCashOut} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition">
                                带着战利品撤退
                            </button>
                         </>
                     ) : (
                         <button onClick={handleCashOut} className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition">
                            伤痕累累地离开
                         </button>
                     )}
                  </div>
              </div>
          )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 md:hidden">
            <div className="text-xs text-slate-400 mb-2">触屏控制</div>
            <button onClick={() => movePlayer(0, -1)} className="p-4 bg-slate-200 rounded-full active:bg-slate-300 shadow"><ArrowUp /></button>
            <div className="flex gap-4">
            <button onClick={() => movePlayer(-1, 0)} className="p-4 bg-slate-200 rounded-full active:bg-slate-300 shadow"><ArrowLeft /></button>
            <button onClick={() => movePlayer(1, 0)} className="p-4 bg-slate-200 rounded-full active:bg-slate-300 shadow"><ArrowRight /></button>
            </div>
            <button onClick={() => movePlayer(0, 1)} className="p-4 bg-slate-200 rounded-full active:bg-slate-300 shadow"><ArrowDown /></button>
      </div>
    </div>
  );
};

export default SportsGround;
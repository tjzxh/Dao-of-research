import React from 'react';
import { GameLocation, LocationId } from '../types';
import { FlaskConical, Coffee, BookOpen, Home } from 'lucide-react';

export const LOCATIONS: GameLocation[] = [
  {
    id: 'LAB',
    name: '恐怖实验室',
    description: '仪器轰鸣，导师魏长老常年在此坐镇。',
    icon: FlaskConical,
    npc: {
      id: 'WEI',
      name: '魏长老',
      role: '严厉导师',
      avatar: '🧙‍♂️',
      personality: '严厉、护短、追求完美、喜欢用修仙术语批评学生',
      greeting: '数据出来了吗？还是又来浪费我的灵石（经费）？'
    }
  },
  {
    id: 'CANTEEN',
    name: '八卦食堂',
    description: '消息最灵通的地方，阿姨手抖是常态。',
    icon: Coffee,
    npc: {
      id: 'AUNTIE',
      name: '王阿姨',
      role: '食堂负责人',
      avatar: '👩‍🍳',
      personality: '热情、八卦、关心学生身体但打菜手抖',
      greeting: '哎哟同学，看你瘦的，今天要不要来份红烧肉？'
    }
  },
  {
    id: 'LIBRARY',
    name: '静谧藏书阁',
    description: '在这里能听到掉头发的声音。',
    icon: BookOpen,
    npc: {
      id: 'GHOST',
      name: '论文幽灵',
      role: '延毕学长',
      avatar: '👻',
      personality: '丧、焦虑、充满智慧但消极、喜欢讲恐怖故事',
      greeting: '你也...写不出来吗...呵呵呵...'
    }
  },
  {
    id: 'DORM',
    name: '逍遥寝室',
    description: '唯一的避风港，适合躺平。',
    icon: Home,
    npc: {
      id: 'ROOMMATE',
      name: '咸鱼室友',
      role: '摸鱼大王',
      avatar: '🎮',
      personality: '懒散、乐观、游戏高手、总劝你休息',
      greeting: '别卷了，快上线，带你飞一把！'
    }
  }
];

interface WorldMapProps {
  onSelectLocation: (loc: GameLocation) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ onSelectLocation }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6 flex items-center justify-center">
        <span className="mr-2">🗺️</span> 校园地图 (World Map)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LOCATIONS.map((loc) => (
          <button
            key={loc.id}
            onClick={() => onSelectLocation(loc)}
            className="group relative bg-white border border-slate-200 rounded-2xl p-6 text-left shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <loc.icon className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 flex items-start space-x-4">
              <div className="bg-cyan-100 p-3 rounded-full text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <loc.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-cyan-700">{loc.name}</h3>
                <p className="text-slate-500 text-sm mt-1 mb-3">{loc.description}</p>
                <div className="flex items-center text-xs font-medium bg-slate-100 w-fit px-2 py-1 rounded text-slate-600">
                  <span className="mr-2">NPC:</span>
                  <span className="mr-1">{loc.npc.avatar}</span>
                  {loc.npc.name}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorldMap;

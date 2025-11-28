import React, { useState, useRef, useEffect } from 'react';
import { PlayerStats, ChatMessage, NPCDef, RandomEvent, Reward } from '../types';
import { getNPCResponse, generateNPCTask, evaluateChatReward } from '../services/geminiService';
import { Send, Loader2, Gift } from 'lucide-react';

interface NPCInteractionProps {
  player: PlayerStats;
  npc: NPCDef;
  onClose: () => void;
  onTaskTriggered: (task: RandomEvent) => void;
  onRewardTriggered: (reward: Reward) => void;
}

const NPCInteraction: React.FC<NPCInteractionProps> = ({ player, npc, onClose, onTaskTriggered, onRewardTriggered }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'npc', text: npc.greeting }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'player', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Prepare history (mimic old API structure to keep service signature compatible)
    const history = messages.map(m => ({
      role: m.sender === 'player' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    history.push({ role: 'user', parts: [{ text: userMsg.text }] });

    // 1. Get Response
    const responseText = await getNPCResponse(history, npc, player);
    
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      sender: 'npc',
      text: responseText
    }]);
    setIsTyping(false);

    // 2. Background Check for Reward
    const fullHistory = [...history, { role: 'model', parts: [{ text: responseText }] }];
    
    evaluateChatReward(fullHistory, npc).then(reward => {
        if (reward) {
             onRewardTriggered(reward);
        } else {
             // 3. If no reward, maybe random task? (Reduced chance to 10%)
             if (Math.random() < 0.10) {
                generateNPCTask(npc).then(task => onTaskTriggered(task));
             }
        }
    });
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-slate-800 p-4 text-white flex justify-between items-center shadow-md z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/20 text-2xl">
            {npc.avatar}
          </div>
          <div>
            <h3 className="font-bold">{npc.name}</h3>
            <p className="text-xs text-slate-300">{npc.role}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-sm px-3 py-1 bg-white/10 rounded-full">离开</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end space-x-2 ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'npc' && <span className="text-2xl mb-2">{npc.avatar}</span>}
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.sender === 'player' 
                ? 'bg-cyan-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
            {msg.sender === 'player' && <span className="text-2xl mb-2">{player.avatar}</span>}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center space-x-2">
             <span className="text-2xl">{npc.avatar}</span>
             <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-2">
               <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
               <span className="text-xs text-slate-500 italic">对方正在输入...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex space-x-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="打个招呼..."
            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-cyan-500 focus:ring-0 rounded-xl px-4 py-3 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NPCInteraction;
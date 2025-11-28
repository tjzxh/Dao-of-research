
export enum View {
  DASHBOARD = 'DASHBOARD',
  QUIZ_TOWER = 'QUIZ_TOWER',
  PAPER_FORGE = 'PAPER_FORGE',
  WORLD_MAP = 'WORLD_MAP',
  NPC_INTERACTION = 'NPC_INTERACTION',
  SOCIAL_HUB = 'SOCIAL_HUB',
  SPORTS = 'SPORTS',
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

export interface Quest {
  id: string;
  title: string;
  progress: number;
  maxProgress: number;
  reward: string;
  completed: boolean;
  type: 'DAILY' | 'MAIN';
}

export type PaperStatus = 'ACCEPTED' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECTED';

export interface PaperResult {
  title: string;
  tier: string; // 'CCF-A', 'SCI-1', 'Water', etc.
  score: number;
  status: PaperStatus;
  feedback: string;
  citations: number; // Current citations (starts at 0)
  potential: number; // Hidden stat: max growth rate or cap
}

export interface PlayerStats {
  stamina: number;
  maxStamina: number;
  mood: number;
  maxMood: number;
  inspiration: number;
  maxInspiration: number;
  reputation: number;
  citations: number; // Total Citations
  rankTitle: string;
  papersPublished: number;
  avatar: string; // Emoji char
  achievements: Achievement[];
  quests: Quest[];
  activities: string[]; // Log of recent actions for the Diary
  diary?: { date: string, content: string };
  motto?: string; // Short daily motto
}

export interface SkillStats {
  theory: number;
  experiment: number;
  writing: number;
  presentation: number;
  survival: number;
}

export interface GameState {
  player: PlayerStats;
  skills: SkillStats;
  inventory: PaperResult[]; // Paper objects
  currentView: View;
  activeLocation?: LocationId;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'novice' | 'adept' | 'master';
}

export interface ChatMessage {
  id: string;
  sender: 'player' | 'npc';
  text: string;
}

export interface RandomEvent {
  title: string;
  description: string;
  effect: string; // description of effect
}

export interface Reward {
  type: 'STAMINA' | 'MOOD' | 'INSPIRATION' | 'CITATION';
  amount: number;
  message: string;
}

// --- World Map & NPC Types ---

export type LocationId = 'LAB' | 'CANTEEN' | 'LIBRARY' | 'DORM';

export interface NPCDef {
  id: string;
  name: string;
  role: string;
  avatar: string;
  personality: string; // For AI prompt
  greeting: string;
}

export interface GameLocation {
  id: LocationId;
  name: string;
  description: string;
  icon: any; // Lucide icon component
  npc: NPCDef;
}

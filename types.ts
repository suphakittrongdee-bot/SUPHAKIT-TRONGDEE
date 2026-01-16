export interface LotterySet {
  prize1: string;     // 6 digits
  front3: string[];   // Array of 3 digits (usually 2 numbers)
  rear3: string[];    // Array of 3 digits (usually 2 numbers)
  rear2: string;      // 2 digits
  source: 'RNG' | 'AI' | 'HISTORY' | 'GURU';
  reasoning?: string; // Only for AI/HISTORY/GURU
  confidence?: number; // Percentage (0-100) for GURU mode
  drawDate?: string;  // The specific date these numbers are predicted for
  sources?: string[]; // List of data sources/gurus consulted
  timestamp: number;
}

export interface PastDraw {
  date: string;
  prize1: string;
  front3: string[];
  rear3: string[];
  rear2: string;
  sourceUrl?: string;
}

export interface WinRecord {
  date: string;
  prize: string;
  number: string;
}

export interface GuruPrediction {
  topPick: string;
  secondary: string[];
}

export interface GuruStat {
  id: string;
  name: string;
  alias: string;
  accuracy: number;
  wins: WinRecord[];
  description: string;
  nextDrawPrediction: GuruPrediction;
}

export enum GeneratorMode {
  RNG = 'RNG',
  AI = 'AI',
  HISTORY = 'HISTORY',
  GURU = 'GURU'
}

export interface NumberDisplayProps {
  value: string;
  label: string;
  subLabel: string;
  color?: string;
  animate?: boolean;
}
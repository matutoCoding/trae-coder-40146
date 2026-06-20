export interface RankingPlayer {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  points: number;
  wins: number;
  losses: number;
  winRate: number;
  totalGames: number;
  level: string;
}

export interface LeagueSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ongoing' | 'upcoming' | 'ended';
  totalPlayers: number;
  totalGames: number;
}

export const LEVEL_LABELS = ['青铜', '白银', '黄金', '铂金', '钻石', '大师'];

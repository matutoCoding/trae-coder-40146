import { RankingPlayer, LeagueSeason } from '@/types/ranking';

export const mockRankings: RankingPlayer[] = [
  {
    id: 'p001',
    rank: 1,
    name: '镖神张三',
    points: 2580,
    wins: 45,
    losses: 8,
    winRate: 84.9,
    totalGames: 53,
    level: '大师'
  },
  {
    id: 'p002',
    rank: 2,
    name: '飞镖侠李四',
    points: 2340,
    wins: 40,
    losses: 12,
    winRate: 76.9,
    totalGames: 52,
    level: '钻石'
  },
  {
    id: 'p003',
    rank: 3,
    name: '神射手王五',
    points: 2100,
    wins: 35,
    losses: 15,
    winRate: 70.0,
    totalGames: 50,
    level: '钻石'
  },
  {
    id: 'p004',
    rank: 4,
    name: '精准赵六',
    points: 1890,
    wins: 32,
    losses: 18,
    winRate: 64.0,
    totalGames: 50,
    level: '铂金'
  },
  {
    id: 'p005',
    rank: 5,
    name: '飞镖达人孙七',
    points: 1750,
    wins: 30,
    losses: 20,
    winRate: 60.0,
    totalGames: 50,
    level: '铂金'
  },
  {
    id: 'p006',
    rank: 6,
    name: '周八镖手',
    points: 1620,
    wins: 28,
    losses: 22,
    winRate: 56.0,
    totalGames: 50,
    level: '黄金'
  },
  {
    id: 'p007',
    rank: 7,
    name: '吴九高手',
    points: 1480,
    wins: 25,
    losses: 25,
    winRate: 50.0,
    totalGames: 50,
    level: '黄金'
  },
  {
    id: 'p008',
    rank: 8,
    name: '郑十镖客',
    points: 1350,
    wins: 22,
    losses: 28,
    winRate: 44.0,
    totalGames: 50,
    level: '白银'
  },
  {
    id: 'p009',
    rank: 9,
    name: '新手冯十一',
    points: 1200,
    wins: 20,
    losses: 30,
    winRate: 40.0,
    totalGames: 50,
    level: '白银'
  },
  {
    id: 'p010',
    rank: 10,
    name: '陈十二练',
    points: 1050,
    wins: 18,
    losses: 32,
    winRate: 36.0,
    totalGames: 50,
    level: '青铜'
  }
];

const today = new Date();
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const mockSeasons: LeagueSeason[] = [
  {
    id: 's001',
    name: '2024夏季联赛',
    startDate: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
    endDate: formatDate(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)),
    status: 'ongoing',
    totalPlayers: 128,
    totalGames: 512
  },
  {
    id: 's002',
    name: '2024秋季联赛',
    startDate: formatDate(new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)),
    endDate: formatDate(new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000)),
    status: 'upcoming',
    totalPlayers: 0,
    totalGames: 0
  }
];

export const getPlayerRank = (playerId: string): number => {
  const player = mockRankings.find(p => p.id === playerId);
  return player?.rank ?? -1;
};

export const getTopPlayers = (limit: number = 10): RankingPlayer[] => {
  return mockRankings.slice(0, limit);
};

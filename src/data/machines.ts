import { Machine } from '@/types/machine';

export const mockMachines: Machine[] = [
  {
    id: 'm001',
    name: '凤凰飞镖机',
    code: 'A-01',
    model: 'Phoenix V2',
    status: 'idle',
    pricePerHour: 60,
    location: 'A区 1号位',
    description: '专业级飞镖机，支持联网对战'
  },
  {
    id: 'm002',
    name: '飞镖王者',
    code: 'A-02',
    model: 'DartKing Pro',
    status: 'occupied',
    pricePerHour: 80,
    location: 'A区 2号位',
    description: '高端型号，配备高清显示屏'
  },
  {
    id: 'm003',
    name: '经典飞镖',
    code: 'B-01',
    model: 'Classic 2024',
    status: 'idle',
    pricePerHour: 50,
    location: 'B区 1号位',
    description: '经典款式，适合新手练习'
  },
  {
    id: 'm004',
    name: '专业竞技机',
    code: 'B-02',
    model: 'ProMatch X',
    status: 'maintenance',
    pricePerHour: 100,
    location: 'B区 2号位',
    description: '赛事指定机型，精准度极高'
  },
  {
    id: 'm005',
    name: '娱乐飞镖',
    code: 'C-01',
    model: 'FunDart 3',
    status: 'idle',
    pricePerHour: 45,
    location: 'C区 1号位',
    description: '娱乐休闲款，多种游戏模式'
  },
  {
    id: 'm006',
    name: '豪华飞镖机',
    code: 'C-02',
    model: 'Luxury Elite',
    status: 'idle',
    pricePerHour: 120,
    location: 'C区 2号位',
    description: 'VIP包间专用，顶级体验'
  },
  {
    id: 'm007',
    name: '标准飞镖机',
    code: 'D-01',
    model: 'Standard V',
    status: 'occupied',
    pricePerHour: 55,
    location: 'D区 1号位',
    description: '标准型，性价比之选'
  },
  {
    id: 'm008',
    name: '智能飞镖机',
    code: 'D-02',
    model: 'Smart AI',
    status: 'idle',
    pricePerHour: 70,
    location: 'D区 2号位',
    description: 'AI辅助教学，新手友好'
  }
];

export const getMachineById = (id: string): Machine | undefined => {
  return mockMachines.find(m => m.id === id);
};

export const getMachinesByStatus = (status: string): Machine[] => {
  return mockMachines.filter(m => m.status === status);
};

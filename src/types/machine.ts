export type MachineStatus = 'idle' | 'occupied' | 'maintenance';

export interface Machine {
  id: string;
  name: string;
  code: string;
  model: string;
  status: MachineStatus;
  pricePerHour: number;
  location: string;
  description?: string;
}

export interface TimeSlot {
  id: string;
  machineId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: MachineStatus;
  bookingId?: string;
}

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  idle: '空闲',
  occupied: '已占用',
  maintenance: '维护中'
};

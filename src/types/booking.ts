export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PeriodRule {
  id: string;
  name: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  machineId: string;
  machineName: string;
  startDate: string;
  weeks: number;
  playerName: string;
  playerPhone: string;
  pricePerHour: number;
}

export interface Booking {
  id: string;
  ruleId?: string;
  machineId: string;
  machineName: string;
  date: string;
  startTime: string;
  endTime: string;
  playerName: string;
  playerPhone: string;
  status: BookingStatus;
  totalHours: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponIds?: string[];
  createTime: string;
  remark?: string;
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: '已确认',
  pending: '待确认',
  cancelled: '已取消',
  completed: '已完成'
};

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六'
};

import { Booking, PeriodRule, BookingStatus } from '@/types/booking';
import { formatDate, addWeeks, generatePeriodDates, calculateHours } from '@/utils/date';
import { mockMachines } from './machines';

const today = new Date();
const formatToday = formatDate(today);

export const mockPeriodRules: PeriodRule[] = [
  {
    id: 'rule001',
    name: '周三晚间练镖',
    weekday: 3,
    startTime: '19:00',
    endTime: '21:00',
    machineId: 'm001',
    machineName: '凤凰飞镖机',
    startDate: formatToday,
    weeks: 8,
    playerName: '张伟',
    playerPhone: '138****8888',
    pricePerHour: 60
  },
  {
    id: 'rule002',
    name: '周末争霸赛',
    weekday: 6,
    startTime: '14:00',
    endTime: '18:00',
    machineId: 'm004',
    machineName: '专业竞技机',
    startDate: formatDate(addWeeks(today, -2)),
    weeks: 10,
    playerName: '李强',
    playerPhone: '139****6666',
    pricePerHour: 100
  },
  {
    id: 'rule003',
    name: '周一新手班',
    weekday: 1,
    startTime: '18:00',
    endTime: '20:00',
    machineId: 'm003',
    machineName: '经典飞镖',
    startDate: formatDate(addWeeks(today, 1)),
    weeks: 4,
    playerName: '王芳',
    playerPhone: '137****2222',
    pricePerHour: 50
  }
];

const generateMockBookings = (): Booking[] => {
  const bookings: Booking[] = [];
  let idCounter = 1;

  mockPeriodRules.forEach(rule => {
    const dates = generatePeriodDates(rule.startDate, rule.weekday, rule.weeks);
    const hours = calculateHours(rule.startTime, rule.endTime);
    const originalAmount = hours * rule.pricePerHour;

    dates.forEach((date, index) => {
      let status: BookingStatus;
      const ruleStartDate = new Date(rule.startDate.replace(/-/g, '/'));
      const bookingDate = new Date(date.replace(/-/g, '/'));
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      if (bookingDate < todayDate) {
        status = 'completed';
      } else if (index < 2) {
        status = 'confirmed';
      } else {
        status = 'pending';
      }

      bookings.push({
        id: `b${String(idCounter).padStart(4, '0')}`,
        ruleId: rule.id,
        machineId: rule.machineId,
        machineName: rule.machineName,
        date,
        startTime: rule.startTime,
        endTime: rule.endTime,
        playerName: rule.playerName,
        playerPhone: rule.playerPhone,
        status,
        totalHours: hours,
        originalAmount,
        discountAmount: Math.floor(originalAmount * 0.1),
        finalAmount: Math.floor(originalAmount * 0.9),
        couponIds: ['c001'],
        createTime: formatDate(new Date(ruleStartDate.getTime() + index * 7 * 24 * 60 * 60 * 1000), 'YYYY-MM-DD HH:mm:ss'),
        remark: index === 3 ? '已调整时间（原19:00）' : undefined
      });

      idCounter++;
    });
  });

  return bookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const mockBookings: Booking[] = generateMockBookings();

export const getBookingsByMachine = (machineId: string): Booking[] => {
  return mockBookings.filter(b => b.machineId === machineId && b.status !== 'cancelled');
};

export const getBookingsByDate = (date: string): Booking[] => {
  return mockBookings.filter(b => b.date === date && b.status !== 'cancelled');
};

export const getBookingsByRule = (ruleId: string): Booking[] => {
  return mockBookings.filter(b => b.ruleId === ruleId);
};

export const getBookingById = (id: string): Booking | undefined => {
  return mockBookings.find(b => b.id === id);
};

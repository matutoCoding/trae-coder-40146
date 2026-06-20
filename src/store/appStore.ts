import { Booking, PeriodRule } from '@/types/booking';
import { Bill } from '@/types/bill';
import { mockPeriodRules, mockBookings } from '@/data/bookings';
import { mockBills } from '@/data/bills';
import { mockMachines } from '@/data/machines';
import { Machine } from '@/types/machine';
import { formatDate, parseTimeToMinutes } from '@/utils/date';

export interface ConflictInfo {
  date: string;
  startTime: string;
  endTime: string;
  machineId: string;
  machineName: string;
  conflictWith: {
    bookingId: string;
    playerName: string;
    startTime: string;
    endTime: string;
  };
}

export interface BatchUpdateResult {
  updated: number;
  skipped: number;
  skippedDetails: { status: number; past: number };
  conflicts: ConflictInfo[];
}

class AppStore {
  private bookings: Booking[] = [...mockBookings];
  private rules: PeriodRule[] = [...mockPeriodRules];
  private bills: Bill[] = [...mockBills];
  private machines: Machine[] = [...mockMachines];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getBookings(): Booking[] {
    return this.bookings;
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  addBookings(newBookings: Booking[]): Booking[] {
    const conflicts: Booking[] = [];
    const duplicates: Booking[] = [];
    const toAdd: Booking[] = [];

    newBookings.forEach(nb => {
      const duplicate = this.bookings.find(
        b =>
          b.ruleId === nb.ruleId &&
          b.date === nb.date &&
          b.startTime === nb.startTime &&
          b.machineId === nb.machineId
      );
      if (duplicate) {
        duplicates.push(duplicate);
        return;
      }

      const conflict = this.bookings.find(
        b =>
          b.machineId === nb.machineId &&
          b.date === nb.date &&
          b.status !== 'cancelled' &&
          parseTimeToMinutes(nb.startTime) < parseTimeToMinutes(b.endTime) &&
          parseTimeToMinutes(nb.endTime) > parseTimeToMinutes(b.startTime)
      );
      if (conflict) {
        conflicts.push(conflict);
        return;
      }

      toAdd.push(nb);
    });

    this.bookings = [...this.bookings, ...toAdd];
    this.notify();
    console.log('[AppStore] 添加预订', {
      新增: toAdd.length,
      重复跳过: duplicates.length,
      冲突跳过: conflicts.length
    });
    return toAdd;
  }

  updateBooking(id: string, updates: Partial<Booking>) {
    this.bookings = this.bookings.map(b =>
      b.id === id ? { ...b, ...updates } : b
    );
    this.notify();
    console.log('[AppStore] 更新预订:', id, updates);
  }

  deleteBooking(id: string) {
    this.bookings = this.bookings.filter(b => b.id !== id);
    this.notify();
  }

  getRules(): PeriodRule[] {
    return this.rules;
  }

  addRule(rule: PeriodRule) {
    this.rules = [...this.rules, rule];
    this.notify();
  }

  updateRule(id: string, updates: Partial<PeriodRule>) {
    this.rules = this.rules.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    this.notify();
  }

  getBills(): Bill[] {
    return this.bills;
  }

  getBillById(id: string): Bill | undefined {
    return this.bills.find(b => b.id === id);
  }

  addBill(bill: Bill) {
    this.bills = [bill, ...this.bills];
    this.notify();
    console.log('[AppStore] 添加账单:', bill.billNo);
  }

  getMachines(): Machine[] {
    return this.machines;
  }

  getMachineById(id: string): Machine | undefined {
    return this.machines.find(m => m.id === id);
  }

  checkConflict(machineId: string, date: string, startTime: string, endTime: string, excludeId?: string): Booking | undefined {
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    return this.bookings.find(
      b =>
        b.id !== excludeId &&
        b.machineId === machineId &&
        b.date === date &&
        b.status !== 'cancelled' &&
        startMin < parseTimeToMinutes(b.endTime) &&
        endMin > parseTimeToMinutes(b.startTime)
    );
  }

  previewConflictsForRule(
    ruleId: string,
    updates: Partial<Booking>
  ): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];
    const ruleBookings = this.bookings.filter(b => b.ruleId === ruleId);
    const newMachineId = updates.machineId;
    const newStartTime = updates.startTime;
    const newEndTime = updates.endTime;

    ruleBookings.forEach(b => {
      if (b.status === 'completed' || b.status === 'cancelled') return;

      const machineId = newMachineId || b.machineId;
      const startTime = newStartTime || b.startTime;
      const endTime = newEndTime || b.endTime;

      const conflict = this.checkConflict(machineId, b.date, startTime, endTime, b.id);
      if (conflict) {
        conflicts.push({
          date: b.date,
          startTime,
          endTime,
          machineId,
          machineName: this.getMachineById(machineId)?.name || conflict.machineName,
          conflictWith: {
            bookingId: conflict.id,
            playerName: conflict.playerName,
            startTime: conflict.startTime,
            endTime: conflict.endTime
          }
        });
      }
    });

    return conflicts;
  }

  getBookingsByRule(ruleId: string): Booking[] {
    return this.bookings.filter(b => b.ruleId === ruleId);
  }

  updateBookingsByRule(
    ruleId: string,
    updates: Partial<Booking>,
    options: { onlyFuture?: boolean } = {}
  ): BatchUpdateResult {
    const { onlyFuture = true } = options;
    const now = new Date();
    const today = formatDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    let updatedCount = 0;
    let skippedStatusCount = 0;
    let skippedPastCount = 0;
    const conflicts: ConflictInfo[] = [];

    const isBookingPast = (b: Booking): boolean => {
      if (b.date < today) return true;
      if (b.date === today && parseTimeToMinutes(b.endTime) <= nowMin) return true;
      return false;
    };

    const isImmutableStatus = (b: Booking): boolean => {
      return b.status === 'completed' || b.status === 'cancelled';
    };

    this.bookings = this.bookings.map(b => {
      if (b.ruleId !== ruleId) return b;

      if (isImmutableStatus(b)) {
        skippedStatusCount++;
        return b;
      }

      if (onlyFuture && isBookingPast(b)) {
        skippedPastCount++;
        return b;
      }

      const newMachineId = updates.machineId || b.machineId;
      const newDate = updates.date || b.date;
      const newStartTime = updates.startTime || b.startTime;
      const newEndTime = updates.endTime || b.endTime;

      const conflict = this.bookings.find(
        other =>
          other.id !== b.id &&
          other.machineId === newMachineId &&
          other.date === newDate &&
          other.status !== 'cancelled' &&
          parseTimeToMinutes(newStartTime) < parseTimeToMinutes(other.endTime) &&
          parseTimeToMinutes(newEndTime) > parseTimeToMinutes(other.startTime)
      );

      if (conflict) {
        conflicts.push({
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          machineId: newMachineId,
          machineName: this.getMachineById(newMachineId)?.name || conflict.machineName,
          conflictWith: {
            bookingId: conflict.id,
            playerName: conflict.playerName,
            startTime: conflict.startTime,
            endTime: conflict.endTime
          }
        });
        return b;
      }

      updatedCount++;
      return { ...b, ...updates };
    });

    this.notify();
    console.log('[AppStore] 批量更新预订', {
      规则: ruleId,
      更新数: updatedCount,
      状态跳过: skippedStatusCount,
      过期跳过: skippedPastCount,
      冲突数: conflicts.length
    });

    return {
      updated: updatedCount,
      skipped: skippedStatusCount + skippedPastCount + conflicts.length,
      skippedDetails: {
        status: skippedStatusCount,
        past: skippedPastCount
      },
      conflicts
    };
  }
}

export const appStore = new AppStore();

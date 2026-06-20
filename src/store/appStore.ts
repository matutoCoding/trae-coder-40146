import { Booking, PeriodRule } from '@/types/booking';
import { Bill } from '@/types/bill';
import { mockPeriodRules, mockBookings } from '@/data/bookings';
import { mockBills } from '@/data/bills';
import { mockMachines } from '@/data/machines';
import { Machine } from '@/types/machine';
import { formatDate } from '@/utils/date';

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
          parseInt(nb.startTime) < parseInt(b.endTime) &&
          parseInt(nb.endTime) > parseInt(b.startTime)
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
    return this.bookings.find(
      b =>
        b.id !== excludeId &&
        b.machineId === machineId &&
        b.date === date &&
        b.status !== 'cancelled' &&
        parseInt(startTime) < parseInt(b.endTime) &&
        parseInt(endTime) > parseInt(b.startTime)
    );
  }

  getBookingsByRule(ruleId: string): Booking[] {
    return this.bookings.filter(b => b.ruleId === ruleId);
  }

  updateBookingsByRule(
    ruleId: string,
    updates: Partial<Booking>,
    options: { onlyFuture?: boolean; skipConflict?: boolean } = {}
  ): { updated: number; skipped: number; conflicts: number } {
    const { onlyFuture = true, skipConflict = false } = options;
    const now = new Date();
    const today = formatDate(now);
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedCount = 0;
    let skippedCount = 0;
    let conflictCount = 0;

    const isBookingPast = (b: Booking): boolean => {
      if (b.date < today) return true;
      if (b.date === today && b.endTime <= nowTime) return true;
      return false;
    };

    this.bookings = this.bookings.map(b => {
      if (b.ruleId !== ruleId) return b;

      if (onlyFuture && (b.status === 'completed' || b.status === 'cancelled' || isBookingPast(b))) {
        skippedCount++;
        return b;
      }

      if (skipConflict) {
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
            parseInt(newStartTime) < parseInt(other.endTime) &&
            parseInt(newEndTime) > parseInt(other.startTime)
        );

        if (conflict) {
          conflictCount++;
          return b;
        }
      }

      updatedCount++;
      return { ...b, ...updates };
    });

    this.notify();
    console.log('[AppStore] 批量更新预订', {
      规则: ruleId,
      更新数: updatedCount,
      跳过数: skippedCount,
      冲突数: conflictCount
    });

    return { updated: updatedCount, skipped: skippedCount, conflicts: conflictCount };
  }
}

export const appStore = new AppStore();

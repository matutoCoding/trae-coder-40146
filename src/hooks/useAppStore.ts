import { useState, useEffect, useCallback } from 'react';
import { appStore } from '@/store/appStore';
import { Booking, PeriodRule } from '@/types/booking';
import { Bill } from '@/types/bill';
import { Machine } from '@/types/machine';

export const useAppStore = () => {
  const [bookings, setBookings] = useState<Booking[]>(appStore.getBookings());
  const [rules, setRules] = useState<PeriodRule[]>(appStore.getRules());
  const [bills, setBills] = useState<Bill[]>(appStore.getBills());
  const [machines, setMachines] = useState<Machine[]>(appStore.getMachines());

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setBookings(appStore.getBookings());
      setRules(appStore.getRules());
      setBills(appStore.getBills());
      setMachines(appStore.getMachines());
    });
    return unsubscribe;
  }, []);

  const getBookingById = useCallback((id: string) => {
    return appStore.getBookingById(id);
  }, []);

  const addBookings = useCallback((newBookings: Booking[]) => {
    return appStore.addBookings(newBookings);
  }, []);

  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    appStore.updateBooking(id, updates);
  }, []);

  const addBill = useCallback((bill: Bill) => {
    appStore.addBill(bill);
  }, []);

  const getBillById = useCallback((id: string) => {
    return appStore.getBillById(id);
  }, []);

  const getMachineById = useCallback((id: string) => {
    return appStore.getMachineById(id);
  }, []);

  const addRule = useCallback((rule: PeriodRule) => {
    appStore.addRule(rule);
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<PeriodRule>) => {
    appStore.updateRule(id, updates);
  }, []);

  const checkConflict = useCallback(
    (machineId: string, date: string, startTime: string, endTime: string, excludeId?: string) => {
      return appStore.checkConflict(machineId, date, startTime, endTime, excludeId);
    },
    []
  );

  const getBookingsByRule = useCallback((ruleId: string) => {
    return appStore.getBookingsByRule(ruleId);
  }, []);

  const updateBookingsByRule = useCallback((
    ruleId: string,
    updates: Partial<Booking>,
    options?: { onlyFuture?: boolean; skipConflict?: boolean }
  ) => {
    return appStore.updateBookingsByRule(ruleId, updates, options);
  }, []);

  return {
    bookings,
    rules,
    bills,
    machines,
    getBookingById,
    addBookings,
    updateBooking,
    addBill,
    getBillById,
    getMachineById,
    addRule,
    updateRule,
    checkConflict,
    getBookingsByRule,
    updateBookingsByRule
  };
};

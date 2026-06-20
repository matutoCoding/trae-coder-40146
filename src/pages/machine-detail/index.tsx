import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { Machine, MACHINE_STATUS_LABEL } from '@/types/machine';
import StatusTag from '@/components/StatusTag';
import { formatDate, addDays, getWeekdayLabel, calculateHours, generateHalfHourSlots, HalfHourSlot } from '@/utils/date';
import { useAppStore } from '@/hooks/useAppStore';
import styles from './index.module.scss';

type SlotStatus = 'available' | 'occupied' | 'selected';

const MachineDetailPage: React.FC = () => {
  const router = useRouter();
  const machineId = router.params.id || 'm001';
  const initialDate = router.params.date || formatDate(new Date());
  const { getMachineById, bookings, addBookings } = useAppStore();

  const [machine, setMachine] = useState<Machine | null>(() => getMachineById(machineId));
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  useDidShow(() => {
    const m = getMachineById(machineId);
    setMachine(m);
    console.log('[MachineDetail] 页面显示,镖机:', m?.name);
  });

  const machineBookings = useMemo(() => {
    return bookings.filter(b => b.machineId === machineId && b.date === selectedDate);
  }, [bookings, machineId, selectedDate]);

  const halfHourSlots = useMemo((): HalfHourSlot[] => {
    if (!machine) return [];
    if (machine.status === 'maintenance') {
      return generateHalfHourSlots(10, 22, []).map(s => ({ ...s, occupied: true }));
    }
    return generateHalfHourSlots(10, 22, machineBookings);
  }, [machineBookings, machine]);

  const timeSlotsWithStatus = useMemo(() => {
    return halfHourSlots.map(slot => {
      const isSelected = selectedSlots.includes(slot.time);
      let status: SlotStatus = 'available';
      if (slot.occupied) {
        status = 'occupied';
      } else if (isSelected) {
        status = 'selected';
      }
      return { ...slot, status };
    });
  }, [halfHourSlots, selectedSlots]);

  const totalPrice = useMemo(() => {
    if (!machine) return '0.00';
    return (selectedSlots.length * 0.5 * machine.pricePerHour).toFixed(2);
  }, [machine, selectedSlots]);

  const currentDisplayStatus = useMemo(() => {
    if (!machine) return 'idle' as const;
    if (machine.status === 'maintenance') return 'maintenance' as const;
    if (machine.status === 'occupied') return 'occupied' as const;

    const hasBooking = machineBookings.length > 0;
    return hasBooking ? 'occupied' : 'idle';
  }, [machine, machineBookings]);

  const handleSlotClick = useCallback((slot: HalfHourSlot & { status: SlotStatus }) => {
    if (slot.status === 'occupied') {
      Taro.showToast({
        title: '该时段已被占用',
        icon: 'none'
      });
      return;
    }

    setSelectedSlots(prev => {
      if (prev.includes(slot.time)) {
        return prev.filter(t => t !== slot.time);
      } else {
        return [...prev, slot.time].sort();
      }
    });
    console.log('[MachineDetail] 选择时段:', slot.time);
  }, []);

  const handlePrevDay = useCallback(() => {
    const date = new Date(selectedDate.replace(/-/g, '/'));
    const prev = addDays(date, -1);
    setSelectedDate(formatDate(prev));
    setSelectedSlots([]);
  }, [selectedDate]);

  const handleNextDay = useCallback(() => {
    const date = new Date(selectedDate.replace(/-/g, '/'));
    const next = addDays(date, 1);
    setSelectedDate(formatDate(next));
    setSelectedSlots([]);
  }, [selectedDate]);

  const handleBook = useCallback(() => {
    if (selectedSlots.length === 0) {
      Taro.showToast({
        title: '请选择时段',
        icon: 'none'
      });
      return;
    }

    if (!machine) return;
    if (machine.status === 'maintenance') {
      Taro.showToast({
        title: '镖机维护中，暂不可预订',
        icon: 'none'
      });
      return;
    }

    const sortedSlots = [...selectedSlots].sort();
    const startTime = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    const lastHour = parseInt(lastSlot);
    const lastMin = parseInt(lastSlot.split(':')[1]);
    const endMin = lastMin + 30;
    const endHour = lastHour + Math.floor(endMin / 60);
    const finalMin = endMin % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}`;
    const hours = calculateHours(startTime, endTime);
    const originalAmount = hours * machine.pricePerHour;

    const newBooking = {
      id: `b_${Date.now()}`,
      ruleId: '',
      machineId: machine.id,
      machineName: machine.name,
      date: selectedDate,
      startTime,
      endTime,
      playerName: '散客预订',
      playerPhone: '',
      status: 'pending' as const,
      totalHours: hours,
      originalAmount,
      discountAmount: 0,
      finalAmount: originalAmount,
      couponIds: [] as string[],
      createTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    };

    const added = addBookings([newBooking]);

    if (added.length > 0) {
      Taro.showToast({
        title: '预订成功',
        icon: 'success'
      });
      setSelectedSlots([]);
      console.log('[MachineDetail] 预订成功:', added[0].id);
    } else {
      Taro.showToast({
        title: '时段冲突，预订失败',
        icon: 'none'
      });
    }
  }, [selectedSlots, machine, selectedDate, addBookings]);

  const getStatusType = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'idle':
        return 'success';
      case 'occupied':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (!machine) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '48rpx' }}>🎯</Text>
          <Text style={{ fontSize: '28rpx', color: '#86909C', marginTop: '24rpx', display: 'block' }}>
            加载中...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.machineName}>{machine.name}</Text>
        <Text className={styles.machineCode}>
          {machine.code} · {machine.model}
        </Text>
        <StatusTag
          status={MACHINE_STATUS_LABEL[currentDisplayStatus]}
          type={getStatusType(currentDisplayStatus)}
          size="sm"
        />
        <View className={styles.machineInfoRow}>
          <View className={styles.machineInfoItem}>
            <Text className={styles.machineInfoLabel}>位置</Text>
            <Text className={styles.machineInfoValue}>{machine.location}</Text>
          </View>
          <View className={styles.machineInfoItem}>
            <Text className={styles.machineInfoLabel}>单价</Text>
            <Text className={styles.machineInfoValue}>¥{machine.pricePerHour}/小时</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>镖机介绍</Text>
        <Text className={styles.descText}>
          {machine.description || '专业飞镖机，支持多种游戏模式，适合新手练习和高手竞技。'}
        </Text>
      </View>

      <View className={styles.section}>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24rpx' }}>
          <Text className={styles.sectionTitle}>时段排期</Text>
          <View style={{ display: 'flex', gap: '16rpx', alignItems: 'center' }}>
            <View
              style={{
                width: '56rpx',
                height: '56rpx',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12rpx',
                background: '#f2f3f5'
              }}
              onClick={handlePrevDay}
            >
              <Text style={{ fontSize: '28rpx', color: '#4E5969' }}>‹</Text>
            </View>
            <View style={{ minWidth: '180rpx', textAlign: 'center' }}>
              <Text style={{ fontSize: '28rpx', color: '#1D2129', fontWeight: 500 }}>
                {selectedDate}
              </Text>
              <Text style={{ fontSize: '22rpx', color: '#86909C' }}>
                {' '}{getWeekdayLabel(selectedDate)}
              </Text>
            </View>
            <View
              style={{
                width: '56rpx',
                height: '56rpx',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12rpx',
                background: '#f2f3f5'
              }}
              onClick={handleNextDay}
            >
              <Text style={{ fontSize: '28rpx', color: '#4E5969' }}>›</Text>
            </View>
          </View>
        </View>

        <View className={styles.slotLegend}>
          <View className={styles.legendItem}>
            <View
              className={styles.legendDot}
              style={{ background: 'rgba(0, 180, 42, 0.1)' }}
            />
            <Text className={styles.legendText}>可预订</Text>
          </View>
          <View className={styles.legendItem}>
            <View
              className={styles.legendDot}
              style={{ background: 'rgba(245, 63, 63, 0.1)' }}
            />
            <Text className={styles.legendText}>已占用</Text>
          </View>
          <View className={styles.legendItem}>
            <View
              className={styles.legendDot}
              style={{ background: '#FF6B35' }}
            />
            <Text className={styles.legendText}>已选择</Text>
          </View>
        </View>

        <View className={styles.timeSlots}>
          {timeSlotsWithStatus.map((slot, idx) => (
            <View
              key={idx}
              className={`${styles.slotItem} ${styles[slot.status]}`}
              onClick={() => handleSlotClick(slot)}
            >
              <Text className={styles.slotTime}>{slot.time}</Text>
            </View>
          ))}
        </View>

        {machine.status === 'maintenance' && (
          <Text style={{ fontSize: '24rpx', color: '#FF7D00', marginTop: '16rpx', textAlign: 'center', display: 'block' }}>
            镖机维护中，所有时段暂不可预订
          </Text>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>价格说明</Text>
        <View className={styles.priceSection}>
          <View className={styles.priceRow}>
            <Text className={styles.priceValue}>¥{machine.pricePerHour}</Text>
            <Text className={styles.priceUnit}>/ 小时</Text>
          </View>
          <Text className={styles.descText}>
            支持半小时粒度预订，新用户首单享8折优惠
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.totalInfo}>
          <Text className={styles.totalLabel}>
            已选 {(selectedSlots.length * 0.5).toFixed(1)} 小时
          </Text>
          <Text className={styles.totalPrice}>¥{totalPrice}</Text>
        </View>
        <View
          className={`${styles.bookBtn} ${machine.status === 'maintenance' ? styles.disabled : ''}`}
          onClick={handleBook}
        >
          <Text className={styles.bookBtnText}>
            {machine.status === 'maintenance' ? '维护中' : '立即预订'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MachineDetailPage;

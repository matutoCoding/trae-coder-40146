import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { Machine, MACHINE_STATUS_LABEL } from '@/types/machine';
import { Booking } from '@/types/booking';
import { getMachineById } from '@/data/machines';
import { getBookingsByMachine } from '@/data/bookings';
import StatusTag from '@/components/StatusTag';
import { formatDate, addDays, getWeekdayLabel } from '@/utils/date';
import styles from './index.module.scss';

type SlotStatus = 'available' | 'occupied' | 'selected';

interface TimeSlot {
  time: string;
  status: SlotStatus;
  bookingId?: string;
}

const MachineDetailPage: React.FC = () => {
  const router = useRouter();
  const machineId = router.params.id || 'm001';

  const [machine, setMachine] = useState<Machine | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  useEffect(() => {
    const m = getMachineById(machineId);
    if (m) {
      setMachine(m);
      const b = getBookingsByMachine(machineId);
      setBookings(b);
      console.log('[MachineDetail] 加载镖机信息:', m.name);
    }
  }, [machineId]);

  useDidShow(() => {
    console.log('[MachineDetail] 页面显示');
  });

  const timeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 10;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      const booking = bookings.find(
        b =>
          b.date === selectedDate &&
          b.status !== 'cancelled' &&
          parseInt(b.startTime) <= hour &&
          parseInt(b.endTime) > hour
      );

      const isSelected = selectedSlots.includes(time);
      let status: SlotStatus = 'available';
      if (booking) {
        status = 'occupied';
      } else if (isSelected) {
        status = 'selected';
      }

      slots.push({
        time,
        status,
        bookingId: booking?.id
      });
    }

    return slots;
  }, [bookings, selectedDate, selectedSlots]);

  const totalPrice = useMemo(() => {
    if (!machine) return 0;
    return (selectedSlots.length * machine.pricePerHour).toFixed(2);
  }, [machine, selectedSlots]);

  const handleSlotClick = useCallback((slot: TimeSlot) => {
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

    console.log('[MachineDetail] 确认预订', {
      machineId,
      date: selectedDate,
      slots: selectedSlots,
      totalPrice
    });

    Taro.showModal({
      title: '确认预订',
      content: `预订 ${machine?.name} ${selectedDate} ${selectedSlots.length}个时段，共计¥${totalPrice}`,
      success: res => {
        if (res.confirm) {
          Taro.showToast({
            title: '预订成功',
            icon: 'success'
          });
          setSelectedSlots([]);
        }
      }
    });
  }, [selectedSlots, machine, selectedDate, totalPrice, machineId]);

  const getStatusType = (status: string) => {
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
        <Text>加载中...</Text>
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
          status={MACHINE_STATUS_LABEL[machine.status]}
          type={getStatusType(machine.status)}
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
          {timeSlots.map(slot => (
            <View
              key={slot.time}
              className={`${styles.slotItem} ${styles[slot.status]}`}
              onClick={() => handleSlotClick(slot)}
            >
              <Text className={styles.slotTime}>{slot.time}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>价格说明</Text>
        <View className={styles.priceSection}>
          <View className={styles.priceRow}>
            <Text className={styles.priceValue}>¥{machine.pricePerHour}</Text>
            <Text className={styles.priceUnit}>/ 小时</Text>
          </View>
          <Text className={styles.descText}>
            支持多种优惠叠加，新用户首单享8折优惠
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.totalInfo}>
          <Text className={styles.totalLabel}>已选 {selectedSlots.length} 小时</Text>
          <Text className={styles.totalPrice}>¥{totalPrice}</Text>
        </View>
        <View className={styles.bookBtn} onClick={handleBook}>
          <Text className={styles.bookBtnText}>立即预订</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MachineDetailPage;

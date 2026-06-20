import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Machine, MACHINE_STATUS_LABEL } from '@/types/machine';
import { Booking } from '@/types/booking';
import StatusTag from '@/components/StatusTag';
import styles from './index.module.scss';

export interface MachineCardProps {
  machine: Machine;
  bookings?: Booking[];
  date?: string;
  onClick?: (machine: Machine) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, bookings = [], date, onClick }) => {
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

  const timeSlots = useMemo(() => {
    if (!date || machine.status === 'maintenance') {
      return null;
    }

    const startHour = 10;
    const endHour = 22;
    const totalHours = endHour - startHour;
    const slots: { hour: number; occupied: boolean }[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      const nextHour = hour + 1;
      const occupied = bookings.some(
        b =>
          b.date === date &&
          b.status !== 'cancelled' &&
          parseInt(b.startTime) <= hour &&
          parseInt(b.endTime) >= nextHour
      );
      slots.push({ hour, occupied });
    }

    const occupiedCount = slots.filter(s => s.occupied).length;
    const idleCount = totalHours - occupiedCount;

    return { slots, occupiedCount, idleCount, totalHours };
  }, [bookings, date, machine.status]);

  const displayStatus = useMemo(() => {
    if (machine.status === 'maintenance') return 'maintenance';
    if (!date) return machine.status;
    if (!timeSlots) return machine.status;
    return timeSlots.occupiedCount > 0 ? 'occupied' : 'idle';
  }, [machine.status, date, timeSlots]);

  const handleClick = () => {
    if (onClick) {
      onClick(machine);
    } else {
      Taro.navigateTo({
        url: `/pages/machine-detail/index?id=${machine.id}${date ? `&date=${date}` : ''}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{machine.name}</Text>
          <StatusTag
            status={MACHINE_STATUS_LABEL[displayStatus as keyof typeof MACHINE_STATUS_LABEL] || machine.status}
            type={getStatusType(displayStatus)}
            size="sm"
          />
        </View>
        <Text className={styles.code}>{machine.code} · {machine.model}</Text>
      </View>

      {timeSlots && (
        <View className={styles.slotOverview}>
          <View className={styles.slotBar}>
            {timeSlots.slots.map((slot, idx) => (
              <View
                key={idx}
                className={`${styles.slotBarItem} ${slot.occupied ? styles.occupied : styles.idle}`}
              />
            ))}
          </View>
          <View className={styles.slotLegend}>
            <Text className={styles.slotLegendText}>
              空闲 {timeSlots.idleCount}h · 已约 {timeSlots.occupiedCount}h
            </Text>
          </View>
        </View>
      )}

      <View className={styles.info}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>位置</Text>
          <Text className={styles.infoValue}>{machine.location}</Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>单价</Text>
          <Text className={styles.price}>¥{machine.pricePerHour}<Text className={styles.priceUnit}>/小时</Text></Text>
        </View>
      </View>

      {machine.description && (
        <Text className={styles.description}>{machine.description}</Text>
      )}
    </View>
  );
};

export default MachineCard;

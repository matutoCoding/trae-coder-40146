import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Machine, MACHINE_STATUS_LABEL, MachineStatus } from '@/types/machine';
import { Booking } from '@/types/booking';
import StatusTag from '@/components/StatusTag';
import { generateHalfHourSlots } from '@/utils/date';
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

  const dateBookings = useMemo(() => {
    if (!date) return [];
    return bookings.filter(b => b.date === date);
  }, [bookings, date]);

  const halfHourSlots = useMemo(() => {
    if (!date || machine.status === 'maintenance') {
      return null;
    }
    const slots = generateHalfHourSlots(10, 22, dateBookings);
    const occupiedCount = slots.filter(s => s.occupied).length;
    const totalCount = slots.length;
    const occupiedHours = occupiedCount / 2;
    const idleHours = (totalCount - occupiedCount) / 2;
    return { slots, occupiedCount, totalCount, occupiedHours, idleHours };
  }, [dateBookings, date, machine.status]);

  const displayStatus = useMemo((): MachineStatus => {
    if (machine.status === 'maintenance') return 'maintenance';
    if (machine.status === 'occupied') return 'occupied';
    if (!date) return machine.status;
    if (!halfHourSlots) return machine.status;
    return halfHourSlots.occupiedCount > 0 ? 'occupied' : 'idle';
  }, [machine.status, date, halfHourSlots]);

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
            status={MACHINE_STATUS_LABEL[displayStatus]}
            type={getStatusType(displayStatus)}
            size="sm"
          />
        </View>
        <Text className={styles.code}>{machine.code} · {machine.model}</Text>
      </View>

      {halfHourSlots && (
        <View className={styles.slotOverview}>
          <View className={styles.slotBar}>
            {halfHourSlots.slots.map((slot, idx) => (
              <View
                key={idx}
                className={`${styles.slotBarItem} ${slot.occupied ? styles.occupied : styles.idle}`}
              />
            ))}
          </View>
          <View className={styles.slotLegend}>
            <Text className={styles.slotLegendText}>
              空闲 {halfHourSlots.idleHours}h · 已约 {halfHourSlots.occupiedHours}h
            </Text>
          </View>
        </View>
      )}

      {machine.status === 'maintenance' && date && (
        <View className={styles.slotOverview}>
          <View className={styles.maintenanceTip}>
            <Text className={styles.maintenanceTipText}>镖机维护中，全天不可预订</Text>
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

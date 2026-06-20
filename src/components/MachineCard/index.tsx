import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Machine, MACHINE_STATUS_LABEL } from '@/types/machine';
import StatusTag from '@/components/StatusTag';
import styles from './index.module.scss';

export interface MachineCardProps {
  machine: Machine;
  onClick?: (machine: Machine) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick }) => {
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

  const handleClick = () => {
    if (onClick) {
      onClick(machine);
    } else {
      Taro.navigateTo({
        url: `/pages/machine-detail/index?id=${machine.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{machine.name}</Text>
          <StatusTag
            status={MACHINE_STATUS_LABEL[machine.status]}
            type={getStatusType(machine.status)}
            size="sm"
          />
        </View>
        <Text className={styles.code}>{machine.code} · {machine.model}</Text>
      </View>

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

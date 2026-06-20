import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Booking, BOOKING_STATUS_LABEL } from '@/types/booking';
import { getWeekdayLabel } from '@/utils/date';
import StatusTag from '@/components/StatusTag';
import styles from './index.module.scss';

export interface BookingCardProps {
  booking: Booking;
  onClick?: (booking: Booking) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick }) => {
  const getStatusType = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'info';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(booking);
    } else {
      Taro.navigateTo({
        url: `/pages/booking-detail/index?id=${booking.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.dateRow}>
          <Text className={styles.date}>{booking.date}</Text>
          <Text className={styles.weekday}>{getWeekdayLabel(booking.date)}</Text>
        </View>
        <StatusTag
          status={BOOKING_STATUS_LABEL[booking.status]}
          type={getStatusType(booking.status)}
          size="sm"
        />
      </View>

      <View className={styles.timeRow}>
        <Text className={styles.time}>{booking.startTime} - {booking.endTime}</Text>
        <Text className={styles.hours}>{booking.totalHours}小时</Text>
      </View>

      <View className={styles.infoRow}>
        <Text className={styles.machine}>{booking.machineName}</Text>
        <Text className={styles.player}>{booking.playerName}</Text>
      </View>

      <View className={styles.footer}>
        <View className={styles.priceInfo}>
          <Text className={styles.originalPrice}>¥{booking.originalAmount}</Text>
          <Text className={styles.finalPrice}>¥{booking.finalAmount}</Text>
        </View>
        {booking.remark && (
          <Text className={styles.remark}>{booking.remark}</Text>
        )}
      </View>
    </View>
  );
};

export default BookingCard;

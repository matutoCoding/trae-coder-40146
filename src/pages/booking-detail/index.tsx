import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { Booking, BOOKING_STATUS_LABEL } from '@/types/booking';
import { getBookingById } from '@/data/bookings';
import { getWeekdayLabel } from '@/utils/date';
import styles from './index.module.scss';

const BookingDetailPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.id || 'b0001';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    const b = getBookingById(bookingId);
    if (b) {
      setBooking(b);
      console.log('[BookingDetail] 加载预订信息:', b.id);
    }
  }, [bookingId]);

  useDidShow(() => {
    console.log('[BookingDetail] 页面显示');
  });

  const getStatusType = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '成功';
      case 'pending':
        return '进行中';
      case 'cancelled':
        return '失效';
      case 'completed':
        return '完成';
      default:
        return status;
    }
  };

  const handleCancel = useCallback(() => {
    if (!booking) return;

    Taro.showModal({
      title: '取消预订',
      content: '确定要取消这个预订吗？',
      success: res => {
        if (res.confirm) {
          setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
          console.log('[BookingDetail] 取消预订:', bookingId);
          Taro.showToast({
            title: '已取消预订',
            icon: 'success'
          });
        }
      }
    });
  }, [booking, bookingId]);

  const handleModify = useCallback(() => {
    setIsEditing(true);
    console.log('[BookingDetail] 修改预订');
  }, []);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    Taro.showToast({
      title: '修改成功',
      icon: 'success'
    });
    console.log('[BookingDetail] 保存修改');
  }, []);

  const handlePay = useCallback(() => {
    if (!booking) return;

    console.log('[BookingDetail] 支付预订:', bookingId);
    Taro.showModal({
      title: '确认支付',
      content: `支付金额：¥${booking.finalAmount}`,
      success: res => {
        if (res.confirm) {
          setBooking(prev => prev ? { ...prev, status: 'confirmed' } : null);
          Taro.showToast({
            title: '支付成功',
            icon: 'success'
          });
        }
      }
    });
  }, [booking, bookingId]);

  if (!booking) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canPay = booking.status === 'pending';
  const canModify = booking.status === 'pending';

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.statusBadge}>
          <Text className={styles.statusBadgeText}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </Text>
        </View>
        <Text className={styles.title}>{booking.machineName}</Text>
        <Text className={styles.subtitle}>
          {booking.date} · {getWeekdayLabel(booking.date)}
        </Text>
        <View className={styles.priceRow}>
          <Text className={styles.priceOriginal}>¥{booking.originalAmount}</Text>
          <Text className={styles.priceFinal}>¥{booking.finalAmount}</Text>
          <Text className={styles.priceLabel}>(已优惠¥{booking.discountAmount})</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>预订信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预订日期</Text>
            <Text className={styles.infoValue}>
              {booking.date} {getWeekdayLabel(booking.date)}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>时间段</Text>
            <Text className={styles.infoValue}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>时长</Text>
            <Text className={styles.infoValue}>{booking.totalHours} 小时</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>镖机</Text>
            <Text className={styles.infoValue}>{booking.machineName}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>预约人信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>姓名</Text>
            <Text className={styles.infoValue}>{booking.playerName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoValue}>{booking.playerPhone}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>费用明细</Text>
        <View className={styles.priceDetail}>
          <View className={styles.priceRowItem}>
            <Text className={styles.priceLabelItem}>原始金额</Text>
            <Text className={styles.priceValueItem}>¥{booking.originalAmount.toFixed(2)}</Text>
          </View>
          {booking.discountAmount > 0 && (
            <View className={styles.priceRowItem}>
              <Text className={styles.priceLabelItem}>
                优惠减免
                <View className={styles.couponTag}>
                  <Text className={styles.couponTagText}>
                    {booking.couponIds?.length || 0}张优惠券
                  </Text>
                </View>
              </Text>
              <Text className={`${styles.priceValueItem} ${styles.discount}`}>
                -¥{booking.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View className={styles.divider} />
          <View className={styles.priceRowItem}>
            <Text className={styles.priceLabelItem}>应付金额</Text>
            <Text className={`${styles.priceValueItem} ${styles.total}`}>
              ¥{booking.finalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {booking.remark && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>备注</Text>
          <View className={styles.remarkBox}>
            <Text className={styles.remarkText}>{booking.remark}</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>订单信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>订单编号</Text>
            <Text className={styles.infoValue}>{booking.id}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{booking.createTime}</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        {canCancel && (
          <View className={`${styles.btn} ${styles.secondary}`} onClick={handleCancel}>
            <Text className={styles.btnText}>取消预订</Text>
          </View>
        )}
        {canModify && (
          <View className={`${styles.btn} ${styles.secondary}`} onClick={handleModify}>
            <Text className={styles.btnText}>修改预订</Text>
          </View>
        )}
        {canPay && (
          <View className={`${styles.btn} ${styles.primary}`} onClick={handlePay}>
            <Text className={styles.btnText}>立即支付</Text>
          </View>
        )}
        {!canCancel && !canPay && !canModify && (
          <View className={`${styles.btn} ${styles.primary}`} style={{ flex: 1 }}>
            <Text className={styles.btnText}>预订{getStatusType(booking.status)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default BookingDetailPage;

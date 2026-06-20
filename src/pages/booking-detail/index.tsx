import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { Booking, BOOKING_STATUS_LABEL, BookingStatus } from '@/types/booking';
import { Bill, DiscountDetail } from '@/types/bill';
import { getWeekdayLabel, formatDate, calculateHours } from '@/utils/date';
import { useAppStore } from '@/hooks/useAppStore';
import { mockMachines } from '@/data/machines';
import { mockCoupons } from '@/data/coupons';
import { COUPON_TYPE_LABEL } from '@/types/coupon';
import styles from './index.module.scss';

const BookingDetailPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.id || 'b0001';
  const { getBookingById, updateBooking, addBill, getMachineById, checkConflict, machines } = useAppStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    machineId: '',
    status: 'pending' as BookingStatus,
    playerName: '',
    playerPhone: ''
  });

  const loadBooking = useCallback(() => {
    const b = getBookingById(bookingId);
    if (b) {
      setBooking(b);
      setEditForm({
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        machineId: b.machineId,
        status: b.status,
        playerName: b.playerName,
        playerPhone: b.playerPhone
      });
      console.log('[BookingDetail] 加载预订信息:', b.id, b.date, b.startTime);
    } else {
      console.log('[BookingDetail] 未找到预订:', bookingId);
      Taro.showToast({
        title: '预订不存在',
        icon: 'none'
      });
    }
  }, [bookingId, getBookingById]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  useDidShow(() => {
    loadBooking();
    console.log('[BookingDetail] 页面显示');
  });

  const getStatusText = (status: string) => {
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

  const handleModify = useCallback(() => {
    if (!booking) return;
    setIsEditing(true);
    console.log('[BookingDetail] 进入修改模式');
  }, [booking]);

  const handleCancel = useCallback(() => {
    if (!booking) return;

    Taro.showModal({
      title: '取消预订',
      content: '确定要取消这个预订吗？',
      success: res => {
        if (res.confirm) {
          updateBooking(booking.id, { status: 'cancelled' });
          setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
          console.log('[BookingDetail] 取消预订:', bookingId);
          Taro.showToast({
            title: '已取消预订',
            icon: 'success'
          });
        }
      }
    });
  }, [booking, bookingId, updateBooking]);

  const handleSave = useCallback(() => {
    if (!booking) return;

    if (!editForm.date || !editForm.startTime || !editForm.endTime) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    const conflict = checkConflict(
      editForm.machineId,
      editForm.date,
      editForm.startTime,
      editForm.endTime,
      booking.id
    );
    if (conflict) {
      Taro.showModal({
        title: '时段冲突',
        content: `该镖机在 ${editForm.date} ${editForm.startTime}-${editForm.endTime} 已被占用`,
        showCancel: false
      });
      return;
    }

    const machine = getMachineById(editForm.machineId);
    const hours = calculateHours(editForm.startTime, editForm.endTime);
    const originalAmount = Math.round(hours * (machine?.pricePerHour || 50) * 100) / 100;
    const discountRate = booking.discountAmount > 0 ? booking.discountAmount / booking.originalAmount : 0;
    const discountAmount = Math.round(originalAmount * discountRate * 100) / 100;

    const updates: Partial<Booking> = {
      date: editForm.date,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      machineId: editForm.machineId,
      machineName: machine?.name || booking.machineName,
      status: editForm.status,
      playerName: editForm.playerName,
      playerPhone: editForm.playerPhone,
      totalHours: hours,
      originalAmount,
      discountAmount,
      finalAmount: Math.round((originalAmount - discountAmount) * 100) / 100
    };

    updateBooking(booking.id, updates);
    setBooking(prev => prev ? { ...prev, ...updates } : null);
    setIsEditing(false);

    console.log('[BookingDetail] 保存修改:', bookingId, updates);
    Taro.showToast({
      title: '修改成功',
      icon: 'success'
    });
  }, [booking, bookingId, editForm, updateBooking, checkConflict, getMachineById]);

  const handlePay = useCallback(() => {
    if (!booking) return;

    console.log('[BookingDetail] 支付预订:', bookingId);
    Taro.showModal({
      title: '确认支付',
      content: `支付金额：¥${booking.finalAmount}`,
      success: res => {
        if (res.confirm) {
          updateBooking(booking.id, { status: 'confirmed' });
          setBooking(prev => prev ? { ...prev, status: 'confirmed' } : null);

          const discounts: DiscountDetail[] = [];
          if (booking.couponIds && booking.couponIds.length > 0) {
            booking.couponIds.forEach(cid => {
              const coupon = mockCoupons.find(c => c.id === cid);
              if (coupon) {
                discounts.push({
                  couponId: coupon.id,
                  couponName: coupon.name,
                  discountType: coupon.type,
                  discountAmount: Math.round(booking.discountAmount / booking.couponIds!.length * 100) / 100
                });
              }
            });
          }

          const machine = getMachineById(booking.machineId);

          const newBill: Bill = {
            id: `bill_${Date.now()}`,
            billNo: `BD${Date.now()}`,
            bookingId: booking.id,
            playerName: booking.playerName,
            playerPhone: booking.playerPhone,
            items: [
              {
                id: `item_${Date.now()}`,
                name: `${machine?.name || booking.machineName} ${booking.totalHours}小时`,
                quantity: booking.totalHours,
                unitPrice: machine?.pricePerHour || 50,
                amount: booking.originalAmount,
                type: 'booking',
                referenceId: booking.id
              }
            ],
            originalAmount: booking.originalAmount,
            discountAmount: booking.discountAmount,
            finalAmount: booking.finalAmount,
            discounts,
            status: 'paid',
            payTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            createTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
          };

          addBill(newBill);
          console.log('[BookingDetail] 生成账单:', newBill.billNo);

          Taro.showToast({
            title: '支付成功',
            icon: 'success'
          });
        }
      }
    });
  }, [booking, bookingId, updateBooking, addBill, getMachineById]);

  const handleSelectMachine = useCallback(() => {
    const machineOptions = machines.map(m => `${m.code} ${m.name}`);
    Taro.showActionSheet({
      itemList: machineOptions,
      success: res => {
        const selected = machines[res.tapIndex];
        if (selected) {
          setEditForm(prev => ({ ...prev, machineId: selected.id }));
        }
      }
    });
  }, [machines]);

  const handleSelectStatus = useCallback(() => {
    const statusList: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
    const statusLabels = statusList.map(s => BOOKING_STATUS_LABEL[s]);
    Taro.showActionSheet({
      itemList: statusLabels,
      success: res => {
        setEditForm(prev => ({ ...prev, status: statusList[res.tapIndex] }));
      }
    });
  }, []);

  if (!booking) {
    return (
      <ScrollView scrollY className={styles.page}>
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '48rpx' }}>🎯</Text>
          <Text style={{ fontSize: '28rpx', color: '#86909C', marginTop: '24rpx', display: 'block' }}>
            加载中...
          </Text>
          <Text style={{ fontSize: '24rpx', color: '#C9CDD4', marginTop: '12rpx', display: 'block' }}>
            预订ID: {bookingId}
          </Text>
        </View>
      </ScrollView>
    );
  }

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canPay = booking.status === 'pending';
  const canModify = booking.status === 'pending' || booking.status === 'confirmed';
  const selectedMachineName = getMachineById(editForm.machineId)?.name || '选择镖机';

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
          {booking.discountAmount > 0 && (
            <Text className={styles.priceOriginal}>¥{booking.originalAmount.toFixed(2)}</Text>
          )}
          <Text className={styles.priceFinal}>¥{booking.finalAmount.toFixed(2)}</Text>
          {booking.discountAmount > 0 && (
            <Text className={styles.priceLabel}>(已优惠¥{booking.discountAmount.toFixed(2)})</Text>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>预订信息</Text>
        {!isEditing ? (
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
        ) : (
          <View className={styles.infoList}>
            <View className={styles.adjustItem}>
              <Text className={styles.adjustLabel}>预订日期</Text>
              <Input
                className={styles.adjustInput}
                value={editForm.date}
                onInput={e => setEditForm(prev => ({ ...prev, date: e.detail.value }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View className={styles.adjustItem}>
              <Text className={styles.adjustLabel}>开始时间</Text>
              <Input
                className={styles.adjustInput}
                type="digit"
                value={editForm.startTime}
                onInput={e => setEditForm(prev => ({ ...prev, startTime: e.detail.value }))}
                placeholder="如 19:00"
              />
            </View>
            <View className={styles.adjustItem}>
              <Text className={styles.adjustLabel}>结束时间</Text>
              <Input
                className={styles.adjustInput}
                type="digit"
                value={editForm.endTime}
                onInput={e => setEditForm(prev => ({ ...prev, endTime: e.detail.value }))}
                placeholder="如 21:00"
              />
            </View>
            <View className={styles.adjustItem} onClick={handleSelectMachine}>
              <Text className={styles.adjustLabel}>镖机</Text>
              <Text
                className={styles.adjustInput}
                style={{ textAlign: 'right', color: selectedMachineName ? '#1D2129' : '#C9CDD4' }}
              >
                {selectedMachineName} ›
              </Text>
            </View>
            <View className={styles.adjustItem} onClick={handleSelectStatus}>
              <Text className={styles.adjustLabel}>状态</Text>
              <Text className={styles.adjustInput} style={{ textAlign: 'right' }}>
                {BOOKING_STATUS_LABEL[editForm.status]} ›
              </Text>
            </View>
            <View className={styles.adjustItem}>
              <Text className={styles.adjustLabel}>预约人</Text>
              <Input
                className={styles.adjustInput}
                value={editForm.playerName}
                onInput={e => setEditForm(prev => ({ ...prev, playerName: e.detail.value }))}
                placeholder="姓名"
              />
            </View>
            <View className={styles.adjustItem}>
              <Text className={styles.adjustLabel}>联系电话</Text>
              <Input
                className={styles.adjustInput}
                type="number"
                value={editForm.playerPhone}
                onInput={e => setEditForm(prev => ({ ...prev, playerPhone: e.detail.value }))}
                placeholder="手机号"
              />
            </View>
          </View>
        )}
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

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>订单信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>订单编号</Text>
            <Text className={styles.infoValue}>{booking.id}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预约人</Text>
            <Text className={styles.infoValue}>{booking.playerName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoValue}>{booking.playerPhone}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{booking.createTime}</Text>
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

      <View className={styles.bottomBar}>
        {isEditing ? (
          <>
            <View className={`${styles.btn} ${styles.secondary}`} onClick={() => setIsEditing(false)}>
              <Text className={styles.btnText}>取消</Text>
            </View>
            <View className={`${styles.btn} ${styles.primary}`} onClick={handleSave}>
              <Text className={styles.btnText}>保存修改</Text>
            </View>
          </>
        ) : (
          <>
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
                <Text className={styles.btnText}>预订{getStatusText(booking.status)}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default BookingDetailPage;

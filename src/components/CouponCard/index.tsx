import React from 'react';
import { View, Text } from '@tarojs/components';
import { Coupon, COUPON_TYPE_LABEL } from '@/types/coupon';
import { formatCouponValue } from '@/utils/coupon';
import StatusTag from '@/components/StatusTag';
import styles from './index.module.scss';

export interface CouponCardProps {
  coupon: Coupon;
  onClick?: (coupon: Coupon) => void;
  selected?: boolean;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onClick, selected }) => {
  const getCouponTypeColor = (type: string) => {
    switch (type) {
      case 'discount':
        return '#F53F3F';
      case 'fullReduce':
        return '#FF6B35';
      case 'deduct':
        return '#FF7D00';
      default:
        return '#FF6B35';
    }
  };

  const getStatusType = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'used':
        return 'info';
      case 'expired':
        return 'error';
      default:
        return 'info';
    }
  };

  const typeColor = getCouponTypeColor(coupon.type);

  return (
    <View
      className={`${styles.card} ${selected ? styles.selected : ''} ${coupon.status !== 'available' ? styles.disabled : ''}`}
      style={{ borderLeftColor: typeColor }}
      onClick={() => onClick?.(coupon)}
    >
      <View className={styles.left}>
        <View className={styles.valueRow}>
          {coupon.type === 'discount' && (
            <Text className={styles.value}>{coupon.value}</Text>
          )}
          {coupon.type !== 'discount' && (
            <>
              <Text className={styles.currency}>¥</Text>
              <Text className={styles.value}>{coupon.value}</Text>
            </>
          )}
          {coupon.type === 'discount' && (
            <Text className={styles.unit}>折</Text>
          )}
        </View>
        <Text className={styles.typeLabel}>{COUPON_TYPE_LABEL[coupon.type]}</Text>
      </View>

      <View className={styles.right}>
        <View className={styles.header}>
          <Text className={styles.name}>{coupon.name}</Text>
          <StatusTag
            status={coupon.status}
            type={getStatusType(coupon.status)}
            size="sm"
            text={coupon.status === 'available' ? '可使用' : coupon.status === 'used' ? '已使用' : '已过期'}
          />
        </View>
        <Text className={styles.desc}>{coupon.description}</Text>
        {coupon.minAmount && coupon.type !== 'deduct' && (
          <Text className={styles.condition}>满{coupon.minAmount}元可用</Text>
        )}
        <Text className={styles.validity}>有效期：{coupon.validStart} 至 {coupon.validEnd}</Text>
      </View>

      {selected && <View className={styles.selectedMark} />}
    </View>
  );
};

export default CouponCard;

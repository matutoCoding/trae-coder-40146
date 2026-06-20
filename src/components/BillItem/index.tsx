import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Bill, BILL_STATUS_LABEL } from '@/types/bill';
import StatusTag from '@/components/StatusTag';
import styles from './index.module.scss';

export interface BillItemProps {
  bill: Bill;
  onClick?: (bill: Bill) => void;
}

const BillItemComponent: React.FC<BillItemProps> = ({ bill, onClick }) => {
  const getStatusType = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'unpaid':
        return 'warning';
      case 'refunded':
        return 'error';
      default:
        return 'info';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(bill);
    } else {
      Taro.navigateTo({
        url: `/pages/bill-detail/index?id=${bill.id}`
      });
    }
  };

  const itemCount = bill.items.length;
  const firstItem = bill.items[0];

  return (
    <View className={styles.item} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.billNo}>{bill.billNo}</Text>
        <StatusTag
          status={BILL_STATUS_LABEL[bill.status]}
          type={getStatusType(bill.status)}
          size="sm"
        />
      </View>

      <View className={styles.content}>
        <View className={styles.itemInfo}>
          <Text className={styles.itemName}>{firstItem?.name || '消费'}</Text>
          {itemCount > 1 && (
            <Text className={styles.moreItems}>等{itemCount}项</Text>
          )}
        </View>
        <View className={styles.priceInfo}>
          {bill.discountAmount > 0 && (
            <Text className={styles.original}>¥{bill.originalAmount}</Text>
          )}
          <Text className={styles.final}>¥{bill.finalAmount}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.player}>{bill.playerName}</Text>
        <Text className={styles.time}>{bill.createTime}</Text>
      </View>
    </View>
  );
};

export default BillItemComponent;

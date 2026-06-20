import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { Bill, BILL_STATUS_LABEL, BillItem } from '@/types/bill';
import { getBillById } from '@/data/bills';
import { COUPON_TYPE_LABEL } from '@/types/coupon';
import styles from './index.module.scss';

const BillDetailPage: React.FC = () => {
  const router = useRouter();
  const billId = router.params.id || 'bill001';

  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const b = getBillById(billId);
    if (b) {
      setBill(b);
      console.log('[BillDetail] 加载账单信息:', b.billNo);
    }
  }, [billId]);

  useDidShow(() => {
    console.log('[BillDetail] 页面显示');
  });

  const handlePay = useCallback(() => {
    if (!bill) return;

    console.log('[BillDetail] 支付账单:', billId);
    Taro.showModal({
      title: '确认支付',
      content: `支付金额：¥${bill.finalAmount}`,
      success: res => {
        if (res.confirm) {
          setBill(prev => prev ? { ...prev, status: 'paid', payTime: new Date().toISOString() } : null);
          Taro.showToast({
            title: '支付成功',
            icon: 'success'
          });
        }
      }
    });
  }, [bill, billId]);

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'booking':
        return '预订';
      case 'product':
        return '商品';
      case 'service':
        return '服务';
      default:
        return type;
    }
  };

  if (!bill) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const canPay = bill.status === 'unpaid';

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.statusBadge}>
          <Text className={styles.statusBadgeText}>
            {BILL_STATUS_LABEL[bill.status]}
          </Text>
        </View>
        <Text className={styles.amountLabel}>账单金额</Text>
        <Text className={styles.amountValue}>¥{bill.finalAmount.toFixed(2)}</Text>
        <Text className={styles.billNo}>账单号：{bill.billNo}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>消费明细</Text>
        <View className={styles.itemList}>
          {bill.items.map((item: BillItem) => (
            <View key={item.id} className={styles.billItem}>
              <View className={styles.itemInfo}>
                <Text className={styles.itemName}>{item.name}</Text>
                <Text className={styles.itemDesc}>
                  {getItemTypeLabel(item.type)} · ¥{item.unitPrice}/件
                </Text>
              </View>
              <View className={styles.itemAmount}>
                <Text className={styles.itemPrice}>¥{item.amount.toFixed(2)}</Text>
                <Text className={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {bill.discounts.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>优惠明细</Text>
          <View className={styles.discountList}>
            {bill.discounts.map((discount, index) => (
            <View key={index} className={styles.discountItem}>
              <View className={styles.discountInfo}>
                <View className={styles.discountTag}>
                  <Text className={styles.discountTagText}>
                    {COUPON_TYPE_LABEL[discount.discountType as keyof typeof COUPON_TYPE_LABEL] || '优惠'}
                  </Text>
                </View>
                <Text className={styles.discountName}>{discount.couponName}</Text>
              </View>
              <Text className={styles.discountAmount}>
                -¥{discount.discountAmount.toFixed(2)}
              </Text>
            </View>
          ))}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>金额汇总</Text>
        <View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>商品小计</Text>
            <Text className={styles.summaryValue}>¥{bill.originalAmount.toFixed(2)}</Text>
          </View>
          {bill.discountAmount > 0 && (
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>优惠减免</Text>
              <Text className={styles.summaryValue} style={{ color: '#F53F3F' }}>
                -¥{bill.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View className={`${styles.summaryRow} ${styles.total}`}>
            <Text className={styles.summaryLabel}>应付金额</Text>
            <Text className={`${styles.summaryValue} ${styles.total}`}>
              ¥{bill.finalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>订单信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>下单人</Text>
            <Text className={styles.infoValue}>{bill.playerName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoValue}>{bill.playerPhone}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{bill.createTime}</Text>
          </View>
          {bill.payTime && (
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>支付时间</Text>
              <Text className={styles.infoValue}>{bill.payTime}</Text>
            </View>
          )}
        </View>
      </View>

      {bill.remark && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>备注</Text>
          <View className={styles.remarkBox}>
            <Text className={styles.remarkText}>{bill.remark}</Text>
          </View>
        </View>
      )}

      {canPay && (
        <View className={styles.bottomBar}>
          <View className={styles.totalInfo}>
            <Text className={styles.totalLabel}>应付金额</Text>
            <Text className={styles.totalPrice}>¥{bill.finalAmount.toFixed(2)}</Text>
          </View>
          <View className={styles.payBtn} onClick={handlePay}>
            <Text className={styles.payBtnText}>立即支付</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BillDetailPage;

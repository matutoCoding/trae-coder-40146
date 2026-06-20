import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { Coupon, DiscountStep, COUPON_TYPE_LABEL } from '@/types/coupon';
import { mockCoupons, getAvailableCoupons } from '@/data/coupons';
import CouponCard from '@/components/CouponCard';
import {
  calculateWithCoupons,
  getDefaultDiscountSteps,
  CalculationResult
} from '@/utils/coupon';
import styles from './index.module.scss';

type TabType = 'calc' | 'list' | 'order';

const CouponsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calc');
  const [coupons] = useState<Coupon[]>(mockCoupons);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>(['c002', 'c001', 'c003']);
  const [inputAmount, setInputAmount] = useState<string>('500');
  const [discountSteps, setDiscountSteps] = useState<DiscountStep[]>(getDefaultDiscountSteps());

  useDidShow(() => {
    console.log('[CouponsPage] 页面显示');
  });

  usePullDownRefresh(() => {
    console.log('[CouponsPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const availableCoupons = useMemo(() => getAvailableCoupons(), []);

  const usedCoupons = useMemo(
    () => coupons.filter(c => c.status === 'used' || c.status === 'expired'),
    [coupons]
  );

  const calcResult: CalculationResult = useMemo(() => {
    const amount = parseFloat(inputAmount) || 0;
    const selectedCoupons = coupons.filter(c => selectedCouponIds.includes(c.id));
    return calculateWithCoupons(amount, selectedCoupons, discountSteps);
  }, [inputAmount, coupons, selectedCouponIds, discountSteps]);

  const quickAmounts = [100, 200, 500, 1000];

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    console.log('[CouponsPage] 切换Tab:', tab);
  }, []);

  const handleAmountInput = useCallback((value: string) => {
    const numValue = value.replace(/[^\d.]/g, '');
    setInputAmount(numValue);
    console.log('[CouponsPage] 输入金额:', numValue);
  }, []);

  const handleQuickAmount = useCallback((amount: number) => {
    setInputAmount(String(amount));
    console.log('[CouponsPage] 快捷金额:', amount);
  }, []);

  const handleCouponToggle = useCallback((coupon: Coupon) => {
    setSelectedCouponIds(prev => {
      if (prev.includes(coupon.id)) {
        console.log('[CouponsPage] 取消选择优惠券:', coupon.id);
        return prev.filter(id => id !== coupon.id);
      } else {
        console.log('[CouponsPage] 选择优惠券:', coupon.id);
        return [...prev, coupon.id];
      }
    });
  }, []);

  const handleStepToggle = useCallback((stepId: string) => {
    setDiscountSteps(prev =>
      prev.map(s => (s.id === stepId ? { ...s, enabled: !s.enabled } : s))
    );
    console.log('[CouponsPage] 切换优惠步骤:', stepId);
  }, []);

  const handleStepMove = useCallback((stepId: string, direction: 'up' | 'down') => {
    setDiscountSteps(prev => {
      const index = prev.findIndex(s => s.id === stepId);
      if (index === -1) return prev;

      const steps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= steps.length) return prev;

      [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
      steps[index] = { ...steps[index], order: index + 1 };
      steps[targetIndex] = { ...steps[targetIndex], order: targetIndex + 1 };

      return steps.sort((a, b) => a.order - b.order);
    });
    console.log('[CouponsPage] 移动优惠步骤:', stepId, direction);
  }, []);

  const tabs = [
    { key: 'calc' as TabType, label: '优惠计算' },
    { key: 'list' as TabType, label: '优惠券' },
    { key: 'order' as TabType, label: '顺序配置' }
  ];

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <View>
            <Text className={styles.title}>优惠中心</Text>
            <Text className={styles.subtitle}>  多重优惠叠加，省钱更划算</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{availableCoupons.length}</Text>
            <Text className={styles.statLabel}>可用优惠券</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{discountSteps.filter(s => s.enabled).length}</Text>
            <Text className={styles.statLabel}>已启用优惠</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>¥{calcResult.totalDiscount}</Text>
            <Text className={styles.statLabel}>预计节省</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      {activeTab === 'calc' && (
        <View>
          <View className={styles.calcCard}>
            <Text className={styles.calcTitle}>优惠计算器</Text>

            <View className={styles.amountInput}>
              <Text className={styles.amountLabel}>消费金额</Text>
              <Input
                className={styles.amountInputField}
                type="digit"
                value={inputAmount}
                onInput={e => handleAmountInput(e.detail.value)}
                placeholder="请输入金额"
              />
              <Text className={styles.amountLabel}>元</Text>
            </View>

            <View className={styles.quickAmounts}>
              {quickAmounts.map(amount => (
                <View
                  key={amount}
                  className={`${styles.quickAmount} ${parseFloat(inputAmount) === amount ? styles.active : ''}`}
                  onClick={() => handleQuickAmount(amount)}
                >
                  <Text className={styles.quickAmountText}>¥{amount}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.couponSelectTip}>
              已选择 {selectedCouponIds.length} 张优惠券
            </Text>

            <View className={styles.resultSection}>
              <View className={styles.resultRow}>
                <Text className={styles.resultLabel}>原始金额</Text>
                <Text className={styles.resultValue}>¥{calcResult.originalAmount.toFixed(2)}</Text>
              </View>
              <View className={styles.resultRow}>
                <Text className={styles.resultLabel}>优惠金额</Text>
                <Text className={`${styles.resultValue} ${styles.discount}`}>
                  -¥{calcResult.totalDiscount.toFixed(2)}
                </Text>
              </View>
              <View className={styles.resultRow}>
                <Text className={styles.resultLabel}>实付金额</Text>
                <Text className={`${styles.resultValue} ${styles.final}`}>
                  ¥{calcResult.finalAmount.toFixed(2)}
                </Text>
              </View>
            </View>

            {calcResult.hasNegativeFloor && (
              <View className={styles.floorWarning}>
                <Text className={styles.floorWarningText}>
                  ⚠️ 优惠后金额为负，已触发负值兜底，实付0元
                </Text>
              </View>
            )}

            {calcResult.steps.length > 0 && (
              <View className={styles.stepsSection}>
                <Text className={styles.stepsTitle}>计算过程</Text>
                {calcResult.steps.map((step, index) => (
                  <View key={index} className={styles.stepItem}>
                    <View className={styles.stepOrder}>
                      <Text className={styles.stepOrderText}>{index + 1}</Text>
                    </View>
                    <View className={styles.stepInfo}>
                      <Text className={styles.stepName}>{step.couponName}</Text>
                      <Text className={styles.stepDetail}>
                        ¥{step.beforeAmount.toFixed(2)} → ¥{step.afterAmount.toFixed(2)}
                      </Text>
                    </View>
                    <Text className={styles.stepDiscount}>
                      -¥{step.discountAmount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text className={styles.sectionTitle}>选择优惠券</Text>
          <View className={styles.couponList}>
            {availableCoupons.map(coupon => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                selected={selectedCouponIds.includes(coupon.id)}
                onClick={handleCouponToggle}
              />
            ))}
          </View>
        </View>
      )}

      {activeTab === 'list' && (
        <View>
          <Text className={styles.sectionTitle}>可用优惠券 ({availableCoupons.length})</Text>
          <View className={styles.couponList}>
            {availableCoupons.length > 0 ? (
              availableCoupons.map(coupon => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🎫</Text>
                <Text className={styles.emptyText}>暂无可用优惠券</Text>
              </View>
            )}
          </View>

          <Text className={styles.sectionTitle}>已使用/已过期 ({usedCoupons.length})</Text>
          <View className={styles.couponList}>
            {usedCoupons.length > 0 ? (
              usedCoupons.map(coupon => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📭</Text>
                <Text className={styles.emptyText}>暂无记录</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {activeTab === 'order' && (
        <View className={styles.orderConfig}>
          <Text className={styles.orderConfigTitle}>优惠顺序配置</Text>
          <Text className={styles.orderConfigDesc}>
            优惠计算顺序会影响最终优惠金额。拖动调整顺序，开关控制是否启用该类型优惠。
            {'\n'}
            系统默认顺序：满减 → 折扣 → 抵扣
          </Text>

          <View className={styles.orderList}>
            {discountSteps.map((step, index) => (
              <View key={step.id} className={styles.orderItem}>
                <View className={styles.orderHandle}>
                  <View className={styles.orderHandleDot} />
                  <View className={styles.orderHandleDot} />
                  <View className={styles.orderHandleDot} />
                </View>

                <View className={styles.orderContent}>
                  <Text className={styles.orderName}>{step.name}</Text>
                  <Text className={styles.orderType}>
                    {COUPON_TYPE_LABEL[step.type]} · 第{step.order}步
                  </Text>
                </View>

                <View className={styles.orderActions}>
                  <View
                    className={styles.orderAction}
                    onClick={() => handleStepMove(step.id, 'up')}
                  >
                    <Text className={styles.orderActionText}>↑</Text>
                  </View>
                  <View
                    className={styles.orderAction}
                    onClick={() => handleStepMove(step.id, 'down')}
                  >
                    <Text className={styles.orderActionText}>↓</Text>
                  </View>
                </View>

                <View
                  className={`${styles.orderSwitch} ${step.enabled ? styles.active : ''}`}
                  onClick={() => handleStepToggle(step.id)}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CouponsPage;

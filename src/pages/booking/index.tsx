import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { PeriodRule, Booking, WEEKDAY_LABEL, Weekday, BookingStatus } from '@/types/booking';
import { mockMachines } from '@/data/machines';
import BookingCard from '@/components/BookingCard';
import { getWeekdayLabel, formatDate, generatePeriodDates, calculateHours } from '@/utils/date';
import { useAppStore } from '@/hooks/useAppStore';
import styles from './index.module.scss';

type TabType = 'rules' | 'bookings';

const TIME_HOURS = ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
const TIME_MINS = ['00', '30'];

const BookingPage: React.FC = () => {
  const { bookings, rules, addBookings, addRule, updateRule, updateBookingsByRule, machines } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('rules');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<PeriodRule | null>(null);

  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchRule, setBatchRule] = useState<PeriodRule | null>(null);
  const [batchForm, setBatchForm] = useState({
    startTime: '19:00',
    endTime: '21:00',
    machineId: '',
    onlyFuture: true
  });

  const [formData, setFormData] = useState({
    name: '',
    weekday: 1 as Weekday,
    startTime: '19:00',
    endTime: '21:00',
    machineId: 'm001',
    startDate: formatDate(new Date()),
    weeks: 4,
    playerName: '',
    playerPhone: ''
  });

  useDidShow(() => {
    console.log('[BookingPage] 页面显示');
  });

  usePullDownRefresh(() => {
    console.log('[BookingPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    const sortedBookings = [...bookings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedBookings.forEach(booking => {
      if (!groups[booking.date]) {
        groups[booking.date] = [];
      }
      groups[booking.date].push(booking);
    });

    return groups;
  }, [bookings]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    console.log('[BookingPage] 切换Tab:', tab);
  }, []);

  const handleAddRule = useCallback(() => {
    setEditingRule(null);
    setFormData({
      name: '',
      weekday: 1,
      startTime: '19:00',
      endTime: '21:00',
      machineId: 'm001',
      startDate: formatDate(new Date()),
      weeks: 4,
      playerName: '',
      playerPhone: ''
    });
    setShowModal(true);
    console.log('[BookingPage] 新建周期规则');
  }, []);

  const handleEditRule = useCallback((rule: PeriodRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      weekday: rule.weekday,
      startTime: rule.startTime,
      endTime: rule.endTime,
      machineId: rule.machineId,
      startDate: rule.startDate,
      weeks: rule.weeks,
      playerName: rule.playerName,
      playerPhone: rule.playerPhone
    });
    setShowModal(true);
    console.log('[BookingPage] 编辑周期规则:', rule.id);
  }, []);

  const handleBatchAdjust = useCallback((rule: PeriodRule) => {
    setBatchRule(rule);
    setBatchForm({
      startTime: rule.startTime,
      endTime: rule.endTime,
      machineId: rule.machineId,
      onlyFuture: true
    });
    setShowBatchModal(true);
    console.log('[BookingPage] 批量调整:', rule.id);
  }, []);

  const handleBatchSave = useCallback(() => {
    if (!batchRule) return;

    const machine = machines.find(m => m.id === batchForm.machineId);
    const hours = calculateHours(batchForm.startTime, batchForm.endTime);
    const pricePerHour = machine?.pricePerHour || 50;

    const updates: Partial<Booking> = {
      startTime: batchForm.startTime,
      endTime: batchForm.endTime,
      machineId: batchForm.machineId,
      machineName: machine?.name || batchRule.machineName,
      totalHours: hours,
      originalAmount: Math.round(hours * pricePerHour * 100) / 100,
      finalAmount: Math.round(hours * pricePerHour * 100) / 100
    };

    const result = updateBookingsByRule(
      batchRule.id,
      updates,
      { onlyFuture: batchForm.onlyFuture, skipConflict: true }
    );

    setShowBatchModal(false);

    if (result.conflicts > 0 || result.skipped > 0) {
      Taro.showModal({
        title: '批量调整完成',
        content: `成功更新${result.updated}条\n跳过${result.skipped + result.conflicts}条（已过期/已完成/冲突）`,
        showCancel: false
      });
    } else {
      Taro.showToast({
        title: `已更新${result.updated}条`,
        icon: 'success'
      });
    }
  }, [batchRule, batchForm, machines, updateBookingsByRule]);

  const handleGenerateBookings = useCallback(
    (rule: PeriodRule) => {
      const dates = generatePeriodDates(rule.startDate, rule.weekday, rule.weeks);
      const hours = calculateHours(rule.startTime, rule.endTime);
      const machine = mockMachines.find(m => m.id === rule.machineId);
      const pricePerHour = machine?.pricePerHour || 50;

      const newBookings: Booking[] = dates.map((date, index) => {
        const originalAmount = hours * pricePerHour;
        return {
          id: `b_new_${Date.now()}_${index}`,
          ruleId: rule.id,
          machineId: rule.machineId,
          machineName: rule.machineName,
          date,
          startTime: rule.startTime,
          endTime: rule.endTime,
          playerName: rule.playerName,
          playerPhone: rule.playerPhone,
          status: 'pending',
          totalHours: hours,
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount,
          couponIds: [],
          createTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
        };
      });

      console.log('[BookingPage] 尝试生成预订:', newBookings.length, '条');
      const added = addBookings(newBookings);
      const skipped = newBookings.length - added.length;

      if (skipped > 0) {
        Taro.showModal({
          title: '预订生成完成',
          content: `成功生成${added.length}条预订\n跳过${skipped}条（重复或时段冲突）`,
          showCancel: false
        });
      } else {
        Taro.showToast({
          title: `已生成${added.length}条预订`,
          icon: 'success'
        });
      }
    },
    [addBookings]
  );

  const handleSubmitRule = useCallback(() => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入规则名称', icon: 'none' });
      return;
    }
    if (!formData.playerName.trim()) {
      Taro.showToast({ title: '请输入预约人姓名', icon: 'none' });
      return;
    }

    const machine = mockMachines.find(m => m.id === formData.machineId);
    const newRule: PeriodRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      name: formData.name,
      weekday: formData.weekday,
      startTime: formData.startTime,
      endTime: formData.endTime,
      machineId: formData.machineId,
      machineName: machine?.name || '未知镖机',
      startDate: formData.startDate,
      weeks: formData.weeks,
      playerName: formData.playerName,
      playerPhone: formData.playerPhone,
      pricePerHour: machine?.pricePerHour || 50
    };

    if (editingRule) {
      updateRule(editingRule.id, newRule);
      console.log('[BookingPage] 更新规则:', newRule.id);
    } else {
      addRule(newRule);
      console.log('[BookingPage] 新增规则:', newRule.id);
    }

    setShowModal(false);
    Taro.showToast({
      title: editingRule ? '修改成功' : '创建成功',
      icon: 'success'
    });
  }, [formData, editingRule, addRule, updateRule]);

  const handleWeekdayChange = useCallback((weekday: Weekday) => {
    setFormData(prev => ({ ...prev, weekday }));
  }, []);

  const handleWeeksChange = useCallback((delta: number) => {
    setFormData(prev => ({
      ...prev,
      weeks: Math.max(1, Math.min(52, prev.weeks + delta))
    }));
  }, []);

  const handleBookingClick = useCallback((booking: Booking) => {
    console.log('[BookingPage] 点击预订:', booking.id);
    Taro.navigateTo({
      url: `/pages/booking-detail/index?id=${booking.id}`
    });
  }, []);

  const handleBatchStartTimeChange = useCallback((e: any) => {
    const [h, m] = e.detail.value;
    setBatchForm(prev => ({ ...prev, startTime: `${TIME_HOURS[h]}:${TIME_MINS[m]}` }));
  }, []);

  const handleBatchEndTimeChange = useCallback((e: any) => {
    const [h, m] = e.detail.value;
    setBatchForm(prev => ({ ...prev, endTime: `${TIME_HOURS[h]}:${TIME_MINS[m]}` }));
  }, []);

  const handleBatchMachineSelect = useCallback(() => {
    const options = machines.map(m => `${m.code} ${m.name}`);
    Taro.showActionSheet({
      itemList: options,
      success: res => {
        const selected = machines[res.tapIndex];
        if (selected) {
          setBatchForm(prev => ({ ...prev, machineId: selected.id }));
        }
      }
    });
  }, [machines]);

  const batchStartH = TIME_HOURS.indexOf(batchForm.startTime.split(':')[0]);
  const batchStartM = TIME_MINS.indexOf(batchForm.startTime.split(':')[1]);
  const batchEndH = TIME_HOURS.indexOf(batchForm.endTime.split(':')[0]);
  const batchEndM = TIME_MINS.indexOf(batchForm.endTime.split(':')[1]);
  const batchMachineName = machines.find(m => m.id === batchForm.machineId)?.name || '选择镖机';

  const tabs = [
    { key: 'rules' as TabType, label: '周期规则' },
    { key: 'bookings' as TabType, label: '预订列表' }
  ];

  return (
    <View className={styles.page}>
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

      {activeTab === 'rules' && (
        <ScrollView scrollY>
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>周期规则</Text>
              <Text className={styles.ruleStat}>共{rules.length}条</Text>
            </View>

            {rules.length > 0 ? (
              rules.map(rule => {
                const ruleBookings = bookings.filter(b => b.ruleId === rule.id);
                return (
                  <View key={rule.id} className={styles.ruleCard}>
                    <View className={styles.ruleHeader}>
                      <Text className={styles.ruleName}>{rule.name}</Text>
                      <View className={styles.ruleBadge}>
                        <Text className={styles.ruleBadgeText}>
                          {WEEKDAY_LABEL[rule.weekday]}
                        </Text>
                      </View>
                    </View>

                    <View className={styles.ruleInfo}>
                      <View className={styles.ruleInfoItem}>
                        <Text className={styles.ruleInfoLabel}>时间段</Text>
                        <Text className={styles.ruleInfoValue}>
                          {rule.startTime} - {rule.endTime}
                        </Text>
                      </View>
                      <View className={styles.ruleInfoItem}>
                        <Text className={styles.ruleInfoLabel}>镖机</Text>
                        <Text className={styles.ruleInfoValue}>{rule.machineName}</Text>
                      </View>
                      <View className={styles.ruleInfoItem}>
                        <Text className={styles.ruleInfoLabel}>周期</Text>
                        <Text className={styles.ruleInfoValue}>{rule.weeks}周</Text>
                      </View>
                      <View className={styles.ruleInfoItem}>
                        <Text className={styles.ruleInfoLabel}>预约人</Text>
                        <Text className={styles.ruleInfoValue}>{rule.playerName}</Text>
                      </View>
                    </View>

                    <View className={styles.ruleFooter}>
                      <View className={styles.ruleStats}>
                        <Text className={styles.ruleStat}>已生成 {ruleBookings.length} 条</Text>
                      </View>
                      <View className={styles.ruleActions}>
                        <View
                          className={styles.actionBtn}
                          onClick={() => handleEditRule(rule)}
                        >
                          <Text className={styles.actionBtnText}>编辑规则</Text>
                        </View>
                        <View
                          className={styles.actionBtn}
                          onClick={() => handleBatchAdjust(rule)}
                        >
                          <Text className={styles.actionBtnText}>批量调整</Text>
                        </View>
                        <View
                          className={`${styles.actionBtn} ${styles.primary}`}
                          onClick={() => handleGenerateBookings(rule)}
                        >
                          <Text className={styles.actionBtnText}>生成预订</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📅</Text>
                <Text className={styles.emptyText}>暂无周期规则</Text>
                <View className={styles.emptyAction} onClick={handleAddRule}>
                  <Text className={styles.emptyActionText}>立即创建</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'bookings' && (
        <ScrollView scrollY>
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>全部预订</Text>
              <Text className={styles.ruleStat}>共{bookings.length}条</Text>
            </View>

            <View className={styles.bookingList}>
              {Object.keys(groupedBookings).length > 0 ? (
                Object.entries(groupedBookings).map(([date, dateBookings]) => (
                  <View key={date} className={styles.dateGroup}>
                    <View className={styles.dateGroupHeader}>
                      <Text className={styles.dateGroupDate}>{date}</Text>
                      <Text className={styles.dateGroupWeekday}>
                        {getWeekdayLabel(date)}
                      </Text>
                      <Text className={styles.dateGroupCount}>
                        {dateBookings.length}条
                      </Text>
                    </View>
                    {dateBookings.map(booking => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onClick={handleBookingClick}
                      />
                    ))}
                  </View>
                ))
              ) : (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>🎯</Text>
                  <Text className={styles.emptyText}>暂无预订记录</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'rules' && (
        <View className={styles.addBtn} onClick={handleAddRule}>
          <Text className={styles.addBtnText}>+</Text>
        </View>
      )}

      {showModal && (
        <View className={styles.formModal} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {editingRule ? '编辑周期规则' : '新建周期规则'}
              </Text>
              <View className={styles.modalClose} onClick={() => setShowModal(false)}>
                <Text className={styles.modalCloseText}>✕</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>规则名称</Text>
              <Input
                className={styles.formInput}
                placeholder="如：周三晚间练镖"
                value={formData.name}
                onInput={e => setFormData(prev => ({ ...prev, name: e.detail.value }))}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>每周</Text>
              <View className={styles.weekdaySelector}>
                {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map(day => (
                  <View
                    key={day}
                    className={`${styles.weekdayItem} ${formData.weekday === day ? styles.active : ''}`}
                    onClick={() => handleWeekdayChange(day)}
                  >
                    <Text className={styles.weekdayText}>
                      {WEEKDAY_LABEL[day]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>时间段</Text>
              <View className={styles.timeRow}>
                <Input
                  className={styles.timeInput}
                  type="digit"
                  value={formData.startTime}
                  onInput={e => setFormData(prev => ({ ...prev, startTime: e.detail.value }))}
                  placeholder="开始时间"
                />
                <Text className={styles.timeDivider}>至</Text>
                <Input
                  className={styles.timeInput}
                  type="digit"
                  value={formData.endTime}
                  onInput={e => setFormData(prev => ({ ...prev, endTime: e.detail.value }))}
                  placeholder="结束时间"
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>持续周数</Text>
              <View className={styles.weeksSelector}>
                <View className={styles.weeksBtn} onClick={() => handleWeeksChange(-1)}>
                  <Text className={styles.weeksBtnText}>-</Text>
                </View>
                <Text className={styles.weeksValue}>{formData.weeks} 周</Text>
                <View className={styles.weeksBtn} onClick={() => handleWeeksChange(1)}>
                  <Text className={styles.weeksBtnText}>+</Text>
                </View>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>起始日期</Text>
              <Input
                className={styles.formInput}
                value={formData.startDate}
                onInput={e => setFormData(prev => ({ ...prev, startDate: e.detail.value }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>预约人姓名</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入姓名"
                value={formData.playerName}
                onInput={e => setFormData(prev => ({ ...prev, playerName: e.detail.value }))}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>联系电话</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="请输入手机号"
                value={formData.playerPhone}
                onInput={e => setFormData(prev => ({ ...prev, playerPhone: e.detail.value }))}
              />
            </View>

            <View className={styles.submitBtn} onClick={handleSubmitRule}>
              <Text className={styles.submitBtnText}>
                {editingRule ? '保存修改' : '创建规则'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {showBatchModal && batchRule && (
        <View className={styles.formModal} onClick={() => setShowBatchModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>批量调整预订</Text>
              <View className={styles.modalClose} onClick={() => setShowBatchModal(false)}>
                <Text className={styles.modalCloseText}>✕</Text>
              </View>
            </View>

            <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '24rpx', display: 'block' }}>
              规则：{batchRule.name}
            </Text>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>开始时间</Text>
              <Picker
                mode="multiSelector"
                range={[TIME_HOURS, TIME_MINS]}
                value={[batchStartH >= 0 ? batchStartH : 0, batchStartM >= 0 ? batchStartM : 0]}
                onChange={handleBatchStartTimeChange}
              >
                <View className={styles.pickerDisplay}>
                  <Text className={styles.pickerText}>{batchForm.startTime}</Text>
                  <Text className={styles.pickerArrow}>›</Text>
                </View>
              </Picker>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>结束时间</Text>
              <Picker
                mode="multiSelector"
                range={[TIME_HOURS, TIME_MINS]}
                value={[batchEndH >= 0 ? batchEndH : 0, batchEndM >= 0 ? batchEndM : 0]}
                onChange={handleBatchEndTimeChange}
              >
                <View className={styles.pickerDisplay}>
                  <Text className={styles.pickerText}>{batchForm.endTime}</Text>
                  <Text className={styles.pickerArrow}>›</Text>
                </View>
              </Picker>
            </View>

            <View className={styles.formItem} onClick={handleBatchMachineSelect}>
              <Text className={styles.formLabel}>镖机</Text>
              <View className={styles.pickerDisplay}>
                <Text className={styles.pickerText}>{batchMachineName}</Text>
                <Text className={styles.pickerArrow}>›</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <View className={styles.switchRow} onClick={() => setBatchForm(prev => ({ ...prev, onlyFuture: !prev.onlyFuture }))}>
                <Text className={styles.formLabel}>只调整未开始的预订</Text>
                <View className={`${styles.switchBtn} ${batchForm.onlyFuture ? styles.on : ''}`}>
                  <View className={styles.switchDot} />
                </View>
              </View>
              <Text style={{ fontSize: '22rpx', color: '#C9CDD4', marginTop: '8rpx', display: 'block' }}>
                已完成、已取消和已过期的预订不会被修改
              </Text>
            </View>

            <View className={styles.submitBtn} onClick={handleBatchSave}>
              <Text className={styles.submitBtnText}>确认批量调整</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BookingPage;

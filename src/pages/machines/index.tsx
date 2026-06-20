import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { Machine, MachineStatus, MACHINE_STATUS_LABEL } from '@/types/machine';
import { mockMachines } from '@/data/machines';
import MachineCard from '@/components/MachineCard';
import { formatDate, addDays, getWeekdayLabel } from '@/utils/date';
import styles from './index.module.scss';

const MachinesPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(formatDate(new Date()));
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [machines, setMachines] = useState<Machine[]>(mockMachines);

  useDidShow(() => {
    console.log('[MachinesPage] 页面显示');
  });

  usePullDownRefresh(() => {
    console.log('[MachinesPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'idle', label: '空闲' },
    { key: 'occupied', label: '占用' },
    { key: 'maintenance', label: '维护' }
  ];

  const filteredMachines = useMemo(() => {
    if (activeFilter === 'all') {
      return machines;
    }
    return machines.filter(m => m.status === activeFilter);
  }, [machines, activeFilter]);

  const stats = useMemo(() => {
    const total = machines.length;
    const idle = machines.filter(m => m.status === 'idle').length;
    const occupied = machines.filter(m => m.status === 'occupied').length;
    const maintenance = machines.filter(m => m.status === 'maintenance').length;
    return { total, idle, occupied, maintenance };
  }, [machines]);

  const handlePrevDay = useCallback(() => {
    const date = new Date(currentDate.replace(/-/g, '/'));
    const prevDate = addDays(date, -1);
    setCurrentDate(formatDate(prevDate));
    console.log('[MachinesPage] 切换到前一天:', formatDate(prevDate));
  }, [currentDate]);

  const handleNextDay = useCallback(() => {
    const date = new Date(currentDate.replace(/-/g, '/'));
    const nextDate = addDays(date, 1);
    setCurrentDate(formatDate(nextDate));
    console.log('[MachinesPage] 切换到后一天:', formatDate(nextDate));
  }, [currentDate]);

  const handleMachineClick = useCallback((machine: Machine) => {
    console.log('[MachinesPage] 点击镖机:', machine.id, machine.name);
    Taro.navigateTo({
      url: `/pages/machine-detail/index?id=${machine.id}`
    });
  }, []);

  const handleFilterClick = useCallback((key: string) => {
    setActiveFilter(key);
    console.log('[MachinesPage] 切换筛选:', key);
  }, []);

  const weekdayLabel = getWeekdayLabel(currentDate);
  const isToday = currentDate === formatDate(new Date());

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <View>
            <Text className={styles.title}>镖机排期</Text>
            <Text className={styles.subtitle}>  选择镖机开始你的飞镖之旅</Text>
          </View>
        </View>

        <View className={styles.dateSelector}>
          <View className={styles.dateNav} onClick={handlePrevDay}>
            <Text className={styles.dateNavText}>‹</Text>
          </View>
          <View className={styles.dateInfo}>
            <Text className={styles.currentDate}>{currentDate}</Text>
            <Text className={styles.currentWeekday}>
              {weekdayLabel}
              {isToday && ' · 今天'}
            </Text>
          </View>
          <View className={styles.dateNav} onClick={handleNextDay}>
            <Text className={styles.dateNavText}>›</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总台数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.idle}</Text>
            <Text className={styles.statLabel}>空闲</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.occupied}</Text>
            <Text className={styles.statLabel}>占用</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.maintenance}</Text>
            <Text className={styles.statLabel}>维护</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollX className={styles.filterBar}>
        {filters.map(filter => (
          <View
            key={filter.key}
            className={`${styles.filterItem} ${activeFilter === filter.key ? styles.active : ''}`}
            onClick={() => handleFilterClick(filter.key)}
          >
            <Text className={styles.filterText}>{filter.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.machineList}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>
            {activeFilter === 'all' ? '全部镖机' : MACHINE_STATUS_LABEL[activeFilter as MachineStatus] + '镖机'}
          </Text>
          <Text className={styles.sectionCount}>共{filteredMachines.length}台</Text>
        </View>

        {filteredMachines.length > 0 ? (
          filteredMachines.map(machine => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onClick={handleMachineClick}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎯</Text>
            <Text className={styles.emptyText}>暂无镖机数据</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MachinesPage;

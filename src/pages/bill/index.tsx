import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { Bill, BillStatus, BILL_STATUS_LABEL } from '@/types/bill';
import { RankingPlayer, LeagueSeason } from '@/types/ranking';
import { mockRankings, mockSeasons } from '@/data/rankings';
import BillItemComponent from '@/components/BillItem';
import RankingItem from '@/components/RankingItem';
import { useAppStore } from '@/hooks/useAppStore';
import styles from './index.module.scss';

type TabType = 'bills' | 'ranking';

const BillPage: React.FC = () => {
  const { bills } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('bills');
  const [rankings] = useState<RankingPlayer[]>(mockRankings);
  const [seasons] = useState<LeagueSeason[]>(mockSeasons);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useDidShow(() => {
    console.log('[BillPage] 页面显示,账单数量:', bills.length);
  });

  usePullDownRefresh(() => {
    console.log('[BillPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const filteredBills = useMemo(() => {
    const sorted = [...bills].sort(
      (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    );
    if (activeFilter === 'all') {
      return sorted;
    }
    return sorted.filter(b => b.status === activeFilter);
  }, [bills, activeFilter]);

  const summary = useMemo(() => {
    const totalSpent = bills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.finalAmount, 0);
    const totalSaved = bills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.discountAmount, 0);
    const billCount = bills.length;
    const paidCount = bills.filter(b => b.status === 'paid').length;
    return { totalSpent, totalSaved, billCount, paidCount };
  }, [bills]);

  const currentSeason = useMemo(() => {
    return seasons.find(s => s.status === 'ongoing') || seasons[0];
  }, [seasons]);

  const top3 = useMemo(() => rankings.slice(0, 3), [rankings]);
  const restRankings = useMemo(() => rankings.slice(3), [rankings]);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'paid', label: '已支付' },
    { key: 'unpaid', label: '待支付' },
    { key: 'refunded', label: '已退款' }
  ];

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    console.log('[BillPage] 切换Tab:', tab);
  }, []);

  const handleFilterChange = useCallback((key: string) => {
    setActiveFilter(key);
    console.log('[BillPage] 切换筛选:', key);
  }, []);

  const handleBillClick = useCallback((bill: Bill) => {
    console.log('[BillPage] 点击账单:', bill.id);
    Taro.navigateTo({
      url: `/pages/bill-detail/index?id=${bill.id}`
    });
  }, []);

  const getSeasonStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '进行中';
      case 'upcoming':
        return '即将开始';
      case 'ended':
        return '已结束';
      default:
        return status;
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0);
  };

  const tabs = [
    { key: 'bills' as TabType, label: '我的账单' },
    { key: 'ranking' as TabType, label: '联赛排行' }
  ];

  return (
    <ScrollView scrollY className={styles.page}>
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

      {activeTab === 'bills' && (
        <View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryTitle}>累计消费</Text>
            <Text className={styles.summaryAmount}>¥{summary.totalSpent.toFixed(2)}</Text>
            <View className={styles.summaryStats}>
              <View className={styles.summaryStat}>
                <Text className={styles.summaryStatValue}>{summary.billCount}</Text>
                <Text className={styles.summaryStatLabel}>账单总数</Text>
              </View>
              <View className={styles.summaryStat}>
                <Text className={styles.summaryStatValue}>{summary.paidCount}</Text>
                <Text className={styles.summaryStatLabel}>已支付</Text>
              </View>
              <View className={styles.summaryStat}>
                <Text className={styles.summaryStatValue}>¥{summary.totalSaved.toFixed(0)}</Text>
                <Text className={styles.summaryStatLabel}>累计节省</Text>
              </View>
            </View>
          </View>

          <ScrollView scrollX className={styles.filterBar}>
            {filters.map(filter => (
              <View
                key={filter.key}
                className={`${styles.filterItem} ${activeFilter === filter.key ? styles.active : ''}`}
                onClick={() => handleFilterChange(filter.key)}
              >
                <Text className={styles.filterText}>{filter.label}</Text>
              </View>
            ))}
          </ScrollView>

          <Text className={styles.sectionTitle}>
            {activeFilter === 'all' ? '全部账单' : BILL_STATUS_LABEL[activeFilter as BillStatus]}
            <Text style={{ fontSize: '24rpx', color: '#86909C', fontWeight: 'normal' }}>
              {' '}({filteredBills.length})
            </Text>
          </Text>

          <View className={styles.billList}>
            {filteredBills.length > 0 ? (
              filteredBills.map(bill => (
                <BillItemComponent
                  key={bill.id}
                  bill={bill}
                  onClick={handleBillClick}
                />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📋</Text>
                <Text className={styles.emptyText}>暂无账单记录</Text>
                <Text style={{ fontSize: '24rpx', color: '#C9CDD4', marginTop: '12rpx', display: 'block' }}>
                  完成预订支付后会自动生成账单
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {activeTab === 'ranking' && (
        <View>
          {currentSeason && (
            <View className={styles.leagueCard}>
              <View className={styles.leagueHeader}>
                <View className={styles.leagueInfo}>
                  <Text className={styles.leagueName}>{currentSeason.name}</Text>
                  <Text className={styles.leagueDate}>
                    {currentSeason.startDate} 至 {currentSeason.endDate}
                  </Text>
                </View>
                <View className={styles.leagueStatus}>
                  <Text className={styles.leagueStatusText}>
                    {getSeasonStatusText(currentSeason.status)}
                  </Text>
                </View>
              </View>
              <View className={styles.leagueStats}>
                <View className={styles.leagueStat}>
                  <Text className={styles.leagueStatValue}>{currentSeason.totalPlayers}</Text>
                  <Text className={styles.leagueStatLabel}>参赛人数</Text>
                </View>
                <View className={styles.leagueStat}>
                  <Text className={styles.leagueStatValue}>{currentSeason.totalGames}</Text>
                  <Text className={styles.leagueStatLabel}>比赛场次</Text>
                </View>
                <View className={styles.leagueStat}>
                  <Text className={styles.leagueStatValue}>{rankings.length}</Text>
                  <Text className={styles.leagueStatLabel}>排名人数</Text>
                </View>
              </View>
            </View>
          )}

          <Text className={styles.sectionTitle}>排行榜 TOP10</Text>

          <View className={styles.podiumSection}>
            {top3.map((player, index) => (
              <View
                key={player.id}
                className={`${styles.podiumItem} ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}`}
              >
                <View className={styles.podiumAvatar}>
                  <Text className={styles.podiumAvatarText}>{getInitials(player.name)}</Text>
                </View>
                <View className={styles.podiumRank}>
                  <Text className={styles.podiumRankText}>{player.rank}</Text>
                </View>
                <Text className={styles.podiumName}>{player.name}</Text>
                <Text className={styles.podiumPoints}>{player.points} 分</Text>
              </View>
            ))}
          </View>

          <View className={styles.rankingList}>
            {restRankings.map(player => (
              <RankingItem key={player.id} player={player} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BillPage;

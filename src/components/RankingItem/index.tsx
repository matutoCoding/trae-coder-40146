import React from 'react';
import { View, Text } from '@tarojs/components';
import { RankingPlayer } from '@/types/ranking';
import styles from './index.module.scss';

export interface RankingItemProps {
  player: RankingPlayer;
  showDetails?: boolean;
}

const RankingItem: React.FC<RankingItemProps> = ({ player, showDetails = true }) => {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return styles.rank1;
    if (rank === 2) return styles.rank2;
    if (rank === 3) return styles.rank3;
    return '';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const badge = getRankBadge(player.rank);

  return (
    <View className={styles.item}>
      <View className={`${styles.rank} ${getRankStyle(player.rank)}`}>
        {badge ? (
          <Text className={styles.rankBadge}>{badge}</Text>
        ) : (
          <Text className={styles.rankNum}>{player.rank}</Text>
        )}
      </View>

      <View className={styles.playerInfo}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{player.name}</Text>
          <View className={styles.level}>
            <Text className={styles.levelText}>{player.level}</Text>
          </View>
        </View>
        {showDetails && (
          <View className={styles.stats}>
            <Text className={styles.stat}>
              <Text className={styles.statLabel}>胜场</Text>
              <Text className={styles.statValue}>{player.wins}</Text>
            </Text>
            <Text className={styles.stat}>
              <Text className={styles.statLabel}>负场</Text>
              <Text className={styles.statValue}>{player.losses}</Text>
            </Text>
            <Text className={styles.stat}>
              <Text className={styles.statLabel}>胜率</Text>
              <Text className={styles.statValue}>{player.winRate}%</Text>
            </Text>
          </View>
        )}
      </View>

      <View className={styles.points}>
        <Text className={styles.pointsValue}>{player.points}</Text>
        <Text className={styles.pointsLabel}>积分</Text>
      </View>
    </View>
  );
};

export default RankingItem;

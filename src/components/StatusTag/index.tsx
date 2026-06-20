import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface StatusTagProps {
  status: string;
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  text?: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ status, type = 'info', size = 'md', text }) => {
  const typeMap: Record<string, string> = {
    primary: styles.primary,
    success: styles.success,
    warning: styles.warning,
    error: styles.error,
    info: styles.info
  };

  const sizeMap: Record<string, string> = {
    sm: styles.small,
    md: styles.medium
  };

  const displayText = text || status;

  return (
    <View className={classnames(styles.statusTag, typeMap[type], sizeMap[size])}>
      <Text className={styles.tagText}>{displayText}</Text>
    </View>
  );
};

export default StatusTag;

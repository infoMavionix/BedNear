
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  ViewStyle,
} from 'react-native';

import { colors } from '../constants/theme';
import { styles } from './AppButton.styles';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'soft' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'soft'
          ? colors.primaryLight
          : colors.surface;

  const fg =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      android_ripple={{ color: '#FFFFFF30' }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor:
            variant === 'outline' ? colors.border : bg,
          opacity: disabled || loading ? 0.55 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.text, { color: fg }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

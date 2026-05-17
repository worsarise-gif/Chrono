import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type BadgeProps = {
  label: string;
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'warning';
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors, typography, radius, spacing } = useTheme();

  const getStyle = () => {
    switch (variant) {
      case 'accent': return { bg: colors.accent, text: colors.accentForeground };
      case 'success': return { bg: colors.success, text: colors.accentForeground };
      case 'danger': return { bg: colors.danger, text: colors.accentForeground };
      case 'warning': return { bg: colors.warning, text: colors.accentForeground };
      case 'default':
      default: return { bg: colors.surfaceElevated, text: colors.text };
    }
  };

  const style = getStyle();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: style.bg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs / 2,
        },
      ]}
    >
      <Text
        style={{
          color: style.text,
          fontSize: typography.size.xs,
          fontWeight: typography.weight.semibold,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
});

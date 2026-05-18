import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme';

type SettingsRowProps = {
  label: string;
  value?: string;
  icon?: LucideIcon;
  iconColor?: string;
  rightElement?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
};

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  value,
  icon: Icon,
  iconColor,
  rightElement,
  onPress,
  destructive = false,
}) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          paddingHorizontal: spacing.lg,
          borderBottomColor: colors.borderSubtle,
          backgroundColor: pressed && onPress ? colors.surfaceElevated : colors.background,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {Icon && (
        <View style={[styles.iconContainer, { marginRight: spacing.md }]}>
          <Icon size={20} color={iconColor || (destructive ? colors.danger : colors.text)} />
        </View>
      )}

      <Text style={[styles.label, { color: destructive ? colors.danger : colors.text, fontSize: typography.size.base }]}>
        {label}
      </Text>

      <View style={styles.rightContainer}>
        {value ? (
          <Text style={[styles.value, { color: colors.textMuted, fontSize: typography.size.base }]}>
            {value}
          </Text>
        ) : null}

        {rightElement !== undefined ? (
          rightElement
        ) : onPress ? (
          <ChevronRight color={colors.textMuted} size={20} style={{ marginLeft: spacing.xs }} />
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    marginRight: 4,
  },
});

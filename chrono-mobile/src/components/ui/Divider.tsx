import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type DividerProps = {
  label?: string;
  vertical?: boolean;
};

export function Divider({ label, vertical = false }: DividerProps) {
  const { colors, typography, spacing } = useTheme();

  if (vertical) {
    return <View style={{ width: 1, height: '100%', backgroundColor: colors.border }} />;
  }

  if (label) {
    return (
      <View style={styles.containerWithLabel}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.textSubtle, fontSize: typography.size.sm, marginHorizontal: spacing.md }]}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return <View style={{ height: 1, width: '100%', backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  containerWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    textAlign: 'center',
  },
});

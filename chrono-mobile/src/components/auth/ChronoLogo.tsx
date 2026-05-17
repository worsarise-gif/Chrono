import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useTheme } from '../../theme';

interface ChronoLogoProps {
  size?: 'sm' | 'lg';
}

export const ChronoLogo: React.FC<ChronoLogoProps> = ({ size = 'lg' }) => {
  const { colors, typography, spacing } = useTheme();

  const isLg = size === 'lg';
  const iconSize = isLg ? 40 : 24;
  const fontSize = isLg ? typography.size.h1 : typography.size.xl;
  const gap = isLg ? spacing.sm : spacing.xs;

  return (
    <View style={[styles.container, { gap }]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Polyline points="12 6 12 12 16 14" />
      </Svg>
      <Text style={[styles.text, { color: colors.text, fontSize, fontWeight: typography.weight.bold }]}>
        Chrono
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: -0.5,
  },
});

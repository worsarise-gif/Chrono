import React from 'react';
import { View, StyleSheet } from 'react-native';
import MathView, { MathText } from 'react-native-math-view';
import { useTheme } from '../../theme';

type MathBlockProps = {
  expression: string;
  display?: boolean;
};

export const MathBlock: React.FC<MathBlockProps> = React.memo(({ expression, display = true }) => {
  const { colors, spacing } = useTheme();

  const colorStyle = { color: colors.text };

  if (!display) {
    return <MathText value={expression} style={colorStyle} />;
  }

  return (
    <View style={[styles.container, { paddingVertical: spacing.md }]}>
      <MathView
        math={expression}
        style={colorStyle}
      />
    </View>
  );
});

MathBlock.displayName = 'MathBlock';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
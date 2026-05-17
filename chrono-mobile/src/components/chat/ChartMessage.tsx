import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryChart, VictoryBar, VictoryLine, VictoryTheme, VictoryAxis } from 'victory-native';
import { useTheme } from '../../theme';

type ChartData = {
  type: 'bar' | 'line';
  labels: string[];
  values: number[];
  title?: string;
};

type ChartMessageProps = {
  data: string;
};

export const ChartMessage: React.FC<ChartMessageProps> = React.memo(({ data }) => {
  const { colors, typography, spacing } = useTheme();

  const chartData = useMemo<ChartData | null>(() => {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }, [data]);

  if (!chartData) {
    return <Text style={{ color: colors.danger }}>Failed to load chart data</Text>;
  }

  const formattedData = chartData.labels.map((label, index) => ({
    x: label,
    y: chartData.values[index],
  }));

  const customTheme = {
    ...VictoryTheme.material,
    axis: {
      ...VictoryTheme.material.axis,
      style: {
        axis: { stroke: colors.border },
        grid: { stroke: colors.border, strokeDasharray: '4, 4' },
        ticks: { stroke: colors.border },
        tickLabels: { fill: colors.textMuted, fontSize: typography.size.xs, padding: 5 },
      },
    },
  };

  return (
    <View style={styles.container}>
      {chartData.title && (
        <Text
          style={[
            styles.title,
            { color: colors.textMuted, fontSize: typography.size.sm, fontWeight: typography.weight.medium as any },
          ]}
        >
          {chartData.title}
        </Text>
      )}
      <View style={{ height: 220, width: '100%' }}>
        <VictoryChart theme={customTheme as any} height={220} padding={{ top: 20, bottom: 40, left: 40, right: 20 }}>
          <VictoryAxis />
          <VictoryAxis dependentAxis />
          {chartData.type === 'bar' ? (
            <VictoryBar
              data={formattedData}
              style={{
                data: { fill: colors.accent },
              }}
              cornerRadius={4}
            />
          ) : (
            <VictoryLine
              data={formattedData}
              style={{
                data: { stroke: colors.accent, strokeWidth: 3 },
              }}
            />
          )}
        </VictoryChart>
      </View>
    </View>
  );
});

ChartMessage.displayName = 'ChartMessage';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
});
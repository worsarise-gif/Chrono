import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../src/theme';
import { useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { colors, typography } = useTheme();
  const { id } = useLocalSearchParams();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text, fontSize: typography.size.h1 }}>Chat {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

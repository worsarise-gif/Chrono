import { Stack } from 'expo-router';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

export default function AuthLayout() {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View style={{ flex: 1 }} entering={reducedMotion ? undefined : FadeIn.duration(200)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </Animated.View>
  );
}

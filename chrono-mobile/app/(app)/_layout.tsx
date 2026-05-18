import { Drawer } from 'expo-router/drawer';
import { Platform } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../src/theme';
import { Sidebar } from '../../src/components/sidebar/Sidebar';

export default function AppLayout() {
  const reducedMotion = useReducedMotion();
  const { colors } = useTheme();

  return (
    <Animated.View style={{ flex: 1 }} entering={reducedMotion ? undefined : FadeIn.duration(200)}>
      <Drawer
        screenOptions={{
          drawerType: Platform.OS === 'ios' ? 'slide' : 'front',
          drawerStyle: { width: '80%', backgroundColor: colors.sidebarBackground },
        }}
        drawerContent={() => <Sidebar />}
      >
        <Drawer.Screen name="index" />
        <Drawer.Screen name="gallery" />
        <Drawer.Screen name="settings" />
        <Drawer.Screen name="chat/[id]" />
      </Drawer>
    </Animated.View>
  );
}

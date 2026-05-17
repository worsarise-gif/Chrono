import { Drawer } from 'expo-router/drawer';
import { Platform } from 'react-native';
import { useTheme } from '../../src/theme';
import { Sidebar } from '../../src/components/sidebar/Sidebar';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
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
  );
}

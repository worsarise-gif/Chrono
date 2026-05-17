import { Drawer } from 'expo-router/drawer';
import { View, Text, Platform } from 'react-native';
import { useTheme } from '../../src/theme';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Drawer
      screenOptions={{
        drawerType: Platform.OS === 'ios' ? 'slide' : 'front',
        drawerStyle: { width: '80%', backgroundColor: colors.sidebarBackground },
      }}
      drawerContent={() => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>Sidebar</Text>
        </View>
      )}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="gallery" />
      <Drawer.Screen name="settings" />
      <Drawer.Screen name="chat/[id]" />
    </Drawer>
  );
}

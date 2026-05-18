import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type AvatarProps = {
  uri?: string;
  initials?: string;
  size?: number;
  showOnlineIndicator?: boolean;
};

export function Avatar({ uri, initials, size = 40, showOnlineIndicator = false }: AvatarProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="User avatar">
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.accent,
            },
          ]}
        >
          <Text
            style={{
              color: colors.accentForeground,
              fontSize: size * 0.4,
              fontWeight: typography.weight.bold,
            }}
          >
            {initials}
          </Text>
        </View>
      )}

      {showOnlineIndicator && (
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: colors.success,
              borderColor: colors.background,
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});

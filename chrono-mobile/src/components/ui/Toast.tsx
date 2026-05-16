import React from 'react';
import RNToast, { BaseToastProps } from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

export function showToast({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  RNToast.show({
    type,
    text1: message,
    position: 'top',
  });
}

function ToastBase({ text1, type, ...props }: BaseToastProps & { type: 'success' | 'error' | 'info' }) {
  const { colors, typography, radius, shadow, spacing } = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle color={colors.success} size={20} />;
      case 'error': return <AlertCircle color={colors.danger} size={20} />;
      case 'info': return <Info color={colors.accent} size={20} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        shadow.md,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.size.base,
          flex: 1,
        }}
      >
        {text1}
      </Text>
    </View>
  );
}

export const toastConfig = {
  success: (props: any) => <ToastBase {...props} type="success" />,
  error: (props: any) => <ToastBase {...props} type="error" />,
  info: (props: any) => <ToastBase {...props} type="info" />,
};

export function Toast() {
  return <RNToast config={toastConfig} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
});

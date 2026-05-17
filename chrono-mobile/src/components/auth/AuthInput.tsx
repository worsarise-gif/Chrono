import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { IconButton } from '../ui/IconButton';
import { Eye, EyeOff } from 'lucide-react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  secureTextEntry,
  style,
  ...props
}) => {
  const { colors, typography, radius, spacing, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(
        isFocused ? colors.accent : colors.inputBorder,
        { duration: 200 }
      ),
    };
  }, [isFocused, colors.accent, colors.inputBorder]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted, fontSize: typography.size.sm }]}>
        {label}
      </Text>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderRadius: radius.lg,
          },
          animatedBorderStyle,
        ]}
      >
        <TextInput
          {...props}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: typography.size.base,
            },
            style,
          ]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor={colors.textSubtle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardAppearance={isDark ? 'dark' : 'light'}
        />
        {secureTextEntry && (
          <View style={styles.iconContainer}>
            <IconButton
              icon={isPasswordVisible ? EyeOff : Eye}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              color={colors.textMuted}
            />
          </View>
        )}
      </Animated.View>
      {error && (
        <Text style={[styles.error, { color: colors.danger, fontSize: typography.size.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  iconContainer: {
    paddingRight: 4,
  },
  error: {
    marginTop: 6,
  },
});

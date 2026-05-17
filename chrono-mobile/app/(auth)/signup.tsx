import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../src/theme';
import { AuthInput } from '../../src/components/auth/AuthInput';
import { GoogleButton } from '../../src/components/auth/GoogleButton';
import { ChronoLogo } from '../../src/components/auth/ChronoLogo';
import { Button } from '../../src/components/ui/Button';
import { Divider } from '../../src/components/ui/Divider';
import { useAuth } from '../_layout';

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength; // 0 to 4
};

const PasswordSegment = ({ active, strength }: { active: boolean, strength: number }) => {
  const { colors, radius } = useTheme();

  let segmentColor = colors.border;
  if (active) {
    if (strength === 1) segmentColor = colors.danger;
    else if (strength === 2 || strength === 3) segmentColor = colors.warning;
    else if (strength === 4) segmentColor = colors.success;
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(segmentColor, { duration: 300 }),
    };
  }, [segmentColor]);

  return (
    <Animated.View
      style={[
        { height: 4, borderRadius: radius.full, flex: 1 },
        animatedStyle,
      ]}
    />
  );
};

const PasswordStrengthBar = ({ strength }: { strength: number }) => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.strengthContainer, { gap: spacing.xs }]}>
      {[1, 2, 3, 4].map((segment) => (
        <PasswordSegment key={segment} active={strength >= segment} strength={strength} />
      ))}
    </View>
  );
};

export default function SignupScreen() {
  const { colors, typography, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { setIsAuthenticated } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const validate = () => {
    let valid = true;
    let newErrors: { displayName?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!displayName || displayName.length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
      valid = false;
    }

    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignUp = () => {
    Keyboard.dismiss();
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsAuthenticated(true);
      router.replace('/(app)');
    }, 1500);
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(400).springify().damping(18).withInitialValues({ transform: [{ translateY: 30 }] })}
            style={styles.formContainer}
          >
            <View style={[styles.logoContainer, { paddingTop: spacing.xxxxl }]}>
              <ChronoLogo size="lg" />
            </View>

            <View style={{ gap: spacing.xxl }}>
              <View>
                <Text style={[styles.heading, { color: colors.text, fontSize: typography.size.xl, fontWeight: typography.weight.bold }]}>
                  Create your account
                </Text>
                <Text style={[styles.subheading, { color: colors.textMuted, fontSize: typography.size.sm }]}>
                  Start chatting with Chrono AI
                </Text>
              </View>

              <View style={{ gap: spacing.md }}>
                <AuthInput
                  label="Display Name"
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    if (errors.displayName) setErrors({ ...errors, displayName: undefined });
                  }}
                  autoCapitalize="words"
                  returnKeyType="next"
                  error={errors.displayName}
                  placeholder="John Doe"
                />

                <AuthInput
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  error={errors.email}
                  placeholder="name@example.com"
                />

                <View>
                  <AuthInput
                    label="Password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    secureTextEntry
                    returnKeyType="next"
                    error={errors.password}
                    placeholder="Create a password"
                  />
                  <View style={{ marginTop: spacing.sm }}>
                    <PasswordStrengthBar strength={passwordStrength} />
                  </View>
                </View>

                <AuthInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  error={errors.confirmPassword}
                  placeholder="Confirm your password"
                />
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.xl - spacing.md }}>
                <Button
                  variant="primary"
                  label="Create Account"
                  fullWidth
                  size="lg"
                  onPress={handleSignUp}
                  loading={isLoading}
                />

                <Divider label="or" />

                <GoogleButton disabled={isLoading} />
              </View>

              <View style={[styles.bottomLinkContainer, { marginTop: spacing.xxxxl - spacing.lg }]}>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.base }}>
                  Already have an account?{' '}
                </Text>
                <Pressable onPress={() => router.push('/(auth)/login')}>
                  <Text style={{ color: colors.accent, fontSize: typography.size.base, fontWeight: typography.weight.medium }}>
                    Sign In
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </KeyboardAwareScrollView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    textAlign: 'center',
  },
  bottomLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthContainer: {
    flexDirection: 'row',
    width: '100%',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard, Platform, BackHandler } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/theme';
import { AuthInput } from '../../src/components/auth/AuthInput';
import { GoogleButton } from '../../src/components/auth/GoogleButton';
import { ChronoLogo } from '../../src/components/auth/ChronoLogo';
import { Button } from '../../src/components/ui/Button';
import { Divider } from '../../src/components/ui/Divider';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../_layout';

export default function LoginScreen() {
  const { colors, typography, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { setIsAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (Platform.OS === 'android') {
          BackHandler.exitApp();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const validate = () => {
    let valid = true;
    let newErrors: { email?: string; password?: string } = {};

    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = () => {
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
                  Welcome back
                </Text>
                <Text style={[styles.subheading, { color: colors.textMuted, fontSize: typography.size.sm }]}>
                  Sign in to continue your conversations
                </Text>
              </View>

              <View style={{ gap: spacing.md }}>
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
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                    error={errors.password}
                    placeholder="Enter your password"
                  />
                  <Pressable style={styles.forgotPassword}>
                    <Text style={{ color: colors.accent, fontSize: typography.size.sm }}>
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ gap: spacing.lg, marginTop: spacing.xl - spacing.md }}>
                <Button
                  variant="primary"
                  label="Sign In"
                  fullWidth
                  size="lg"
                  onPress={handleSignIn}
                  loading={isLoading}
                />

                <Divider label="or" />

                <GoogleButton disabled={isLoading} />
              </View>

              <View style={[styles.bottomLinkContainer, { marginTop: spacing.xxxxl - spacing.lg }]}>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.base }}>
                  Don't have an account?{' '}
                </Text>
                <Pressable onPress={() => router.push('/(auth)/signup')}>
                  <Text style={{ color: colors.accent, fontSize: typography.size.base, fontWeight: typography.weight.medium }}>
                    Sign Up
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
    marginBottom: 24, // spacing.xxl
  },
  heading: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    textAlign: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  bottomLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const colors = {
  dark: {
    background: '#0a0a0a',
    surface: '#141414',
    surfaceElevated: '#1e1e1e',
    border: '#2a2a2a',
    borderSubtle: '#1f1f1f',
    text: '#f0f0f0',
    textMuted: '#888888',
    textSubtle: '#4a4a4a',
    accent: '#7c6af7',
    accentDim: '#3d3568',
    accentForeground: '#ffffff',
    userBubble: '#1a1830',
    assistantBubble: 'transparent',
    inputBackground: '#141414',
    inputBorder: '#2e2e2e',
    sidebarBackground: '#0d0d0d',
    sidebarBorder: '#1f1f1f',
    danger: '#ef4444',
    dangerDim: '#3b1515',
    success: '#22c55e',
    warning: '#f59e0b',
    codeBackground: '#111111',
    overlay: 'rgba(0,0,0,0.6)',
  },
  light: {
    background: '#ffffff',
    surface: '#f7f7f7',
    surfaceElevated: '#efefef',
    border: '#e5e5e5',
    borderSubtle: '#f0f0f0',
    text: '#111111',
    textMuted: '#666666',
    textSubtle: '#aaaaaa',
    accent: '#7c6af7',
    accentDim: '#ede9ff',
    accentForeground: '#ffffff',
    userBubble: '#ede9ff',
    assistantBubble: 'transparent',
    inputBackground: '#f5f5f5',
    inputBorder: '#e0e0e0',
    sidebarBackground: '#f9f9f9',
    sidebarBorder: '#eeeeee',
    danger: '#ef4444',
    dangerDim: '#fef2f2',
    success: '#22c55e',
    warning: '#f59e0b',
    codeBackground: '#f4f4f4',
    overlay: 'rgba(0,0,0,0.3)',
  },
}

export const typography = {
  size: { xs: 11, sm: 13, base: 15, lg: 17, xl: 20, xxl: 24, h1: 30 },
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: { tight: 18, base: 22, relaxed: 26, loose: 32 },
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
}

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, xxxxl: 48,
}

export const radius = {
  sm: 6, md: 10, lg: 16, xl: 20, xxl: 28, full: 9999,
}

export const shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 8 },
}

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
const atomOneDark = require('react-syntax-highlighter/dist/styles/hljs/atom-one-dark').default;
const atomOneLight = require('react-syntax-highlighter/dist/styles/hljs/atom-one-light').default;
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { Copy, Check } from 'lucide-react-native';
import { useTheme } from '../../theme';

type CodeBlockProps = {
  code: string;
  language: string;
};

export const CodeBlock: React.FC<CodeBlockProps> = React.memo(({ code, language }) => {
  const { colors, typography, radius, spacing, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    Toast.show({
      type: 'success',
      text1: 'Copied to clipboard',
    });
    setTimeout(() => setCopied(false), 1500);
  };

  const Icon = copied ? Check : Copy;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          borderRadius: radius.md,
          backgroundColor: colors.codeBackground,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, padding: spacing.sm }]}>
        <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, textTransform: 'uppercase' }}>
          {language}
        </Text>
        <TouchableOpacity onPress={handleCopy} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Icon size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: '100%', padding: spacing.md }}>
          <SyntaxHighlighter
            language={language}
            style={isDark ? atomOneDark : atomOneLight}
            customStyle={{
              padding: 0,
              margin: 0,
              backgroundColor: 'transparent',
            }}
            codeTagProps={{
              style: {
                fontFamily: typography.mono,
                fontSize: typography.size.xs,
                color: isDark ? atomOneDark['hljs']?.color : atomOneLight['hljs']?.color,
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        </View>
      </ScrollView>
    </View>
  );
});

CodeBlock.displayName = 'CodeBlock';

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

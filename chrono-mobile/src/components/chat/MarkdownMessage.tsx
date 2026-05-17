import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Markdown, { ASTNode } from 'react-native-markdown-display';
import { useTheme } from '../../theme';
import { CodeBlock } from './CodeBlock';
import { MathBlock } from './MathBlock';
import { ChartMessage } from './ChartMessage';

type MarkdownMessageProps = {
  content: string;
};

// Simple preprocessing to replace $$...$$ and $...$ with custom markers for our renderer
const preprocessMath = (text: string) => {
  let processed = text.replace(/\$\$(.*?)\$\$/gs, '\n```math\n$1\n```\n');
  processed = processed.replace(/\$(.*?)\$/g, '`math-inline:$1`');
  return processed;
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = React.memo(({ content }) => {
  const { colors, typography, spacing, radius } = useTheme();

  const processedContent = useMemo(() => preprocessMath(content), [content]);

  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.text,
          fontSize: typography.size.base,
          lineHeight: typography.lineHeight.relaxed,
        },
        heading1: { fontSize: typography.size.h1, fontWeight: typography.weight.bold, marginVertical: spacing.sm },
        heading2: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, marginVertical: spacing.sm },
        heading3: { fontSize: typography.size.xl, fontWeight: typography.weight.semibold, marginVertical: spacing.sm },
        heading4: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, marginVertical: spacing.sm },
        heading5: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginVertical: spacing.sm },
        heading6: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, marginVertical: spacing.sm },
        paragraph: { marginVertical: spacing.xs },
        strong: { fontWeight: typography.weight.bold },
        em: { fontStyle: 'italic' },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          backgroundColor: colors.accentDim,
          padding: spacing.md,
          marginVertical: spacing.sm,
          borderRadius: radius.sm,
        },
        code_inline: {
          backgroundColor: colors.codeBackground,
          fontFamily: typography.mono,
          fontSize: typography.size.sm,
          borderRadius: radius.sm,
          paddingHorizontal: 4,
          color: colors.text,
        },
        list_item: { marginVertical: 2 },
        bullet_list: { marginVertical: spacing.sm },
        ordered_list: { marginVertical: spacing.sm },
        link: { color: colors.accent, textDecorationLine: 'none' },
        hr: { backgroundColor: colors.border, height: 1, marginVertical: spacing.md },
      }),
    [colors, typography, spacing, radius]
  );

  const rules = {
    fence: (node: ASTNode | any, children: React.ReactNode[], parent: ASTNode[], styles: any) => {
      const language = node.sourceInfo || 'text';
      if (language === 'math') {
        return <MathBlock key={node.key} expression={node.content} display={true} />;
      }
      if (language === 'json' && node.content.includes('"type":')) {
        // Simple heuristic for charts
        try {
          const parsed = JSON.parse(node.content);
          if (parsed.type === 'bar' || parsed.type === 'line') {
             return <ChartMessage key={node.key} data={node.content} />;
          }
        } catch (e) {}
      }
      return <CodeBlock key={node.key} code={node.content} language={language} />;
    },
    code_inline: (node: ASTNode, children: React.ReactNode[], parent: ASTNode[], styles: any) => {
      if (node.content.startsWith('math-inline:')) {
        const expression = node.content.replace('math-inline:', '');
        return <MathBlock key={node.key} expression={expression} display={false} />;
      }
      return (
        <Text key={node.key} style={styles.code_inline}>
          {node.content}
        </Text>
      );
    },
  };

  // Check if content is purely JSON chart (fallback for Mock data without markdown fence)
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
     try {
       const parsed = JSON.parse(content);
       if (parsed.type === 'bar' || parsed.type === 'line') {
         return <ChartMessage data={content} />;
       }
     } catch(e) {}
  }

  return (
    <Markdown style={markdownStyles as any} rules={rules}>
      {processedContent}
    </Markdown>
  );
});

MarkdownMessage.displayName = 'MarkdownMessage';
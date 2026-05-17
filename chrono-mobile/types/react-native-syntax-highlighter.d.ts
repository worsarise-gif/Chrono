declare module 'react-native-syntax-highlighter' {
  const SyntaxHighlighter: any;
  export default SyntaxHighlighter;
}
declare module 'react-syntax-highlighter/dist/styles/hljs/atom-one-dark' {
  const atomOneDark: any;
  export default atomOneDark;
}
declare module 'react-syntax-highlighter/dist/styles/hljs/atom-one-light' {
  const atomOneLight: any;
  export default atomOneLight;
}
declare module 'react-native-math-view' {
  import React from 'react';
  import { ViewProps } from 'react-native';

  export interface MathViewProps extends ViewProps {
    math: string;
    style?: any;
  }
  const MathView: React.FC<MathViewProps>;
  export default MathView;

  export interface MathTextProps {
    value: string;
    style?: any;
  }
  export const MathText: React.FC<MathTextProps>;
}
declare module 'victory-native' {
  export const VictoryChart: any;
  export const VictoryBar: any;
  export const VictoryLine: any;
  export const VictoryTheme: any;
  export const VictoryAxis: any;
}

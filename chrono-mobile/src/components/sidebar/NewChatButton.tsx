import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { useTheme } from '../../theme';

type NewChatButtonProps = {
  onPress: () => void;
};

export const NewChatButton: React.FC<NewChatButtonProps> = ({ onPress }) => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, { marginHorizontal: spacing.lg }]}>
      <Button
        variant="primary"
        size="md"
        label="New Chat"
        icon={Plus as any}
        onPress={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

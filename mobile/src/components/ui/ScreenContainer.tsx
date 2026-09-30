import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFashionTheme } from '../../constants/theme';
import { AppHeader } from './AppHeader';
import { AppBottomNav, TabKey } from './AppBottomNav';

export interface ScreenContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  activeTab?: TabKey;
  showHeader?: boolean;
  showBottomNav?: boolean;
  style?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  activeTab,
  showHeader = true,
  showBottomNav = true,
  style,
}) => {
  const { colors, isDark } = useFashionTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.container, { backgroundColor: colors.background }, style]}>
        {showHeader && title ? (
          <AppHeader
            title={title}
            subtitle={subtitle}
            showBack={showBack}
            onBack={onBack}
            rightAction={rightAction}
          />
        ) : null}

        <View style={styles.content}>{children}</View>

        {showBottomNav && activeTab ? (
          <AppBottomNav activeTab={activeTab} />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

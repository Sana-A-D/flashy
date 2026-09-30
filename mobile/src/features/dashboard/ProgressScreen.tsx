import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii } from '../../constants/theme';
import { AppCard, SectionHeader } from '../../components';

export function ProgressScreen() {
  const navigation = useNavigation();

  const phases = [
    { num: 'Phase 0–30', status: 'COMPLETED', desc: 'Core Backend, Reseller Domain, Mobile Scaffolding & API Adapters' },
    { num: 'Phase 31', status: 'COMPLETED', desc: 'End-to-End Validation, Multi-marketplace Sync & Reliability' },
    { num: 'Phase 32', status: 'COMPLETED', desc: 'AI Item Intelligence, Market Research & One-Tap eBay Publishing' },
    { num: 'Phase 33–45', status: 'PLANNED', desc: 'Advanced Channel Automation, Bulk Intake & Production Scaling' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SectionHeader
          title="Flashy Product Roadmap"
          subtitle="Evolution into Visual Fashion Intelligence & Discovery"
        />

        {phases.map((p, idx) => (
          <AppCard key={idx} variant="flat" style={styles.phaseCard}>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseNum}>{p.num}</Text>
              <View
                style={[
                  styles.statusBadge,
                  p.status === 'COMPLETED'
                    ? styles.statusDone
                    : p.status === 'IN_PROGRESS'
                    ? styles.statusActive
                    : styles.statusPlanned,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    p.status === 'COMPLETED'
                      ? styles.textDone
                      : p.status === 'IN_PROGRESS'
                      ? styles.textActive
                      : styles.textPlanned,
                  ]}
                >
                  {p.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.phaseDesc}>{p.desc}</Text>
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  phaseCard: {
    marginBottom: spacing.xs,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  phaseNum: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusDone: {
    backgroundColor: colors.successBg,
  },
  statusActive: {
    backgroundColor: colors.primaryLight,
  },
  statusPlanned: {
    backgroundColor: colors.surfaceMuted,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  textDone: {
    color: colors.success,
  },
  textActive: {
    color: colors.primaryDark,
  },
  textPlanned: {
    color: colors.textSecondary,
  },
  phaseDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.xs,
  },
});

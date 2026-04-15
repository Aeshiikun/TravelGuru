import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export default function LandmarkResultScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false}>
        {/* Hero */}
        <LinearGradient
          colors={['#2A4A3C', '#1A3028']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Glow */}
          <View style={styles.heroGlow} />

          {/* Tags */}
          <View style={styles.tagRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>ANCIENT ROME</Text>
            </View>
            <View style={styles.confidencePill}>
              <Text style={styles.confidenceText}>98% match</Text>
            </View>
          </View>

          {/* Monument illustration */}
          <View style={styles.monumentWrap}>
            {/* Colosseum sketch */}
            <View style={styles.colosseumArc}>
              <View style={styles.colosseumBase}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.arch} />
                ))}
              </View>
            </View>
          </View>

          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.name}>Colosseum</Text>
          <Text style={styles.location}>📍 Rome, Italy · Built 70–80 AD</Text>

          {/* Chips */}
          <View style={styles.chips}>
            {['UNESCO Site', 'Free Entry', 'Top Rated', 'Audio Tour'].map((chip, i) => (
              <View
                key={chip}
                style={[styles.chip, i % 2 === 1 ? styles.chipGreen : null]}
              >
                <Text
                  style={[
                    styles.chipText,
                    i % 2 === 1 ? styles.chipTextGreen : null,
                  ]}
                >
                  {chip}
                </Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.description}>
            The Colosseum is an elliptical amphitheatre in the centre of Rome,
            Italy. Built of travertine limestone, tuff, and brick-faced concrete,
            it is the largest amphitheatre ever built, and is considered one of the
            greatest works of Roman architecture and engineering.
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { icon: '👁️', label: '3.9M', sub: 'Visitors/yr' },
              { icon: '📐', label: '188m', sub: 'Length' },
              { icon: '🏛️', label: '80 AD', sub: 'Completed' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statVal}>{stat.label}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => navigation.navigate('Navigate')}
            >
              <Text style={styles.actionBtnTextWhite}>🎧 Audio Tour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]}>
              <Text style={styles.actionBtnTextJade}>🗺️ Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionTertiary]}>
              <Text style={styles.actionBtnTextMuted}>🔖 Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  hero: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(200,98,42,0.25)',
    left: -40,
    bottom: -60,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: 'rgba(200,98,42,0.9)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  tagText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    color: colors.white,
    letterSpacing: 1.2,
  },
  confidencePill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  confidenceText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
  },
  monumentWrap: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  colosseumArc: {
    alignItems: 'center',
  },
  colosseumBase: {
    flexDirection: 'row',
    gap: 5,
  },
  arch: {
    width: 20,
    height: 60,
    backgroundColor: 'rgba(245,239,224,0.15)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,239,224,0.25)',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  backText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  body: {
    padding: 18,
  },
  name: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 26,
    color: colors.ink,
    lineHeight: 30,
  },
  location: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  chip: {
    backgroundColor: colors.terraPale,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  chipGreen: {
    backgroundColor: colors.jadePale,
  },
  chipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: colors.terra,
  },
  chipTextGreen: {
    color: colors.jade,
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.inkMid,
    lineHeight: 21,
    marginTop: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  statVal: {
    fontFamily: 'Syne_700Bold',
    fontSize: 13,
    color: colors.ink,
  },
  statSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9,
    color: colors.muted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionPrimary: {
    backgroundColor: colors.terra,
  },
  actionSecondary: {
    backgroundColor: colors.jadePale,
  },
  actionTertiary: {
    backgroundColor: colors.sandDark,
  },
  actionBtnTextWhite: {
    fontFamily: 'Syne_700Bold',
    fontSize: 11,
    color: colors.white,
  },
  actionBtnTextJade: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 11,
    color: colors.jade,
  },
  actionBtnTextMuted: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 11,
    color: colors.inkMid,
  },
});
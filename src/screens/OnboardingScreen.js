import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const slides = [
  {
    step: 'Step 1 of 3',
    title: 'Point & instantly\nknow anything',
    description:
      'Simply raise your phone and point at any landmark. TravelGuru identifies it within 3 seconds and delivers rich audio history.',
    features: [
      { emoji: '🏛️', label: 'Landmarks\n& Buildings' },
      { emoji: '🗿', label: 'Statues\n& Monuments' },
      { emoji: '📋', label: 'Signs\n& Plaques' },
    ],
    accent: colors.jade,
  },
  {
    step: 'Step 2 of 3',
    title: 'Navigate with\nAR guidance',
    description:
      'Walk confidently with turn-by-turn AR directions overlaid on your camera view. Never get lost in a new city again.',
    features: [
      { emoji: '🗺️', label: 'AR\nNavigation' },
      { emoji: '📍', label: 'Points of\nInterest' },
      { emoji: '🧭', label: 'Offline\nMaps' },
    ],
    accent: colors.terra,
  },
  {
    step: 'Step 3 of 3',
    title: 'Speak, translate\n& connect',
    description:
      'Real-time translation by pointing your camera at signs. Voice queries in any language. Your AI guide speaks 40+ languages.',
    features: [
      { emoji: '🌐', label: '40+\nLanguages' },
      { emoji: '🎙️', label: 'Voice\nQueries' },
      { emoji: '📷', label: 'Camera\nTranslate' },
    ],
    accent: colors.jade,
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('Main');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[slide.accent, slide.accent + 'CC']}
        style={styles.header}
      >
        <View style={styles.headerDecorOuter} />
        <View style={styles.headerDecorInner} />
        <Text style={styles.stepLabel}>{slide.step}</Text>
        <Text style={styles.title}>{slide.title}</Text>
      </LinearGradient>

      {/* Feature cards */}
      <View style={styles.iconRow}>
        {slide.features.map((feature, i) => (
          <View key={i} style={styles.iconCard}>
            <Text style={styles.iconEmoji}>{feature.emoji}</Text>
            <Text style={styles.iconLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.description}>{slide.description}</Text>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentSlide ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.terra }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>
          {currentSlide < slides.length - 1 ? 'Continue →' : 'Start Exploring →'}
        </Text>
      </TouchableOpacity>

      {/* Skip */}
      {currentSlide < slides.length - 1 && (
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  header: {
    height: 180,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  headerDecorOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    top: -30,
    right: -14,
  },
  headerDecorInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    top: 14,
    right: 20,
  },
  stepLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Syne_700Bold',
    fontSize: 22,
    color: colors.white,
    lineHeight: 28,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  iconCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  iconLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: colors.inkMid,
    textAlign: 'center',
    lineHeight: 14,
  },
  description: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.terra,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.sandDark,
  },
  btn: {
    marginHorizontal: 20,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  btnText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 13,
    color: colors.white,
    letterSpacing: 0.8,
  },
  skipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    paddingBottom: 8,
  },
});
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.85);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Background gradients */}
      <View style={styles.bgGradient1} />
      <View style={styles.bgGradient2} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Globe rings */}
        <View style={styles.globeOuter}>
          <View style={styles.globeMiddle}>
            <LinearGradient
              colors={['#C8622A', '#8B3A15', '#3D1A08']}
              start={{ x: 0.4, y: 0.35 }}
              end={{ x: 1, y: 1 }}
              style={styles.globeInner}
            />
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoTitle}>TravelGuru</Text>
          <Text style={styles.logoSub}>POINT. KNOW. EXPLORE.</Text>
        </View>

        <Text style={styles.tagline}>
          Instant landmark recognition{'\n'}& AI travel companion
        </Text>
      </Animated.View>

      {/* Bottom actions */}
      <Animated.View style={[styles.bottomWrap, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.btnStart}
          onPress={() => navigation.navigate('Onboarding')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnStartText}>Get Started →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.7}
        >
          <Text style={styles.loginLink}>Already exploring? Sign in</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  bgGradient1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: 'rgba(200,98,42,0.1)',
    bottom: -width * 0.3,
    left: -width * 0.25,
  },
  bgGradient2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(42,122,92,0.08)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  globeOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(200,98,42,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  globeMiddle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: 'rgba(200,98,42,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoTitle: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 34,
    color: colors.sand,
    letterSpacing: -0.5,
  },
  logoSub: {
    fontFamily: 'Syne_700Bold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 2,
    marginTop: 4,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular_Italic',
    fontSize: 13,
    color: 'rgba(245,239,224,0.45)',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomWrap: {
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 52,
    gap: 14,
  },
  btnStart: {
    backgroundColor: colors.terra,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnStartText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
    color: colors.white,
    letterSpacing: 1,
  },
  loginLink: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
});
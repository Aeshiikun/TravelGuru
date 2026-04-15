// src/screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { getStats, subscribe } from '../store';

export default function ProfileScreen() {
  const [audioNarration, setAudioNarration] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [offlineMaps, setOfflineMaps] = useState(true);
  const [stats, setStats] = useState(getStats());

  useFocusEffect(
    React.useCallback(() => {
      setStats(getStats());
    }, [])
  );

  useEffect(() => {
    const unsub = subscribe(() => setStats(getStats()));
    return unsub;
  }, []);

  const SettingRow = ({ icon, label, sub, value, onToggle, arrow }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {onToggle !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.sandDark, true: colors.terra }}
          thumbColor="#fff"
        />
      )}
      {arrow && <Text style={styles.arrow}>›</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>TG</Text>
        </View>
      </View>

      <View style={styles.nameWrap}>
        <Text style={styles.name}>TravelGuru Explorer</Text>
        <Text style={styles.handle}>Your journey, your story</Text>
      </View>

      {/* Live stats from store */}
      <View style={styles.statsRow}>
        {[
          { label: 'Scanned', value: String(stats.scanned) },
          { label: 'Countries', value: String(stats.countries) },
          { label: 'Saved', value: String(stats.saved) },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsCard}>
          <SettingRow icon="🔊" label="Audio Narration" sub="Auto-play on scan" value={audioNarration} onToggle={setAudioNarration} />
          <View style={styles.separator} />
          <SettingRow icon="🌐" label="Language" sub="English (US)" arrow />
          <View style={styles.separator} />
          <SettingRow icon="🗺️" label="Offline Maps" sub="Download for offline use" value={offlineMaps} onToggle={setOfflineMaps} />
        </View>

        <Text style={styles.sectionTitle}>Accessibility</Text>
        <View style={styles.settingsCard}>
          <SettingRow icon="♿" label="Large Text Mode" sub="Increase readability" value={largeText} onToggle={setLargeText} />
          <View style={styles.separator} />
          <SettingRow icon="🔆" label="High Contrast" sub="Better visibility" value={highContrast} onToggle={setHighContrast} />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingRow icon="🔒" label="Privacy Settings" arrow />
          <View style={styles.separator} />
          <SettingRow icon="📤" label="Export My Data" arrow />
          <View style={styles.separator} />
          <SettingRow icon="❓" label="Help & Support" arrow />
        </View>

        <TouchableOpacity style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TravelGuru v1.0.0 · Made with ❤️</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  hero: { backgroundColor: colors.jade, height: 120, alignItems: 'center', justifyContent: 'flex-end' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.terra, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', marginBottom: -36 },
  avatarText: { fontFamily: 'Syne_800ExtraBold', fontSize: 24, color: '#fff' },
  nameWrap: { alignItems: 'center', marginTop: 44, marginBottom: 16 },
  name: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.ink },
  handle: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.ink },
  statLabel: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8, marginTop: 8 },
  settingsCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, marginBottom: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.sandDark, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.ink },
  settingSub: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  arrow: { fontSize: 20, color: colors.muted, fontWeight: '300' },
  separator: { height: 1, backgroundColor: colors.sandDark, marginHorizontal: 14 },
  signOutBtn: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,98,42,0.3)' },
  signOutText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.terra },
  version: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 16 },
});
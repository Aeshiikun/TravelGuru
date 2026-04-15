// src/screens/CameraScreen.js - FULL WORKING VERSION
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, StatusBar, Alert, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';
import landmarks from '../data/landmarks.json';
import { setCurrentLandmark } from './VoiceScreen';
import { addScan } from '../store';

const { width, height } = Dimensions.get('window');

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/NoUercEoc/';

function getLandmarkData(predictedLabel) {
  if (!predictedLabel) return null;
  const clean = predictedLabel.toLowerCase().trim();
  return landmarks.find(l =>
    l.name.toLowerCase().includes(clean) ||
    clean.includes(l.name.toLowerCase()) ||
    l.tags?.some(tag => clean.includes(tag))
  ) || {
    name: predictedLabel,
    location: 'Unknown Location',
    year: 'Unknown',
    type: 'Landmark',
    emoji: 'location_on',
    shortDescription: `Identified as ${predictedLabel}.`,
    fullHistory: `This appears to be ${predictedLabel} based on visual recognition.`,
    funFacts: [],
    visitingHours: 'N/A',
    ticketPrice: 'N/A',
  };
}

const TM_INFERENCE_HTML = (modelUrl, base64) => `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"></script>
</head>
<body>
<script>
async function run() {
  try {
    const modelURL = "${modelUrl}model.json";
    const metadataURL = "${modelUrl}metadata.json";
    const model = await tmImage.load(modelURL, metadataURL);
    const img = new Image();
    img.onload = async function() {
      const predictions = await model.predict(img);
      const top = predictions.reduce((a, b) => a.probability > b.probability ? a : b);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        success: true,
        label: top.className,
        confidence: Math.round(top.probability * 100),
        all: predictions.map(p => ({ label: p.className, confidence: Math.round(p.probability * 100) }))
      }));
    };
    img.src = "data:image/jpeg;base64,${base64}";
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ success: false, error: e.message }));
  }
}
run();
</script>
</body>
</html>
`;

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [inferenceHTML, setInferenceHTML] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const cameraRef = useRef(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!scanning) {
      scanLineAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanning]);

  const handleScan = async () => {
    if (scanning || !cameraRef.current) return;
    setScanning(true);
    setResult(null);
    setInferenceHTML(null);
    resultAnim.setValue(0);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6, base64: true, skipProcessing: true,
      });
      setInferenceHTML(TM_INFERENCE_HTML(MODEL_URL, photo.base64));
    } catch (err) {
      Alert.alert('Error', 'Could not take photo. Try again.');
      setScanning(false);
    }
  };

  const handleInferenceMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setInferenceHTML(null);
      if (data.success) {
        const landmarkData = getLandmarkData(data.label);
        setCurrentLandmark(landmarkData);
        addScan(landmarkData);
        setResult({ ...landmarkData, confidence: data.confidence, allPredictions: data.all });
        Animated.spring(resultAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
      } else {
        Alert.alert('Could not identify', 'Try pointing at a clearer view of the landmark.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setShowDetails(false);
    resultAnim.setValue(0);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permContainer]}>
        <Icon name="camera-alt" size={48} color={colors.sand} />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>TravelGuru needs your camera to identify landmarks.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ✅ FIXED: WebView tiny & behind camera */}
      {inferenceHTML && (
        <WebView
          style={styles.webviewBehind}
          source={{ html: inferenceHTML }}
          javaScriptEnabled
          onMessage={handleInferenceMessage}
          originWhitelist={['*']}
        />
      )}

      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {scanning && (
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{
                translateY: scanLineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, height * 0.75],
                }),
              }],
            },
          ]}
        />
      )}

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>TravelGuru</Text>
      </View>

      {!result && (
        <View style={styles.hintWrap}>
          <Text style={styles.hintText}>
            {scanning ? '🔍 Identifying landmark...' : 'Aim at any landmark'}
          </Text>
          {scanning && <Text style={styles.hintSub}>Running AI model...</Text>}
        </View>
      )}

      {result && !showDetails && (
        <Animated.View style={[styles.resultCard, {
          opacity: resultAnim,
          transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
        }]}>
          <View style={styles.resultHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName} numberOfLines={1}>{result.name}</Text>
              <View style={styles.locationRow}>
                <Icon name="location-on" size={14} color={colors.muted} />
                <Text style={styles.resultLocation}>{result.location}</Text>
              </View>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{result.confidence}%</Text>
            </View>
          </View>
          <View style={styles.yearBadge}>
            <Icon name={result.emoji || 'location_on'} size={14} color={colors.terra} />
            <Text style={styles.yearText}>{result.year} · {result.type}</Text>
          </View>
          <Text style={styles.resultDesc} numberOfLines={2}>{result.shortDescription}</Text>
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowDetails(true)}>
              <View style={styles.actionIconRow}>
                <Icon name="menu-book" size={14} color={colors.inkMid} />
                <Text style={styles.actionBtnText}>Full History</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnVoice]} onPress={() => navigation.navigate('Voice')}>
              <View style={styles.actionIconRow}>
                <Icon name="mic" size={14} color={colors.jade} />
                <Text style={[styles.actionBtnText, { color: colors.jade }]}>Guru Guide</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnAlt]} onPress={handleReset}>
              <View style={styles.actionIconRow}>
                <Icon name="refresh" size={14} color={colors.terra} />
                <Text style={[styles.actionBtnText, { color: colors.terra }]}>Rescan</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {result && showDetails && (
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsIconName}>
              <Icon name={result.emoji || 'location_on'} size={20} color={colors.terra} />
              <Text style={styles.detailsName}>{result.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Icon name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailsLocationRow}>
              <Icon name="location-on" size={14} color={colors.muted} />
              <Text style={styles.detailsLocation}>{result.location} · {result.year}</Text>
            </View>
            <Text style={styles.sectionLabel}>History</Text>
            <Text style={styles.detailsText}>{result.fullHistory}</Text>
            {result.funFacts?.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Fun Facts</Text>
                {result.funFacts.map((fact, i) => (
                  <View key={i} style={styles.factRow}>
                    <Icon name="star-outline" size={14} color={colors.terra} />
                    <Text style={styles.factText}>{fact}</Text>
                  </View>
                ))}
              </>
            )}
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Icon name="schedule" size={14} color={colors.muted} />
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue}>{result.visitingHours}</Text>
              </View>
              <View style={styles.infoBox}>
                <Icon name="confirmation-number" size={14} color={colors.muted} />
                <Text style={styles.infoLabel}>Ticket</Text>
                <Text style={styles.infoValue}>{result.ticketPrice}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.voiceGuideBtn} onPress={() => navigation.navigate('Voice')}>
              <View style={styles.voiceIconRow}>
                <Icon name="mic" size={16} color={colors.jade} />
                <Text style={styles.voiceGuideBtnText}>Ask the Voice Guide</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rescanBtn} onPress={handleReset}>
              <View style={styles.rescanIconRow}>
                <Icon name="refresh" size={16} color={colors.muted} />
                <Text style={styles.rescanText}>Scan Again</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {!result && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnActive]}
            onPress={handleScan}
            disabled={scanning}
            activeOpacity={0.85}
          >
            <View style={styles.scanBtnInner}>
              <Icon name={scanning ? "hourglass-empty" : "camera-alt"} size={24} color={colors.sand} />
            </View>
          </TouchableOpacity>
          <Text style={styles.scanHint}>{scanning ? 'Analyzing...' : 'Tap to identify'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // ✅ FIXED WebView styles
  webviewBehind: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: 1, 
    height: 1 
  },
  hiddenWebView: { width: 0, height: 0, position: 'absolute' },

  scanLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    backgroundColor: colors.terra,
    opacity: 0.85,
    elevation: 4,
  },

  topBar: {
    position: 'absolute', top: 48, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
  },
  topTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 18, color: colors.sand },

  hintWrap: {
    position: 'absolute',
    top: height * 0.42,
    left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: 'DMSans_400Regular', fontSize: 14,
    color: 'rgba(245,239,224,0.9)', letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, overflow: 'hidden',
  },
  hintSub: {
    fontFamily: 'DMSans_400Regular', fontSize: 11,
    color: 'rgba(245,239,224,0.5)', marginTop: 10,
  },

  resultCard: {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    backgroundColor: colors.sand, borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 },
  resultName: { fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.ink },
  resultLocation: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  confidenceBadge: { backgroundColor: colors.jadePale, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  confidenceText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.jade },
  yearBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.terraPale, 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    alignSelf: 'flex-start', 
    marginBottom: 10, 
    gap: 4 
  },
  yearText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.terra },
  resultDesc: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.inkMid, lineHeight: 20, marginBottom: 14 },
  resultActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { 
    flex: 1, 
    backgroundColor: colors.sandDark, 
    borderRadius: 10, 
    paddingVertical: 12, 
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnAlt: { backgroundColor: colors.terraPale },
  actionBtnVoice: { backgroundColor: colors.jadePale },
  actionBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.inkMid },

  // 👇 NEW ICON LAYOUTS
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  actionIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailsIconName: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  detailsLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  voiceIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  rescanIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },

  detailsCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: height * 0.15,
    backgroundColor: colors.sand, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 16,
  },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailsName: { fontFamily: 'Syne_800ExtraBold', fontSize: 20, color: colors.ink },
  closeBtn: { fontSize: 18, color: colors.muted, paddingLeft: 12 },
  detailsLocation: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted },
  sectionLabel: { fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.terra, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  detailsText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.inkMid, lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoBox: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: colors.muted },
  infoValue: { fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.ink },
  voiceGuideBtn: { 
    marginTop: 16, 
    backgroundColor: colors.jadePale, 
    borderRadius: 12, 
    paddingVertical: 12, 
    alignItems: 'center' 
  },
  voiceGuideBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.jade },
  rescanBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  rescanText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },

  bottomBar: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center', gap: 10 },
  scanBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.terra,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(245,239,224,0.3)',
    shadowColor: colors.terra, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  scanBtnActive: { backgroundColor: colors.inkMid },
  scanBtnInner: { 
    width: 52, height: 52, borderRadius: 26, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scanHint: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(245,239,224,0.6)' },

  permContainer: { backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.sand, marginBottom: 12 },
  permText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permBtn: { backgroundColor: colors.terra, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32 },
  permBtnText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.white },
});
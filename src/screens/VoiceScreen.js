// src/screens/VoiceScreen.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, StatusBar, Alert,
  TextInput, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Added for consistent icons
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { GROQ_API_KEY } from '@env';
import { colors } from '../theme/colors';
import landmarks from '../data/landmarks.json';

let CURRENT_LANDMARK = landmarks[0];

export function setCurrentLandmark(landmark) {
  CURRENT_LANDMARK = landmark;
}

function getAnswer(transcript, landmark) {
  if (!landmark) {
    return "Please scan a landmark first using the camera, then ask me about it!";
  }

  const text = transcript.toLowerCase();

  if (text.includes('what is') || text.includes('what\'s this') || text.includes('tell me about') || text.includes('what place')) {
    return `This is ${landmark.name}, located in ${landmark.location}. ${landmark.shortDescription}`;
  }
  if (text.includes('how old') || text.includes('when was') || text.includes('what year') || text.includes('built')) {
    return `${landmark.name} dates back to ${landmark.year}. It is a ${landlandmark.type}.`;
  }
  if (text.includes('history') || text.includes('tell me more') || text.includes('background') || text.includes('story')) {
    return landmark.fullHistory;
  }
  if (text.includes('fun fact') || text.includes('interesting') || text.includes('did you know') || text.includes('facts')) {
    if (landmark.funFacts?.length > 0) {
      return `Here are some interesting facts about ${landmark.name}: ${landmark.funFacts.join('. ')}`;
    }
    return `I don't have fun facts for ${landmark.name} yet.`;
  }
  if (text.includes('open') || text.includes('close') || text.includes('visit') || text.includes('hours') || text.includes('time')) {
    return `${landmark.name} is open ${landmark.visitingHours}.`;
  }
  if (text.includes('ticket') || text.includes('price') || text.includes('fee') || text.includes('how much') || text.includes('entrance') || text.includes('cost')) {
    return `The entrance fee for ${landmark.name} is ${landmark.ticketPrice}.`;
  }
  if (text.includes('where') || text.includes('location') || text.includes('address') || text.includes('how to get')) {
    return `${landmark.name} is located in ${landmark.location}. Coordinates: ${landmark.coordinates.lat}, ${landmark.coordinates.lng}.`;
  }

  return `You asked: "${transcript}". I can answer questions about ${landmark.name} such as its history, visiting hours, ticket price, fun facts, and location. Try asking "What is this place?" or "Tell me the history."`;
}

async function transcribeAudio(uri) {
  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    name: 'voice_query.m4a',
    type: 'audio/m4a',
  });
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'en');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Transcription failed');
  }

  return data.text;
}

const TIMEOUT_MS = 12000;

export default function VoiceScreen() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [lastUri, setLastUri] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentLandmark, setCurrentLandmarkState] = useState(CURRENT_LANDMARK);

  // Text input mode state
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text'
  const [textInput, setTextInput] = useState('');
  const modeAnim = useRef(new Animated.Value(0)).current; // 0 = voice, 1 = text

  const scrollRef = useRef(null);
  const timeoutRef = useRef(null);
  const textInputRef = useRef(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.3)).current;
  const wave3 = useRef(new Animated.Value(0.3)).current;
  const wave4 = useRef(new Animated.Value(0.3)).current;
  const wave5 = useRef(new Animated.Value(0.3)).current;

  useFocusEffect(
    React.useCallback(() => {
      setCurrentLandmarkState(CURRENT_LANDMARK);
      return () => {};
    }, [])
  );

  useEffect(() => {
    return () => {
      Speech.stop();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const waves = [wave1, wave2, wave3, wave4, wave5];
    const animations = waves.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [isRecording]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    if (isRecording) pulse.start();
    else { pulse.stop(); pulseAnim.setValue(1); }
    return () => pulse.stop();
  }, [isRecording]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [history]);

  // Animate mode toggle
  const switchToMode = (mode) => {
    if (mode === inputMode) return;
    if (isRecording) stopRecording();
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); }
    setInputMode(mode);
    Animated.spring(modeAnim, {
      toValue: mode === 'text' ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
    if (mode === 'text') {
      setTimeout(() => textInputRef.current?.focus(), 300);
    } else {
      Keyboard.dismiss();
      setTextInput('');
    }
  };

  const processAudio = async (uri) => {
    setIsProcessing(true);
    setTimedOut(false);

    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      setIsProcessing(false);
    }, TIMEOUT_MS);

    try {
      const transcript = await transcribeAudio(uri);
      clearTimeout(timeoutRef.current);
      if (timedOut) return;

      const answer = getAnswer(transcript, currentLandmark);
      setHistory(prev => [...prev, { question: transcript, answer, mode: 'voice' }]);

      setIsSpeaking(true);
      Speech.speak(answer, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (err) {
      clearTimeout(timeoutRef.current);
      if (!timedOut) {
        Alert.alert('Error', `Could not process voice: ${err.message}`);
      }
    } finally {
      clearTimeout(timeoutRef.current);
      setIsProcessing(false);
    }
  };

  // Handle text submission
  const handleTextSubmit = () => {
    const query = textInput.trim();
    if (!query) return;
    Keyboard.dismiss();
    setTextInput('');
    const answer = getAnswer(query, currentLandmark);
    setHistory(prev => [...prev, { question: query, answer, mode: 'text' }]);
    setIsSpeaking(true);
    Speech.speak(answer, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required for voice queries.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setTimedOut(false);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording. Try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setLastUri(uri);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      await processAudio(uri);
    } catch (err) {
      Alert.alert('Error', `Could not stop recording: ${err.message}`);
    }
  };

  const handleRetry = async () => {
    if (!lastUri) return;
    setTimedOut(false);
    await processAudio(lastUri);
  };

  const handleMicPress = () => {
    if (isRecording) stopRecording();
    else if (!isProcessing && !timedOut) startRecording();
  };

  const handleStopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const handleQuickQuestion = (question) => {
    if (inputMode === 'text') {
      setTextInput(question);
      setTimeout(() => textInputRef.current?.focus(), 100);
      return;
    }
    const answer = getAnswer(question, currentLandmark);
    setHistory(prev => [...prev, { question, answer, mode: 'quick' }]);
    setIsSpeaking(true);
    Speech.speak(answer, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const getStatusText = () => {
    if (isRecording) return 'Listening… tap to stop';
    if (isProcessing) return 'Processing your voice…';
    if (timedOut) return 'Taking too long. Try again?';
    if (isSpeaking) return 'Speaking… tap to stop';
    return 'Tap the mic to ask';
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  // Interpolated position for mode toggle indicator
  const indicatorLeft = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Guru Guide</Text>
            <Text style={styles.headerSub}>Ask anything about your landmark</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
              <Icon name="clear" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        {currentLandmark && (
          <View style={styles.landmarkBadge}>
            <Icon 
              name={currentLandmark.type === 'temple' ? 'account-balance' : 
                    currentLandmark.type === 'castle' ? 'castle' : 
                    currentLandmark.type === 'museum' ? 'museum' : 
                    currentLandmark.type === 'monument' ? 'monument' : 
                    'location-on'} 
              size={16} 
              color={colors.terra}
              style={styles.landmarkBadgeIcon}
    />
            <Text style={styles.landmarkBadgeName}>{currentLandmark.name}</Text>
          </View>
        )}
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggleWrap}>
        <View style={styles.modeToggle}>
          <Animated.View style={[styles.modeIndicator, { left: indicatorLeft }]} />
          <TouchableOpacity
            style={styles.modeOption}
            onPress={() => switchToMode('voice')}
            activeOpacity={0.7}
          >
            <View style={styles.modeOptionIconWrap}>
              <Icon 
                name="mic" 
                size={16} 
                color={inputMode === 'voice' ? colors.white : colors.muted}
              />
            </View>
            <Text style={[styles.modeOptionText, inputMode === 'voice' && styles.modeOptionTextActive]}>
              Voice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeOption}
            onPress={() => switchToMode('text')}
            activeOpacity={0.7}
          >
            <View style={styles.modeOptionIconWrap}>
              <Icon 
                name="edit" 
                size={16} 
                color={inputMode === 'text' ? colors.white : colors.muted}
              />
            </View>
            <Text style={[styles.modeOptionText, inputMode === 'text' && styles.modeOptionTextActive]}>
              Type
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversation History */}
      <ScrollView
        ref={scrollRef}
        style={styles.history}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {history.length === 0 && (
          <View style={styles.emptyState}>
            <Icon 
              name={inputMode === 'text' ? "edit" : "mic"} 
              size={48} 
              color={colors.muted}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {inputMode === 'text'
                ? 'Type your question below about\n'
                : 'Tap the mic and ask anything about\n'}
              <Text style={{ color: colors.terra, fontFamily: 'Syne_700Bold' }}>
                {currentLandmark?.name || 'the landmark'}
              </Text>
            </Text>
          </View>
        )}
        {history.map((item, i) => (
          <View key={i}>
            <View style={styles.questionRow}>
              <View style={styles.questionModeTag}>
                <Icon 
                  name={item.mode === 'voice' ? "mic" : item.mode === 'text' ? "edit" : "bolt"} 
                  size={12} 
                  color={colors.terra}
                  style={styles.questionModeIcon}
                />
              </View>
              <View style={styles.questionBubble}>
                <Text style={styles.questionText}>{item.question}</Text>
              </View>
            </View>
            <View style={styles.answerBubble}>
              <View style={styles.answerLabelRow}>
                <View style={styles.answerDot} />
                <Text style={styles.answerLabel}>TRAVEL GURU</Text>
              </View>
              <Text style={styles.answerText}>{item.answer}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Voice Mode UI */}
      {inputMode === 'voice' && (
        <>
          <View style={styles.visualizer}>
            {isRecording && (
              <View style={styles.waveRow}>
                {[wave1, wave2, wave3, wave4, wave5].map((anim, i) => (
                  <Animated.View
                    key={i}
                    style={[styles.waveBar, { transform: [{ scaleY: anim }] }]}
                  />
                ))}
              </View>
            )}
            <Text style={[styles.statusText, timedOut && styles.statusTextWarning]}>
              {getStatusText()}
            </Text>
          </View>

          {timedOut ? (
            <View style={styles.retryWrap}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Icon name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retryBtnAlt} onPress={() => setTimedOut(false)}>
                <Icon name="mic" size={16} color={colors.muted} style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnAltText}>Record New</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.micWrap}>
              {isRecording && (
                <Animated.View style={[styles.micRing, { transform: [{ scale: pulseAnim }] }]} />
              )}
              {isRecording && (
                <Animated.View style={[styles.micRingOuter, { transform: [{ scale: pulseAnim }], opacity: 0.4 }]} />
              )}
              <TouchableOpacity
                style={[
                  styles.micBtn,
                  isRecording && styles.micBtnRecording,
                  isProcessing && styles.micBtnProcessing,
                  isSpeaking && styles.micBtnSpeaking,
                ]}
                onPress={isSpeaking ? handleStopSpeaking : handleMicPress}
                activeOpacity={0.85}
                disabled={isProcessing}
                > 
                <Icon 
                  name={
                    isProcessing ? "hourglass-empty" : 
                    isRecording ? "stop" : 
                    isSpeaking ? "volume-up" : 
                    "mic"
                  } 
                  size={28} 
                  color="#fff"
                  style={styles.micIcon}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Text Mode UI */}
      {inputMode === 'text' && (
        <View style={styles.textInputWrap}>
          {isSpeaking && (
            <TouchableOpacity style={styles.stopSpeakingBtn} onPress={handleStopSpeaking}>
              <Icon name="volume-up" size={14} color={colors.jade} style={{ marginRight: 6 }} />
              <Text style={styles.stopSpeakingText}>Stop Speaking</Text>
            </TouchableOpacity>
          )}
          <View style={styles.textInputRow}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your question here"
              placeholderTextColor={colors.muted}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={handleTextSubmit}
              blurOnSubmit={false}
              maxLength={200}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !textInput.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleTextSubmit}
              disabled={!textInput.trim()}
              activeOpacity={0.8}
            >
              <Icon name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Questions */}
      {!isRecording && !isProcessing && !timedOut && (
        <View style={styles.quickWrap}>
          <Text style={styles.quickLabel}>Quick questions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { text: 'What is this place?', icon: 'info-outline' },
              { text: 'Tell me the history', icon: 'history' },
              { text: 'How old is it?', icon: 'cake' },
              { text: 'What are the visiting hours?', icon: 'schedule' },
              { text: 'How much is the ticket?', icon: 'payment' },
              { text: 'Tell me fun facts', icon: 'emoji-events' },
            ].map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickChip}
                onPress={() => handleQuickQuestion(q.text)}
              >
                <Icon name={q.icon} size={14} color={colors.sand} style={styles.quickChipIcon} />
                <Text style={styles.quickChipText}>{q.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },

  // Header
  header: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 12 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 26, color: colors.sand },
  headerSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginTop: 4 },
  clearBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  landmarkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.inkMid, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(200,98,42,0.35)',
  },
  landmarkBadgeEmoji: { fontSize: 16 },
  landmarkBadgeName: { fontFamily: 'Syne_700Bold', fontSize: 12, color: colors.terra },

  // Mode Toggle
  modeToggleWrap: {
    paddingHorizontal: 24,
    paddingBottom: 6,
    alignItems: 'flex-start',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.inkMid,
    borderRadius: 24,
    padding: 3,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: 220,
  },
  modeIndicator: {
    position: 'absolute',
    top: 3,
    width: '48%',
    height: '92%',
    backgroundColor: colors.terra,
    borderRadius: 20,
    shadowColor: colors.terra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modeOptionIconWrap: {
    width: 24,
    height: 24,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeOptionText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  modeOptionTextActive: {
    color: colors.white,
    fontFamily: 'Syne_700Bold',
  },
  shyHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },

  // History
  history: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyIcon: { marginBottom: 16 },
  emptyText: {
    fontFamily: 'DMSans_400Regular', fontSize: 14,
    color: colors.muted, textAlign: 'center', lineHeight: 24,
  },

  // Chat Bubbles
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 6,
  },
  questionModeTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(200,98,42,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  questionModeIcon: { 
    // Icon styles handled inline for precise sizing
  },
  questionBubble: {
    backgroundColor: colors.terra,
    borderRadius: 18, borderBottomRightRadius: 5,
    paddingHorizontal: 14, paddingVertical: 10,
    maxWidth: '78%',
    shadowColor: colors.terra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  questionText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#fff', lineHeight: 19 },
  answerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.inkMid,
    borderRadius: 18, borderBottomLeftRadius: 5,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 18, maxWidth: '90%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  answerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  answerDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.terra,
  },
  answerLabel: {
    fontFamily: 'Syne_700Bold', fontSize: 9,
    color: colors.terra, letterSpacing: 1.5,
  },
  answerText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.sand, lineHeight: 20 },

  // Voice UI
  visualizer: { alignItems: 'center', paddingVertical: 10 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  waveBar: { width: 4, height: 32, borderRadius: 2, backgroundColor: colors.terra },
  statusText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, letterSpacing: 0.5 },
  statusTextWarning: { color: '#E8A838' },

  retryWrap: { alignItems: 'center', paddingBottom: 20, gap: 12 },
  retryBtn: {
    flexDirection: 'row',
    backgroundColor: colors.terra, borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center',
  },
  retryBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: '#fff' },
  retryBtnAlt: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  retryBtnAltText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted },

  micWrap: { alignItems: 'center', paddingBottom: 16, marginTop: 4 },
  micRing: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(200,98,42,0.12)',
  },
  micRingOuter: {
    position: 'absolute', width: 116, height: 116, borderRadius: 58,
    backgroundColor: 'rgba(200,98,42,0.06)',
  },
  micBtn: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: colors.terra,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.terra, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  micBtnRecording: { backgroundColor: '#8B3A15' },
  micBtnProcessing: { backgroundColor: colors.inkMid },
  micBtnSpeaking: { backgroundColor: colors.jade },
  micIcon: { 
    // Icon styles handled inline
  },

  // Text Input UI
  textInputWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 4,
    gap: 8,
  },
  stopSpeakingBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(42,122,92,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(42,122,92,0.3)',
    alignItems: 'center',
  },
  stopSpeakingText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.jade,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.inkMid,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.sand,
    paddingVertical: 6,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.terra,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.terra,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(200,98,42,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Quick Questions
  quickWrap: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 },
  quickLabel: {
    fontFamily: 'DMSans_400Regular', fontSize: 10,
    color: colors.muted, marginBottom: 8,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  quickChip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  quickChipIcon: {
    marginRight: 6,
  },
  quickChipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.sand },
});
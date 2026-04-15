// src/navigation/MainTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Best icon set
import { colors } from '../theme/colors';

import CameraScreen from '../screens/CameraScreen';
import NavigateScreen from '../screens/NavigateScreen';
import VoiceScreen from '../screens/VoiceScreen';
import TranslateScreen from '../screens/TranslateScreen';
import ExploreScreen from '../screens/ExploreScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ iconName, label, focused }) => (
  <View style={{ alignItems: 'center', paddingTop: 4 }}>
    <Icon 
      name={iconName}
      size={24}
      color={focused ? colors.terra : colors.muted}
      style={{ opacity: focused ? 1 : 0.6 }}
    />
    <Text
      style={{
        fontSize: 10,
        marginTop: 4,
        color: focused ? colors.terra : colors.muted,
        fontWeight: focused ? '600' : '400',
      }}
    >
      {label}
    </Text>
    {focused && (
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.terra,
          marginTop: 2,
        }}
      />
    )}
  </View>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: 'rgba(0,0,0,0.08)',
          borderTopWidth: 0.5,
          height: 64,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="camera-alt" label="Scan" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Navigate"
        component={NavigateScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="navigation" label="Navigate" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="mic" label="Guru" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Translate"
        component={TranslateScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="translate" label="Translate" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="explore" label="Explore" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
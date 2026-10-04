// saflash — Main tab navigator (bottom tabs)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import PathScreen from '../screens/PathScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { focused: 'map', unfocused: 'map-outline' },
  Review: { focused: 'albums', unfocused: 'albums-outline' },
  Progress: { focused: 'bar-chart', unfocused: 'bar-chart-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.deepOlive,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILY.semiBold,
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: COLORS.surfaceWhite,
          borderTopColor: COLORS.borderSage,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={PathScreen}
        options={{ tabBarLabel: 'Ruta' }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{ tabBarLabel: 'Repaso' }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progreso',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

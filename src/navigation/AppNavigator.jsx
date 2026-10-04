// saflash — Root app navigator
import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getConfig } from '../database/sessionRepository';
import useAppStore from '../store/appStore';
import OnboardingScreen from '../screens/OnboardingScreen';
import LevelPickScreen from '../screens/LevelPickScreen';
import PlacementTestScreen from '../screens/PlacementTestScreen';
import MainTabNavigator from './MainTabNavigator';
import StudyLessonScreen from '../screens/StudyLessonScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const onboardingDone = useAppStore(s => s.onboardingDone);
  const setOnboardingDoneStore = useAppStore(s => s.setOnboardingDone);
  const setLevelStore = useAppStore(s => s.setLevel);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const config = await getConfig();
      const done = config?.onboarding_done === 1 || config?.first_launch === 0;
      setOnboardingDoneStore(done);
      if (config?.level) setLevelStore(config.level);
      setInitialRoute(done ? 'MainTabs' : 'Onboarding');
    } catch (err) {
      // If DB not ready yet, show onboarding
      setInitialRoute('Onboarding');
    }
  };

  // Show nothing while checking
  if (!initialRoute) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="LevelPick" component={LevelPickScreen} />
      <Stack.Screen name="PlacementTest" component={PlacementTestScreen} />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="StudyLesson"
        component={StudyLessonScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ReviewSession"
        component={StudyLessonScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

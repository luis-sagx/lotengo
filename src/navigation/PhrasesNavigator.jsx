// saflash — Phrases stack navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import PhrasesScreen from '../screens/PhrasesScreen';
import PhrasesCategoryScreen from '../screens/PhrasesCategoryScreen';
import StudyPhrasesScreen from '../screens/StudyPhrasesScreen';

const Stack = createNativeStackNavigator();

export default function PhrasesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.warmParchment },
        headerTintColor: COLORS.deepOlive,
        headerTitleStyle: {
          fontFamily: FONT_FAMILY.bold,
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="PhrasesList"
        component={PhrasesScreen}
        options={{ title: 'Frases', headerShown: false }}
      />
      <Stack.Screen
        name="PhrasesCategory"
        component={PhrasesCategoryScreen}
        options={({ route }) => ({
          title: route.params?.category || 'Categoría',
          headerBackTitle: 'Atrás',
        })}
      />
      <Stack.Screen
        name="StudyPhrases"
        component={StudyPhrasesScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

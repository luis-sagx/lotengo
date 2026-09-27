// saflash — Words stack navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import WordsScreen from '../screens/WordsScreen';
import WordsCategoryScreen from '../screens/WordsCategoryScreen';
import StudyWordsScreen from '../screens/StudyWordsScreen';

const Stack = createNativeStackNavigator();

export default function WordsNavigator() {
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
        name="WordsList"
        component={WordsScreen}
        options={{ title: 'Palabras', headerShown: false }}
      />
      <Stack.Screen
        name="WordsCategory"
        component={WordsCategoryScreen}
        options={({ route }) => ({
          title: route.params?.category || 'Categoría',
          headerBackTitle: 'Atrás',
        })}
      />
      <Stack.Screen
        name="StudyWords"
        component={StudyWordsScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

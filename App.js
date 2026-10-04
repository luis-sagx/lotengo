// saflash — App entry point
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { initDatabase } from './src/database/database';
import { runSeeds } from './src/seeds/seedRunner';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/theme/colors';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  const [fontsLoaded] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    async function bootstrap() {
      try {
        const { needsSeed } = await initDatabase();
        if (needsSeed) await runSeeds();
        setDbReady(true);
      } catch (err) {
        console.error('Error initializing app:', err);
        setDbError(err.message || 'Error al inicializar la base de datos.');
      }
    }
    bootstrap();
  }, []);

  // Loading state
  if (!fontsLoaded || !dbReady) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.deepOlive} />
        <ActivityIndicator size="large" color={COLORS.surfaceWhite} />
      </View>
    );
  }

  // Error state
  if (dbError) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dangerOrange} />
        <ActivityIndicator size="large" color={COLORS.surfaceWhite} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.warmParchment} />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.deepOlive,
  },
});

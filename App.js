// saflash — App entry point
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
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

// Keep the native splash up until fonts and the database are ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

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

  const ready = fontsLoaded && dbReady;

  useEffect(() => {
    if (ready || dbError) SplashScreen.hideAsync().catch(() => {});
  }, [ready, dbError]);

  if (dbError) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dangerOrange} />
        <Text style={styles.errorTitle}>No se pudo iniciar la app</Text>
        <Text style={styles.errorText}>{dbError}</Text>
      </View>
    );
  }

  if (!ready) return null;

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
    padding: 24,
  },
  errorTitle: {
    color: COLORS.surfaceWhite,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.surfaceWhite,
    fontSize: 15,
    textAlign: 'center',
  },
});

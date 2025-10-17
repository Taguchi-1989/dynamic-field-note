/**
 * Dynamic Field Note - メインアプリ
 * Phase 2: Navigation統合版 + アクセシビリティ対応
 */

import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DrawerNavigator } from './src/navigation/DrawerNavigator';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <PaperProvider>
          <NavigationContainer>
            <DrawerNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </PaperProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}

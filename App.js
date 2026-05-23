import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { cancelallnoti } from './utils/notificationhandler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import TabManagement from './Screens/TabManagement';
import PrivateNotes from './Screens/PrivateNotes';
import SettingsScreen from './Screens/SettingsScreen';
import FeedbackScreen from './Screens/FeedbackScreen';
import AddNotesScreen from './Screens/AddNotesScreen';
import AddTasksScreen from './Screens/AddTasksScreen';

const Stack = createNativeStackNavigator();

import React, { useState, useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import SystemNavigationBar from 'react-native-system-navigation-bar';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed while app was running:', detail.notification);
      }
    });

    async function checkInitialNotification() {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        console.log('Notification pressed when app was closed:', initialNotification.notification);
      }
    }

    checkInitialNotification();
    cancelallnoti();

    return () => {
      unsubscribeForeground();
    };
  }, []);

  useEffect(() => {
    SystemNavigationBar.setNavigationColor(isDarkMode ? '#252525' : '#fff');
    SystemNavigationBar.fullScreen(false);
    SystemNavigationBar.setBarMode(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode]);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Tabs"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Tabs" component={TabManagement} />
            <Stack.Screen name="PrivateNotes" component={PrivateNotes} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="AddNotes" component={AddNotesScreen} />
            <Stack.Screen name="AddTasks" component={AddTasksScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

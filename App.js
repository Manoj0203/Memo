import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Import your existing screen components
import Notes from './Screens/Notes';
import Tasks from './Screens/Tasks';

export default function App() {
  // State to manage which tab is currently active
  const [activeTab, setActiveTab] = useState('Notes'); // 'Notes' or 'Tasks'

  const [fontsLoaded, fontError] = useFonts({
    'body-Regular': require('./assets/Truculenta_18pt-Regular.ttf'),
    'heading-bold':require('./assets/Truculenta_28pt-Bold.ttf')
      // Add all your custom fonts here
    });
  
    const onLayoutRootView = useCallback(async () => {
      if (fontsLoaded || fontError) {
        await SplashScreen.hideAsync(); // Hide the splash screen once fonts are loaded or an error occurs
      }
    }, [fontsLoaded, fontError]);

  // Determine if the app is in dark mode
  const isDark = useColorScheme() === 'dark';

  // Function to render the active screen
  const renderScreen = () => {
    if(activeTab==='Notes')
    {
      return <Notes />
    }
    else
    {
      return <Tasks />
    }
  };

  return (
    <SafeAreaView onLayout={onLayoutRootView} style={[styles.container, { backgroundColor: isDark ? '#252525' : '#fff' }]}>
      {/* Content Area - Renders the active screen */}
      <View style={styles.contentContainer}>
        {renderScreen()}
      </View>

      {/* Custom Bottom Tab Bar */}
      <SafeAreaView
        style={[
          styles.tabBarContainer,
          { backgroundColor: isDark ? '#252525' : '#fff' }
        ]}
      >
        {/* Notes Tab Button */}
        <TouchableOpacity
          onPress={() => setActiveTab('Notes')}
          style={styles.tabButton}
        >
          <MaterialIcons
            name={activeTab === 'Notes' ? 'notes' : 'notes'}
            size={24}
            color={activeTab === 'Notes' ? 'orange' : 'gray'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'Notes' ? 'orange' : 'gray' },
            ]}
          >
            Notes
          </Text>
        </TouchableOpacity>

        {/* Tasks Tab Button */}
        <TouchableOpacity
          onPress={() => setActiveTab('Tasks')}
          style={styles.tabButton}
        >
          <FontAwesome5
            name={activeTab === 'Tasks' ? 'tasks' : 'tasks'}
            size={24}
            color={activeTab === 'Tasks' ? 'orange' : 'gray'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'Tasks' ? 'orange' : 'gray' },
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 0 : 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  tabLabel: {
    fontSize: 16,
    marginTop: 4,
    fontFamily:'heading-bold'
  },
});
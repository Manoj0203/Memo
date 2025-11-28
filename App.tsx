import { StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View, Platform } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import Notes from './Screens/Notes';
import Tasks from './Screens/Tasks';

import { cancelallnoti } from './utils/notificationhandler';

export default function App() {

	const isDarkMode = useColorScheme() === 'dark';

	const [activeTab, setActiveTab] = useState('Notes');

	useEffect(() => {
        // 1. Handle Foreground/Background Clicks
        const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                console.log('Notification pressed while app was running:', detail.notification);
                // Switch to the Tasks tab
                setActiveTab('Tasks');
            }
        });

        // 2. Handle App Quit Clicks (App Launch)
        async function checkInitialNotification() {
            const initialNotification = await notifee.getInitialNotification();

            if (initialNotification) {
                console.log('Notification pressed when app was closed:', initialNotification.notification);
                // Switch to the Tasks tab
                setActiveTab('Tasks');
            }
        }
        
        checkInitialNotification();

        return () => {
            // Clean up the foreground listener
            unsubscribeForeground();
        };
    }, []); // Run only on mount

    // Remove the renderScreen function entirely.

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#252525' : '#fff' }]}>
			<StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
			
			{/* Content Area - Renders the active screen */}
			<View style={styles.contentContainer}>
                {/* 💡 FIX: Direct Conditional Rendering */}
				{activeTab === 'Notes' ? <Notes /> : <Tasks />}
			</View>

			<SafeAreaView
				style={[
				styles.tabBarContainer,
				{ backgroundColor: isDarkMode ? '#252525' : '#fff' }
				]}
			>
				{/* Notes Tab Button */}
				<TouchableOpacity
				onPress={() => setActiveTab('Notes')}
				style={styles.tabButton}
				>
				<MaterialIcons
					name={activeTab === 'Notes' ? 'notes' : 'notes'}
					size={22}
					color={activeTab === 'Notes' ? 'orange' : 'gray'}
				/>
				<Text
					style={[
					styles.tabLabel,
					{ color: activeTab === 'Notes' ? 'orange' : 'gray' },
					// Assuming 'heading-bold' is a valid font from FONTS
					{ fontFamily:'impact' } 
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
					size={20}
					color={activeTab === 'Tasks' ? 'orange' : 'gray'}
				/>
				<Text
					style={[
					styles.tabLabel,
					{ color: activeTab === 'Tasks' ? 'orange' : 'gray' },
					// Assuming 'heading-bold' is a valid font from FONTS
					{ fontFamily:'impact' }
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
	//fontFamily:'impact' // Moved to inline style for safety
  },
});
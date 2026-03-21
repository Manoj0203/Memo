import { StatusBar, StyleSheet, useColorScheme, View, TouchableOpacity, Text } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import notifee, { TimestampTrigger, TriggerType, RepeatFrequency, AuthorizationStatus } from '@notifee/react-native';
import {onDisplayNotification} from './utils/notificationHandler'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventType } from '@notifee/react-native';

//Screens
import Notes from './Screens/Notes';
import Tasks from './Screens/Tasks';
import TabManagement from './Screens/TabManagement'
import PrivateNotes from './Screens/PrivateNotes'

const Stack = createNativeStackNavigator();

import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';

import SystemNavigationBar from 'react-native-system-navigation-bar';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { cancelallnoti } from './utils/notificationhandler';

export default function App() {
    const isDarkMode = useColorScheme() === 'dark';
    const [activeTab, setActiveTab] = useState('Notes');

    useEffect(() => {
        const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) =>
        {
            if (type === EventType.PRESS)
            {
                console.log('Notification pressed while app was running:', detail.notification);
                setActiveTab('Tasks');
            }
        });

        async function checkInitialNotification()
        {
            const initialNotification = await notifee.getInitialNotification();

            if (initialNotification)
            {
                console.log('Notification pressed when app was closed:', initialNotification.notification);
                setActiveTab('Tasks');
            }
        }
        
        checkInitialNotification();
        cancelallnoti();

        return () => {
            unsubscribeForeground();
        };
    }, []);

    useEffect(() => {
            SystemNavigationBar.setNavigationColor(isDarkMode?'#252525':'#fff')
            SystemNavigationBar.fullScreen(false)
            SystemNavigationBar.setBarMode(isDarkMode?'light':'dark')            
        }, [isDarkMode]);

    return (
        <NavigationContainer>
			<Stack.Navigator initialRouteName="Tabs" screenOptions={{headerShown:false}}>
				<Stack.Screen name='Notes' component={Notes} />
				<Stack.Screen name="Tasks" component={Tasks} />
				<Stack.Screen name="Tabs" component={TabManagement} />
				<Stack.Screen name="PrivateNotes" component={PrivateNotes} />
			</Stack.Navigator>
		</NavigationContainer>
    );
}

// ... (styles remain the same)
const styles = StyleSheet.create({
  container: {
	flex: 1,
  },
  contentContainer: {
	flex: 1,
  },
  tabBarContainer: {
    height:'8%',
    alignItems:'center',
    flexDirection:'row',
    justifyContent:'space-around'
  },
  tabButton: {
    height:'100%',
    flex:1,
    alignItems:'center',
    justifyContent:'center'
  },
  tabLabel: {
	fontSize: 16,
	marginTop: 2,
  },
});
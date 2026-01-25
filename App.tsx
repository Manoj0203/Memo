import { StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View, Platform } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context'; 
import notifee, { EventType } from '@notifee/react-native';
import { Provider as PaperProvider } from 'react-native-paper';

import SystemNavigationBar from 'react-native-system-navigation-bar';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import Notes from './Screens/Notes';
import Tasks from './Screens/Tasks';

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
        <SafeAreaProvider style={{backgroundColor:isDarkMode?'#252525':'#fff'}}>
            <PaperProvider>
                <SafeAreaView style={styles.contentContainer}>
                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {activeTab === 'Notes' ? <Notes /> : <Tasks />}
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabBarContainer, {backgroundColor:isDarkMode?'#252525':'#fff'}]}>
                        <TouchableOpacity onPress={() => setActiveTab('Notes')} style={styles.tabButton}>
                            <MaterialIcons
                                name={activeTab === 'Notes' ? 'notes' : 'notes'}
                                size={22}
                                color={activeTab === 'Notes' ? 'orange' : 'gray'}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: activeTab === 'Notes' ? 'orange' : 'gray' },
                                { fontFamily:'impact' } 
                                ]}>Notes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveTab('Tasks')} style={styles.tabButton}>
                            <FontAwesome5
                                name={activeTab === 'Tasks' ? 'tasks' : 'tasks'}
                                size={20}
                                color={activeTab === 'Tasks' ? 'orange' : 'gray'}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: activeTab === 'Tasks' ? 'orange' : 'gray' },
                                { fontFamily:'impact' } 
                                ]}>Tasks</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </PaperProvider>
        </SafeAreaProvider>
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
import { StyleSheet, Text, View, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { cancelallnoti } from '../utils/notificationhandler';
import Alerts from '../components/Alerts';

// Vector Icon Imports
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';

const NOTES_KEY = 'ASYNC_STORAGE_KEY_NOTES_Notes';
const TASKS_KEY = 'ASYNC_STORAGE_KEY_NOTES_Tasks';

const SettingsScreen = () => {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';
    const navi = useNavigation();

    const [showalertnotes, setShowAlertNotes] = useState(false);
    const [showalerttasks, setShowAlertTasks] = useState(false);

    const deleteAllNotes = async () => {
        await AsyncStorage.removeItem(NOTES_KEY);
    };

    const deleteAllTasks = async () => {
        cancelallnoti();
        await AsyncStorage.removeItem(TASKS_KEY);
    };

    const handleDeleteNotes = () => {
        setShowAlertNotes(true);
        // Alert.alert('Warning', 'This clears all Notes.\nThis process cannot be reversed.', [
        //     { text: 'Confirm', onPress: deleteAllNotes, style: 'destructive' },
        //     { text: 'Cancel', onPress: null },
        // ]);
    };

    const handleDeleteTasks = () => {
        setShowAlertTasks(true);
        // Alert.alert('Warning', 'This clears all Tasks.\nThis process cannot be reversed.', [
        //     { text: 'Confirm', onPress: deleteAllTasks, style: 'destructive' },
        //     { text: 'Cancel', onPress: null },
        // ]);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? '#252525' : '#fff',
        },
        TabTitle: {
            color: isDark ? '#fff' : '#000',
            fontSize: 35,
            fontFamily: 'impact',
            marginLeft: 15,
            marginBottom: 10,
        },
        subtitle: {
            marginLeft: 17,
            color: isDark ? '#C4BFBF' : '#666',
            fontFamily: 'Anaheim-Bold',
            fontSize: 18,
        },
        settingsbtn: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderRadius: 15,
        },
        settingtext: {
            marginTop: 7,
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 20,
            marginLeft: 15,
        },
        section: {
            alignItems: 'center',
            marginTop: 10,
        },
        sectionCard: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            alignItems: 'center',
            borderRadius: 15,
            width: '90%',
            overflow: 'hidden',
        },
        rowBtn: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderRadius: 15,
            paddingBottom: 13,
        },
        rowBtnWithIcon: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 13,
            borderRadius: 15,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ padding: 12, flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={icontheme} />
                </TouchableOpacity>
            </View>

            <Text style={styles.TabTitle}>MEMO</Text>

            {/* Delete Section */}
            <Text style={styles.subtitle}>Delete</Text>
            <View style={styles.section}>
                <View style={styles.sectionCard}>
                    <TouchableOpacity onPress={handleDeleteNotes} style={styles.rowBtn}>
                        <Text style={styles.settingtext}>All Notes</Text>
                        <Entypo name="chevron-right" size={18} color={isDark ? 'gray' : '#858383'} style={{ marginTop: 16, marginRight: 15 }} />
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#ccc', width: '95%' }} />
                    <TouchableOpacity onPress={handleDeleteTasks} style={styles.rowBtn}>
                        <Text style={styles.settingtext}>All Tasks</Text>
                        <Entypo name="chevron-right" size={18} color={isDark ? 'gray' : '#858383'} style={{ marginTop: 16, marginRight: 15 }} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Opinion Section */}
            <Text style={[styles.subtitle, { marginTop: 20 }]}>Opinion</Text>
            <View style={styles.section}>
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        onPress={() => navi.navigate('Feedback')}
                        style={styles.rowBtnWithIcon}>
                        <MaterialIcons name="feedback" size={23} color={isDark ? 'gray' : '#858383'} style={{ marginLeft: 10, marginTop: 3 }} />
                        <Text style={[styles.settingtext, { flex: 1 }]}>Feedback</Text>
                        <Entypo name="chevron-right" size={18} color={isDark ? 'gray' : '#858383'} style={{ marginRight: 15 }} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ALERT - DELETE NOTES */}
            <Alerts
                visible={showalertnotes}
                borderRadius={10}
                title={'Warning'}
                body={"Are you sure to delete ALL NOTES?\nIt can't be undone"}
                width={'90%'}
                bodyAlign='left'
                titleAlign="left"
                actionButtonAlign='right'
                onCancel={() => setShowAlertNotes(false)}
                onAlert={() => {
                    setShowAlertNotes(false);
                    deleteAllNotes();
                }}
                alertText='Delete' />

            {/* ALERT - DELETE TASK */}
            <Alerts
                visible={showalerttasks}
                borderRadius={10}
                title={'Warning'}
                body={"Are you sure to delete ALL TASKS?\nIt can't be undone"}
                width={'90%'}
                bodyAlign='left'
                titleAlign="left"
                actionButtonAlign='right'
                onCancel={() => setShowAlertTasks(false)}
                onAlert={() => {
                    setShowAlertTasks(false);
                    deleteAllTasks();
                }}
                alertText='Delete' />
        </SafeAreaView>
    );
};

export default SettingsScreen;

import {
    StyleSheet, Text, useColorScheme, View, TouchableOpacity,
    FlatList, Modal, Alert,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, FAB, Divider, Snackbar } from 'react-native-paper';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { cancelnoti } from '../utils/notificationhandler';

// Vector Icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const Tasks = () => {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';
    const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Tasks';

    const navi = useNavigation();

    const [allTasks, setAllTasks] = useState([]);
    const [showTasks, setShowTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected_id, setSelected_ID] = useState(0);
    const [selected_id_pinned, setSelected_ID_Pinned] = useState('');
    const [isoptionmodalvisible, setIsOptionModalVisible] = useState(false);
    const [Snack, setSnack] = useState(false);

    useFocusEffect(
        useCallback(() => {
            getTasks();
        }, [])
    );

    useEffect(() => {
        let currentTasks = [...allTasks];

        if (searchQuery.trim()) {
            currentTasks = currentTasks.filter(task => {
                const lowercasedQuery = searchQuery.toLowerCase();
                return task._title?.toLowerCase().includes(lowercasedQuery);
            });
        }

        const pinnedTasks = currentTasks.filter(task => task._ispinned === 'Yes');
        const unpinnedTasks = currentTasks.filter(task => task._ispinned !== 'Yes');
        setShowTasks([...pinnedTasks, ...unpinnedTasks]);
    }, [allTasks, searchQuery]);

    const loadTasks = async () => {
        try {
            const storedTasks = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
            if (storedTasks !== null) return JSON.parse(storedTasks);
            return [];
        } catch (e) {
            console.log(e);
            return [];
        }
    };

    const getTasks = async () => {
        const curTasks = await loadTasks();
        if (curTasks.length === 0) {
            setAllTasks([]);
            setShowTasks([]);
        } else {
            setAllTasks(curTasks);
            setShowTasks(curTasks);
        }
    };

    const saveTasks = async (taski) => {
        try {
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(taski));
        } catch (e) {
            console.log(e);
        }
    };

    const handlePin = async () => {
        if (selected_id === 0) return;

        const updatedAllTasks = allTasks.map(item => {
            if (item._id === selected_id) {
                return { ...item, _ispinned: item._ispinned === 'No' ? 'Yes' : 'No' };
            }
            return item;
        });

        await saveTasks(updatedAllTasks);
        setAllTasks(updatedAllTasks);
        setIsOptionModalVisible(false);
    };

    const handleDelete = async () => {
        const afterDeleteTask = showTasks.filter(item => item._id !== selected_id);
        cancelnoti(selected_id);
        setIsOptionModalVisible(false);
        setAllTasks(afterDeleteTask);
        await saveTasks(afterDeleteTask);
    };

    const handleOption = (id, pinned) => {
        setIsOptionModalVisible(true);
        setSelected_ID(id);
        setSelected_ID_Pinned(pinned);
    };

    const gettxt = (tasksArray) => {
        if (!tasksArray || tasksArray.length === 0) return [];
        return tasksArray.slice(0, 3).map(task => task.label);
    };

    const renderTasks = ({ item }) => {
        const taskLabels = gettxt(item?._tasks);
        return (
            <View style={styles.listContainer}>
                <TouchableOpacity
                    style={styles.listbtn}
                    onLongPress={() => handleOption(item?._id, item?._ispinned)}
                    onPress={() => navi.navigate('AddTasks', {
                        mode: 'edit',
                        taskId: item?._id,
                        taskTitle: item?._title,
                        taskItems: item?._tasks,
                        taskDate: item?._addeddate,
                        taskReminder: item?._reminder,
                        taskRepeat: item?._repeat,
                    })}>
                    <View style={{ flexDirection: 'row', marginHorizontal: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.listheading}>{item?._title}</Text>
                        {item?._ispinned === 'Yes' && (
                            <Entypo name="pin" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                        )}
                    </View>
                    <Text style={styles.listdate}>{item?._addeddate}</Text>
                    <View style={styles.tasksSummaryContainer}>
                        {taskLabels.map((label, idx) => (
                            <Text key={idx} style={styles.listTaskLabel}>☐    {label}</Text>
                        ))}
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? '#252525' : '#fff',
        },
        Searchbar: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '93%',
            borderRadius: 15,
            height: 45,
            marginBottom: 10,
        },
        TabTitle: {
            color: isDark ? '#fff' : '#000',
            fontSize: 35,
            fontFamily: 'impact',
            marginLeft: 15,
            marginBottom: 10,
        },
        fab: {
            position: 'absolute',
            margin: 16,
            right: '5%',
            bottom: '0%',
            backgroundColor: 'orange',
        },
        listContainer: {
            alignItems: 'center',
        },
        listbtn: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            marginBottom: 10,
            borderRadius: 10,
            width: '95%',
        },
        listheading: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 25,
            marginBottom: 7,
            color: isDark ? '#fff' : '#000',
        },
        listdate: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 17,
            marginLeft: 10,
            marginBottom: 7,
            color: isDark ? 'gray' : '#858383',
        },
        tasksSummaryContainer: {
            paddingHorizontal: 5,
        },
        listTaskLabel: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 17,
            marginLeft: 10,
            marginBottom: 7,
            color: isDark ? '#fff' : '#363636',
        },
        modalView: {
            margin: 0,
            backgroundColor: isDark ? '#252525' : '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            height: 230,
            maxHeight: '75%',
            width: '99%',
        },
        centeredView: {
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'center',
            backgroundColor: 'rgba(107, 107, 107, 0.4)',
        },
        ModalIcons: {
            marginLeft: 10,
            color: isDark ? '#C6C6C6' : '#000',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ alignItems: 'flex-end', marginRight: 15, marginTop: 10 }}>
                <TouchableOpacity onPress={() => navi.navigate('Settings')}>
                    <MaterialIcons name="settings" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
            </View>
            <Text style={styles.TabTitle}>Tasks</Text>
            <View style={{ alignItems: 'center' }}>
                <Searchbar
                    placeholder='Search Tasks'
                    placeholderTextColor={isDark ? '#e6e6e6aa' : 'gray'}
                    inputStyle={{ marginTop: -7, fontSize: 17, fontFamily: 'Anaheim-SemiBold', color: icontheme }}
                    style={styles.Searchbar}
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    iconColor={isDark ? 'gray' : '#5B5B5B'}
                    clearButtonMode='always' />
            </View>

            <FlatList
                data={showTasks}
                renderItem={renderTasks}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode='on-drag'
                ListEmptyComponent={() => (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: '65%' }}>
                        <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold' }}>
                            {searchQuery ? 'No matching results' : "Press '+' to add tasks"}
                        </Text>
                    </View>
                )} />

            <FAB
                icon={'plus'}
                style={styles.fab}
                rippleColor={'#ffc123'}
                color='#fff'
                onPress={() => navi.navigate('AddTasks', {
                    mode: 'add',
                    curDate: format(new Date(), 'dd-MMM-yyyy     hh:mm aa'),
                })} />

            <Snackbar
                visible={Snack}
                duration={1500}
                onDismiss={() => setSnack(false)}
                style={{ borderRadius: 15, bottom: '0%' }}>
                Task Added
            </Snackbar>

            {/* OPTION MODAL */}
            <Modal
                style={{ maxHeight: '50%' }}
                animationType='slide'
                transparent={true}
                visible={isoptionmodalvisible}
                onRequestClose={() => setIsOptionModalVisible(false)}>
                <View style={styles.centeredView}>
                    <TouchableOpacity style={{ flex: 1, paddingHorizontal: 1454 }} onPress={() => setIsOptionModalVisible(false)} />
                    <View style={styles.modalView}>
                        <View style={{ flexDirection: 'row' }}>
                            <FontAwesome6
                                style={{ margin: 13 }}
                                name="arrow-left"
                                size={20}
                                color={icontheme}
                                onPress={() => setIsOptionModalVisible(false)} />
                        </View>
                        <Divider />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
                            <TouchableOpacity onPress={handlePin} style={{ flexDirection: 'row', marginTop: 20, width: 175 }}>
                                <Entypo style={[styles.ModalIcons, { marginTop: 3 }]} name="pin" size={20} />
                                <Text style={{ marginLeft: 10, fontSize: 18, fontFamily: 'Anaheim-SemiBold', color: icontheme, marginTop: '-2.5%' }}>Pin/Unpin</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} style={{ flexDirection: 'row', marginTop: 20, width: 175 }}>
                                <MaterialIcons style={styles.ModalIcons} name="delete" size={22} />
                                <Text style={{ marginLeft: 10, fontSize: 18, fontFamily: 'Anaheim-SemiBold', color: icontheme, marginTop: '-2.5%' }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default Tasks;

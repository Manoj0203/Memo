import {
    StyleSheet, Text, TextInput, useColorScheme, View, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform, Share, Alert, Modal, BackHandler,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Divider } from 'react-native-paper';
import { format, parse } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { cancelnoti, onDisplayNotification } from '../utils/notificationhandler';

// Vector Icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import Alerts from '../components/Alerts';

const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Tasks';

const AddTasksScreen = () => {
    const navi = useNavigation();
    const route = useRoute();

    const {
        mode = 'add',
        curDate,
        taskId: existingId,
        taskTitle,
        taskItems,
        taskDate,
        taskReminder,
        taskRepeat,
    } = route.params || {};

    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';
    const defaultStyles = useDefaultStyles();
    const todaycur = new Date();

    const scrollViewRef = useRef(null);

    const [taskId] = useState(existingId || Date.now().toString());
    const [added_date] = useState(mode === 'edit' ? taskDate : curDate);
    const [title, setTitle] = useState(mode === 'edit' ? taskTitle || '' : '');
    const [checkboxes, setCheckboxes] = useState(mode === 'edit' ? taskItems || [] : []);
    const [inputText, setInputText] = useState('');
    const [nextId, setNextId] = useState(() => {
        if (mode === 'edit' && taskItems && taskItems.length > 0) {
            return taskItems.at(-1).id + 1;
        }
        return 0;
    });

    const [reminder_date, setReminder_Date] = useState(mode === 'edit' ? taskReminder || 'null' : 'null');
    const [repeat_time, setRepeat_Time] = useState(mode === 'edit' ? taskRepeat || 'Today' : 'Today');
    const [selecteddate, setSelectedDate] = useState(undefined);
    const [isdatepickmodalvisible, setIsDatePickModalVisible] = useState(false);
    const [entertitle, setEnterTitle] = useState(false);
    const [wrongreminder, setWrongReminder] = useState(false);

    useEffect(() => {
        const backAction = () => {
            handleSaveAndGoBack();
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [title, checkboxes, selecteddate, reminder_date]);

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

    const saveTasks = async (taski) => {
        try {
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(taski));
        } catch (e) {
            console.log(e);
        }
    };

    const handleSaveAndGoBack = async () => {
        const hasTitle = title.trim() !== '';
        const hasTasks = checkboxes.length > 0;

        if (!hasTitle && !hasTasks) {
            navi.goBack();
            return;
        }

        if (!hasTitle && hasTasks) {
            setEnterTitle(true);
            return;
        }

        if (hasTitle && !hasTasks) {
            navi.goBack();
            return;
        }

        if (selecteddate && new Date(selecteddate) <= new Date()) {
            setWrongReminder(true);
            return;
        }

        if (mode === 'add') {
            await addTask();
        } else {
            await editTask();
        }
        navi.goBack();
    };

    const addTask = async () => {

        const curTasks = await loadTasks();

        const newTask = {
            _id: taskId,
            _title: title,
            _tasks: checkboxes,
            _addeddate: added_date,
            _ispinned: 'No',
            _reminder: selecteddate ? format(selecteddate, 'dd-MMM-yyyy hh:mm aa') : 'null',
            _reminder_status: 'pending',
        };

        if (selecteddate) {
            console.log(`summa ${typeof Date.now()}`)
            const dateObject = parse(newTask._reminder, 'dd-MMM-yyyy hh:mm aa', new Date());
            const hour24 = format(dateObject, 'H');
            onDisplayNotification(
                newTask._id,
                hour24,
                format(dateObject, 'm'),
                format(dateObject, 'd'),
                format(dateObject, 'M'),
                format(dateObject, 'yyyy'),
                newTask._title,
                newTask._repeat
            );
        }

        await saveTasks([newTask, ...curTasks]);
    };

    const editTask = async () => {
        const curTasks = await loadTasks();

        if (title === '' && checkboxes.length === 0) {
            const filtered = curTasks.filter(item => item._id !== taskId);
            cancelnoti(taskId);
            await saveTasks(filtered);
            return;
        }

        const updated = curTasks.map(item => {
            if (item._id === taskId) {
                if (title.trim() === '') return item; // don't save empty title

                const updatedItem = {
                    ...item,
                    _title: title,
                    _tasks: checkboxes,
                };

                if (selecteddate) {
                    updatedItem._reminder = format(selecteddate, 'dd-MMM-yyyy hh:mm aa');
                    const dateObject = parse(updatedItem._reminder, 'dd-MMM-yyyy hh:mm aa', new Date());
                    const hour24 = format(dateObject, 'H');
                    onDisplayNotification(
                        item._id,
                        hour24,
                        format(dateObject, 'm'),
                        format(dateObject, 'd'),
                        format(dateObject, 'M'),
                        format(dateObject, 'yyyy'),
                        updatedItem._title,
                        item._repeat
                    );
                } else if (reminder_date && reminder_date !== 'null') {
                    updatedItem._reminder = reminder_date;
                } else {
                    updatedItem._reminder = 'null';
                    cancelnoti(item._id);
                }

                return updatedItem;
            }
            return item;
        });

        await saveTasks(updated);
    };

    const handleAddCheckbox = () => {
        const trimmedInput = inputText.trim();
        if (trimmedInput.length === 0) {
            Alert.alert('Empty Input', 'Please type something before pressing Enter.');
            return;
        }
        const newCheckbox = { id: nextId, label: trimmedInput, isChecked: false };
        setCheckboxes([...checkboxes, newCheckbox]);
        setNextId(nextId + 1);
        setInputText('');
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const toggleCheckbox = (id) => {
        setCheckboxes(checkboxes.map(cb => cb.id === id ? { ...cb, isChecked: !cb.isChecked } : cb));
    };

    const deleteCheckbox = (id) => {
        setCheckboxes(checkboxes.filter(cb => cb.id !== id));
    };

    const handleShare = async () => {
        let lists = '';
        checkboxes.forEach(item => { lists += '\n☐    ' + item.label; });
        Share.share({ message: `${title}\n${lists}` });
    };

    const MyCustomCheckbox = ({ label, isChecked, onToggle, onDelete }) => (
        <View style={styles.checkboxItem}>
            <TouchableOpacity onPress={onToggle} style={styles.checkboxTouchable}>
                <Text style={styles.checkboxIcon}>
                    {isChecked
                        ? <FontAwesome name="check-square" size={18} color="orange" />
                        : <Feather name="square" size={18} color="orange" />}
                </Text>
                <Text style={[styles.checkboxLabel, isChecked && styles.checkedLabel]}>{label}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                <Entypo name="squared-cross" size={22} color="#ff3333" />
            </TouchableOpacity>
        </View>
    );

    const styles = StyleSheet.create({
        titleEntry: {
            color: isDark ? '#fff' : '#000',
            fontSize: 25,
            marginLeft: 7,
            fontFamily: 'Anaheim-Bold',
        },
        dateText: {
            color: isDark ? 'gray' : '#000',
            marginLeft: 16,
            fontFamily: 'Anaheim-Regular',
            fontSize: 17,
            marginBottom: 10,
        },
        tasksEntry: {
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 18,
            paddingVertical: 10,
            paddingHorizontal: 10,
        },
        keyboardAvoidingContainer: {
            flex: 1,
        },
        scrollViewContent: {
            flexGrow: 1,
            paddingHorizontal: 15,
            paddingBottom: 75,
        },
        checkboxItem: {
            flexDirection: 'row',
            backgroundColor: isDark ? '#151515' : '#cecece',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
            paddingHorizontal: 5,
            borderRadius: 10,
            marginBottom: 5
        },
        checkboxTouchable: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        checkboxIcon: {
            marginRight: 10,
        },
        checkboxLabel: {
            fontSize: 17,
            fontFamily: 'Anaheim-SemiBold',
            color: isDark ? '#fff' : '#000',
            flex: 1,
        },
        checkedLabel: {
            textDecorationLine: 'line-through',
            color: isDark ? 'gray' : '#858383',
        },
        deleteButton: {
            paddingLeft: 10,
        },
        toolbar: {
            backgroundColor: isDark ? '#252525' : '#fff',
            paddingVertical: '3%',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#444' : '#ccc',
            flexDirection: 'row',
        },
        reminder_text_before: {
            color: isDark ? 'orange' : 'rgba(255, 161, 30, 1)',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 16,
        },
        reminder_text_after: {
            color: isDark ? 'orange' : 'rgba(255, 161, 30, 1)',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 16,
            top: '10%',
        },
        reminder_icon_before: {
            marginLeft: '12%',
            marginRight: '3%',
            marginTop: '2%',
        },
        reminder_icon_after: {
            marginLeft: '6%',
            marginRight: '3%',
            marginTop: '2%',
        },
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#fff' }}>
            <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={handleSaveAndGoBack}>
                    <Feather name="arrow-left" size={24} color={icontheme} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-outline" size={24} color={icontheme} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    ref={scrollViewRef}
                    keyboardShouldPersistTaps="always">

                    <TextInput
                        placeholder='Title'
                        maxLength={30}
                        selectionColor="#ffb52cc5"
                        selectionHandleColor="#ffb52cc5"
                        value={title}
                        onChangeText={setTitle}
                        style={styles.titleEntry}
                        placeholderTextColor={'gray'}
                        cursorColor={'gray'} />

                    <Text style={styles.dateText}>{added_date}</Text>

                    {checkboxes.map((checkbox) => (
                        <MyCustomCheckbox
                            key={checkbox.id}
                            label={checkbox.label}
                            isChecked={checkbox.isChecked}
                            onToggle={() => toggleCheckbox(checkbox.id)}
                            onDelete={() => deleteCheckbox(checkbox.id)} />
                    ))}

                    <TextInput
                        style={styles.tasksEntry}
                        placeholder="Add new item here..."
                        placeholderTextColor={'gray'}
                        selectionColor="#ffb52cc5"
                        selectionHandleColor="#ffb52cc5"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleAddCheckbox}
                        returnKeyType="done"
                        blurOnSubmit={false} />
                </ScrollView>

                {/* Reminder Toolbar */}
                <View style={styles.toolbar}>
                    {selecteddate || (reminder_date && reminder_date !== 'null') ?
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
                            <TouchableOpacity onPress={() => setIsDatePickModalVisible(true)} style={{ flexDirection: 'row' }}>
                                <Ionicons name="alarm" size={20} color={'orange'} style={styles.reminder_icon_after} />
                                <Text style={styles.reminder_text_after}>
                                    {' '}Reminder: {selecteddate ? format(selecteddate, 'dd-MMM-yyyy hh:mm aa') : reminder_date}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ marginRight: '6%' }}
                                onPress={() => { setSelectedDate(undefined); setReminder_Date('null'); }}>
                                <MaterialIcons name="cancel" size={20} color="#ff3333" />
                            </TouchableOpacity>
                        </View>
                        :
                        <TouchableOpacity onPress={() => setIsDatePickModalVisible(true)} style={{ flexDirection: 'row' }}>
                            <Ionicons name="alarm" size={20} color={'orange'} style={styles.reminder_icon_before} />
                            <Text style={styles.reminder_text_before}> Reminder</Text>
                        </TouchableOpacity>
                    }
                </View>
            </KeyboardAvoidingView>

            {/* No Title */}
            <Alerts
                visible={entertitle}
                borderRadius={10}
                title='Memo'
                body='Enter title to save tasks!'
                width={'80%'}
                onAlert={() => setEnterTitle(false)}
                type='info'
                alertText='Okay'
                alertColor={isDark ? '#ff2525' : '#e00000'}
                alertTextColor={'#fff'} />
            
            {/* Wrong reminder */}
            <Alerts
                visible={wrongreminder}
                borderRadius={10}
                title='Invalid Reminder'
                body='Reminder time must set in future!'
                width={'80%'}
                onAlert={() => {setWrongReminder(false); setIsDatePickModalVisible(true);}}
                type='info'
                alertText='Change'
                alertColor={isDark ? '#ff2525' : '#e00000'}
                alertTextColor={'#fff'} />

            {/* Date Picker Modal */}
            <Modal
                animationType='fade'
                transparent
                visible={isdatepickmodalvisible}
                onRequestClose={() => setIsDatePickModalVisible(false)}>
                <View style={{ justifyContent: 'center', backgroundColor: 'rgba(150,150,150,0.2)', flex: 1 }}>
                    <View style={{ backgroundColor: isDark ? '#252525' : '#fff', borderRadius: 10, width: '92%', marginLeft: '4%' }}>
                        <DateTimePicker
                            mode='single'
                            timePicker
                            use12Hours
                            minDate={todaycur}
                            date={selecteddate}
                            onChange={({ date }) => {
                                setSelectedDate(date);
                                const new_date = format(date, 'dd-MMM-yyyy hh:mm aa');
                                setReminder_Date(new_date);
                            }}
                            styles={{
                                ...defaultStyles,
                                today: { borderColor: 'orange', borderWidth: 1 },
                                selected: { backgroundColor: 'orange' },
                                selected_label: { color: 'white' },
                            }} />
                    </View>
                    <TouchableOpacity
                        style={{
                            backgroundColor: isDark ? '#252525' : '#fff',
                            borderRadius: 10,
                            width: '92%',
                            marginLeft: '4%',
                            marginTop: '2%',
                            paddingVertical: 14,
                            alignItems: 'center',
                        }}
                        onPress={() => setIsDatePickModalVisible(false)}>
                        <Text style={{ fontFamily: 'Anaheim-SemiBold', fontSize: 17, color: 'orange' }}>Done</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AddTasksScreen;

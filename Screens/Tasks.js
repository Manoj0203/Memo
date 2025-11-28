import { StyleSheet,TextInput, Text, useColorScheme, View, TouchableOpacity,
    FlatList, Modal, Share, KeyboardAvoidingView, Platform, ScrollView,
    Alert, Linking } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, FAB, Divider } from 'react-native-paper';
import { format, parse } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, {useDefaultStyles} from 'react-native-ui-datepicker';
import {cancelnoti, onDisplayNotification, cancelallnoti} from "../utils/notificationhandler";

//vector icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';

const Tasks = () => {
    const [scheduledId, setScheduledId] = useState(null);

    const [checkboxes, setCheckboxes] = useState([]);
    const [inputText, setInputText] = useState('');
    const [nextId, setNextId] = useState(0);

    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark?'#fff':'000';
    const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Tasks'

    const [isaddmodalvisible, setIsAddModalVisible] = useState(false)
    const [iseditmodalvisible, setIsEditModalVisible] = useState(false)
    const[isoptionmodalvisible, setIsOptionModalVisible] = useState(false)
    const[issettingsmodalvisible, setIsSettingsModalVisible] = useState(false)
    const[isfeedbackmodalvisible, setIsFeedbackModalVisible] = useState(false)    
    const [isdatepickmodalvisible, setIsDatePickModalVisible] = useState(false)

    const [added_date, setAdded_Date] = useState()
    const [reminder_date, setReminder_Date] = useState()
    const [title, setTitle] = useState('')
    const [allTasks, setAllTasks] = useState([]);
    const [showTasks, setShowTasks] = useState([])
    const [selected_id_pinned, setSelected_ID_Pinned] = useState('');
    const [feedback, setFeedback] = useState('');
    const [repeat_time, setRepeat_Time] = useState('Today')
    const [selecteddate, setSelectedDate] = useState()
    const [searchQuery, setSearchQuery] = useState('');
    const [selected_id, setSelected_ID] = useState(0)

    const scrollViewRef = useRef(null);
    const defaultStyles = useDefaultStyles();
    const todaycur = new Date()

    useEffect(() => {
            getTasks();
        },[isaddmodalvisible, iseditmodalvisible, isoptionmodalvisible, issettingsmodalvisible])
        
    useEffect(() => {
        // 1. Start with a copy of allNotes to avoid direct mutation
        let currentNotes = [...allTasks];
    
        // 2. Apply Search Filter
        if (searchQuery.trim()) {
            currentNotes = currentNotes.filter(note => {
                const lowercasedQuery = searchQuery.toLowerCase();
                const titleMatches = note._title?.toLowerCase().includes(lowercasedQuery);
                // Consider adding contentMatches here if you want to search notes content too
                return titleMatches;
            });
        }
    
        // 3. Separate Pinned and Unpinned Notes
        const pinnedTask = currentNotes.filter(note => note._ispinned === 'Yes');
        const unpinnedTask = currentNotes.filter(note => note._ispinned !== 'Yes');
    
        // 4. Combine Pinned first, then Unpinned
        const sortedAndFilteredNotes = [...pinnedTask, ...unpinnedTask];
    
        // 5. Update the state that FlatList renders
        setShowTasks(sortedAndFilteredNotes);
    }, [allTasks, searchQuery]);

    useEffect(() => {
        // 1. Start with a copy of allNotes to avoid direct mutation
        let currentTasks = [...allTasks];
    
        // 2. Apply Search Filter
        if (searchQuery.trim()) {
            currentTasks = currentTasks.filter(task => {
                const lowercasedQuery = searchQuery.toLowerCase();
                const titleMatches = task._title?.toLowerCase().includes(lowercasedQuery);
                // Consider adding contentMatches here if you want to search notes content too
                return titleMatches;
            });
        }
    
        // 3. Separate Pinned and Unpinned Notes
        const pinnedTasks = currentTasks.filter(task => task._ispinned === 'Yes');
        const unpinnedTasks = currentTasks.filter(task => task._ispinned !== 'Yes');
    
        // 4. Combine Pinned first, then Unpinned
        const sortedAndFilteredTasks = [...pinnedTasks, ...unpinnedTasks];
    
        // 5. Update the state that FlatList renders
        setShowTasks(sortedAndFilteredTasks);
    }, [allTasks, searchQuery]);

    const MyCustomCheckbox = ({ label, isChecked, onToggle, onDelete }) =>
    (
        <View style={styles.checkboxItem}>
            <TouchableOpacity onPress={onToggle} style={styles.checkboxTouchable}>
            <Text style={styles.checkboxIcon}>{isChecked ? <FontAwesome name="check-square" size={18} color="oraneg" /> : <Feather name="square" size={18} color="orange" />}</Text>
            <Text style={[styles.checkboxLabel, isChecked && styles.checkedLabel]}>
                {label}
            </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Entypo name="squared-cross" size={22} color="#ff3333" />
            </TouchableOpacity>
        </View>
    );

    const loadTasks =async() =>
    {
        try
        {
            const storedTasks = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)
            if(storedTasks !== null)
            {
                const tasks = JSON.parse(storedTasks)
                return tasks
            }
            else
            {
                return []
            }
        }
        catch(e)
        {
            console.log(e)
            return []
        }
    }

    const getTasks = async() =>
    {
        const curTasks = await loadTasks();

        if(curTasks.length === 0)
        {
            setAllTasks([])
            setShowTasks([])
            return 0;
        }
        else
        {
            setAllTasks(curTasks)
            setShowTasks(curTasks)
            curTasks.forEach((item, index) => {
                {/*console.log(item)*/}
            })
        }
    }

    const saveTasks = async (taski) =>
    {
        try
        {
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(taski))
        }
        catch (e)
        {
            console.log(e)
        }
    }

    const addTasks =async() =>
    {
        setNextId(0);
        if(checkboxes.length === 0 || title.trim() === '')
        {
            if(checkboxes.length === 0 && title.trim() === "")
            {
                return 0;
            }
            Alert.alert("Memo", "Enter Title and notes")
            setIsAddModalVisible(true);
            return 0;
        }
        const curTasks = await loadTasks();

        const newTasks = {
            _id:Date.now().toString(),
            _title:title,
            _tasks:checkboxes,
            _addeddate:added_date,
            _ispinned:'No',
            _reminder:selecteddate? format(selecteddate, "dd-MMM-yyyy hh:mm aa") : 'null',
            //_repeat: repeat_time,
            _reminder_status: 'pending'
        }
        const updatedTasks = [newTasks,...curTasks]
        /*const settings = await notifee.getNotificationSettings();

        if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED)
        {
            return true;
        }
        else
        {
            await notifee.requestPermission();
        }*/
        
        console.log('asdj')
        if(selecteddate)
        {
            const dateObject = parse(newTasks._reminder, "dd-MMM-yyyy hh:mm aa", new Date());
            const hour24 = format(dateObject, "H");

            onDisplayNotification(newTasks._id, hour24, format(dateObject, "m"), format(dateObject, "d"), format(dateObject, "M"), format(dateObject, "yyyy"), newTasks._title, newTasks._repeat)
            console.log(newTasks._id, hour24, format(dateObject, "m"), format(dateObject, "d"), format(dateObject, "M"), format(dateObject, "yyyy"), newTasks._title, newTasks._repeat)
        }

        await saveTasks(updatedTasks);
        setAllTasks(updatedTasks);
        setSelectedDate();
        
        setTitle('');
        setRepeat_Time("Today")
        setCheckboxes([]);
    }

    const handleAddCheckbox = () =>
    {
        const trimmedInput = inputText.trim();

        if (trimmedInput.length === 0) {
        Alert.alert("Empty Input", "Please type something before pressing Enter.");
        return;
        }

        const newCheckbox = {
        id: nextId,
        label: trimmedInput,
        isChecked: false,
        };

        setCheckboxes([...checkboxes, newCheckbox]); 
        setNextId(nextId + 1)
        setInputText('');
        
        setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const toggleCheckbox = (id) => {
        setCheckboxes(
            checkboxes.map((cb) =>
                cb.id === id ? { ...cb, isChecked: !cb.isChecked } : cb
            )
        );
    };

    const handlePin = async () => {
    if (selected_id === 0) {
        console.warn("No note selected for pinning.");
        return;
    }

    // Find the note that was selected for options
    const selectedTask = allTasks.find(item => item._id === selected_id);
    if (!selectedTask) {
        console.warn("Selected note not found.");
        setIsOptionModalVisible(false);
        return;
    }

    // Create a NEW array with the updated note (IMMUTABILITY!)
    const updatedAllTasks = allTasks.map(item => {
        if (item._id === selected_id) {
            return {
                ...item, // Copy all existing properties
                _ispinned: item._ispinned === 'No' ? 'Yes' : 'No' // Toggle pin status
            };
        }
        return item; // Return unchanged items as they are
    });

    // 1. Save the updated master list to AsyncStorage
    await saveTasks(updatedAllTasks);

    // 2. Update the component's state (allNotes).
    // This is crucial. When `allNotes` changes, the `useEffect` will re-run
    // and automatically re-filter and re-sort `showNotes`.
    setAllTasks(updatedAllTasks);

    // Close the options modal after handling the pin action
    setIsOptionModalVisible(false);
};

    const deleteCheckbox = (id) => {
        setCheckboxes(checkboxes.filter(cb => cb.id !== id))
    };

    const handleShare =async () =>
    {
        let lists = ''
        checkboxes.map((item, index) => 
        {
            lists = lists +'\n'+'☐    '+ item.label;
        })
        const msg = `${title}\n${lists}`
        const sharemsg = Share.share({message:msg})
    }

    const handleAddCheckbox_editModal = () =>
    {
        const trimmedInput = inputText.trim();

        if (trimmedInput.length === 0) {
        Alert.alert("Empty Input", "Please type something before pressing Enter.");
        return;
        }

        setNextId(nextId+1)

        const newCheckbox = {
        id: nextId,
        label: trimmedInput,
        isChecked: false,
        };

        setCheckboxes([...checkboxes, newCheckbox]); 
        setInputText('');
        
        setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleEdit =(id, tit, tas, adddate, remin, repeat_freq) =>
    {
        setIsEditModalVisible(true)
        setSelected_ID(id)
        setTitle(tit)
        setCheckboxes(tas)
        setAdded_Date(adddate)
        setReminder_Date(remin)
        setRepeat_Time(repeat_freq)
        if(tas.length===0)
        {
            setNextId(0)
        }
        else
        {
            const lastID =  tas.at(-1).id
            setNextId(lastID+1)
        }
        
    }

    const editTask =async() =>
    {
        if(title==='' && checkboxes.length === 0)
        {
            handleDelete();
            return 0;
        }
        let shouldScheduleNotification = false; 
        let dontsave = false;

        showTasks.map((item,index) =>
        {
            if(item._id === selected_id)
            {
                dontsave = false;
                if(title.trim() === '')
                {
                    console.log('sdj')
                    dontsave = true;
                    return 0;
                }
                item._title = title;
                item._tasks = checkboxes;
                item._repeat = repeat_time;
                if(selecteddate)
                {
                    item._reminder = format(selecteddate, "dd-MMM-yyyy hh:mm aa");
                    shouldScheduleNotification = true;
                }
                else if(reminder_date && reminder_date !== 'null')
                {
                    item._reminder = reminder_date;
                    shouldScheduleNotification = true;
                }
                else
                {
                    item._reminder = 'null';
                    cancelnoti(item._id);
                }
                 if(selecteddate)
                {
                    const dateObject = parse(item._reminder, "dd-MMM-yyyy hh:mm aa", new Date());
                    const hour24 = format(dateObject, "H");

                    onDisplayNotification(item._id, hour24, format(dateObject, "m"), format(dateObject, "d"), format(dateObject, "M"), format(dateObject, "yyyy"), item._title, item._repeat)
                    console.log(item._id, hour24, format(dateObject, "m"), format(dateObject, "d"), format(dateObject, "M"), format(dateObject, "yyyy"), item._title, item._repeat)
                }
            }
        })
        if(!dontsave)
        {
            setIsEditModalVisible(false);
        }
        else
        {
            Alert.alert('Memo', 'Title can not be empty!')
        }
        setSelectedDate(undefined); 

        await saveTasks(showTasks)
    }

    const gettxt = (tasksArray) =>
    {
        const itemsToShow = tasksArray.slice(0, 3);
        let labels = itemsToShow.map(task => task.label);

        return labels;
    };

    const handleOption =(id, pinned) =>
    {
        setIsOptionModalVisible(true)
        setSelected_ID(id);
        setSelected_ID_Pinned(pinned);
    }

    const handleDelete = async() =>
    {
        const afterDeleteTask = showTasks.filter(item => item._id !== selected_id)
        cancelnoti(selected_id)
        setIsOptionModalVisible(false)
        await saveTasks(afterDeleteTask)
    }

    const deleteall = async() =>
    {
        cancelallnoti();
        await AsyncStorage.removeItem(ASYNC_STORAGE_KEY)
    }

    const deleteAllData =async() =>
    {
        Alert.alert('Waring', 'It clears all Tasks.\nThis process cannot be reversed.', [{
            text:'Confirm',
            onPress:() => {deleteall(); cancelallnoti()},
            style:'destructive'
        },{
            text:'Cancel',
            onPress:null
        }
        ])		
    }

    const openWhatsApp = async (message = '') =>
    {
        const phoneNumber = '918438582007';
        if(feedback==='')
        {
            Alert.alert('Error', 'Enter the feedback')
            return 0;
        }
        const msg =encodeURIComponent(feedback)

        let whatsappURL = `https://wa.me/${phoneNumber}?text=${msg}`;
        try
        {
            setFeedback('')
            await Linking.openURL(whatsappURL);
        }
        catch (error)
        {
            console.error('Error opening WhatsApp:', error);
            Alert.alert('Error', 'An unexpected error occurred while trying to open WhatsApp.');
        }
    };

    const renderTasks =({ item, index }) =>
    {
        const taskLabels = gettxt(item?._tasks);
        return (            
            <View style={styles.listContainer}>
                <TouchableOpacity style={styles.listbtn} onLongPress={() => handleOption(item?._id, item?._ispinned)} onPress={() => handleEdit(item?._id, item?._title, item?._tasks, item?._addeddate, item?._reminder, item?._repeat)}>
                    <View style={{ flexDirection: 'row', marginHorizontal: 10, alignItems: 'center', justifyContent:'space-between' }}>
                        <Text style={styles.listheading}>{item?._title}</Text>
                        {item?._ispinned === 'Yes' && (
                            <Entypo name="pin" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                        )}
                    </View>
                    <Text style={styles.listdate}>{item?._addeddate}</Text>
                    <View style={styles.tasksSummaryContainer}>
                    {taskLabels.map((label, idx) => (
                        <Text key={idx} style={styles.listTaskLabel}>☐    {label}
                        </Text>
                    ))}
                </View>
                </TouchableOpacity>
            </View>
        )
    }

    const changeRepeatMode = () =>
    {
        if(repeat_time == 'Today')
        {
            setRepeat_Time("Daily");
        }
        else
        {
            setRepeat_Time("Today");
        }
    }

    const styles = StyleSheet.create({
        container:
        {
            flex:1,
            backgroundColor:isDark?'#252525':'#fff'
        },
        Searchbar:
        {
            backgroundColor:isDark?'#151515':'#E6E6E6',
            width:'93%',
            borderRadius:15,
            height:45,
            marginBottom:10,
        },
        TabTitle:
        {
            color:isDark?"#fff":'#000',
            fontSize:35,
            fontFamily:'impact',
            marginLeft:15,
            marginBottom:10
        },
        fab:
        {
            position: 'absolute',
            margin: 16,
            right:'5%',
            bottom:'2%',
            backgroundColor: isDark ? 'orange' : 'orange',
        },
        titleEntry:
        {
            color:isDark?'#fff':'#000',
            fontSize:25,
            marginLeft:7,
            fontFamily:'Anaheim-Bold',

        },
        dateText:
        {
            color:isDark?'gray':'#000',
            marginLeft:12,
            fontFamily:'Anaheim-SemiBold',
            fontSize:17,
        },
        tasksEntry:
        {
            marginTop:5,
            color:isDark?'#fff':'#000',
            fontFamily:'Anaheim-Regular',
            fontSize:19,
            marginLeft:7,
        },
        keyboardAvoidingContainer:
        {
            flex: 1,
        },
        scrollViewContent:
        {
            flexGrow: 1,
            paddingHorizontal: 15,
            paddingBottom: 50,
        },
        checkboxItem:
        {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark?"#151515":"#E6E6E6",
            paddingHorizontal:10,
            paddingVertical: 8,
            borderRadius: 10,
            marginTop: 10,
            height:'auto',
        },
        checkboxTouchable:
        {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        checkboxIcon:
        {
            fontSize: 22,
            marginRight: 15,
            color:isDark?'orange':'rgb(255, 123, 0)'
        },
        checkboxLabel:
        {
            fontSize: 18,
            fontFamily:'Anaheim-Regular',
            color: isDark?'#fff':'#000',
            flexShrink: 1,
        },
        checkedLabel:
        {
            textDecorationLine: 'line-through',
            color: isDark?'#787878':'#9B9B9B',
        },
        deleteButton:
        {
            marginLeft: 15,
            backgroundColor: isDark?'#151515':'#E6E6E6',
        },
        deleteButtonText:
        {
            color: '#ff3333',
            fontSize: 22,
            fontWeight: 'bold',
        },
        listContainer:
        {
            marginLeft:15
        },
        listbtn:
        {
            backgroundColor:isDark?"#151515":'#E6E6E6',
            minHeight:120,
            height:'auto',
            marginBottom:10,
            borderRadius:10,
            width:'95%'
        },
        listheading:
        {
            fontFamily:'Anaheim-Bold',
            fontSize:25,
            marginBottom:7,
            color:isDark?'#fff':'#000'
        },
        listdate:
        {
            fontFamily:'Anaheim-SemiBold',
            fontSize:17,
            marginLeft:10,
            marginBottom:7,
            color:isDark?'gray':'#858383'
        },
        listTaskLabel:
        {
            fontFamily:'Anaheim-SemiBold',
            fontSize:17,
            marginLeft:10,
            marginBottom: 7,
            color:isDark?'#fff':'#363636'
        },
        modalView:
        {
            margin: 0,
            backgroundColor: isDark?'#252525':'#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius:20,
            padding: 0,
            shadowColor: '#000',
            shadowOffset: {
            width: 0,
            height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            height:230,
            maxHeight: '75%',
            width: '99%',
        },
        centeredView:
        {
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'center',
            backgroundColor:'rgba(107, 107, 107, 0.4)'
        },
        ModalIcons:
        {
            marginLeft:10,
            color:isDark?'#C6C6C6':'#000'
        },
        subtitle:
        {
            marginLeft:17,
            color:isDark?"#C4BFBF":"fff", 
            fontFamily:'Anaheim-Bold',
            fontSize:18
        },
        settingsbtn:
        {
            backgroundColor: isDark?'#151515':'#E6E6E6',
            width:'100%',
            flexDirection:'row',
            justifyContent:'space-between',
            borderRadius:15,
        },
        settingtext:
        {
            marginTop:7,
            color:isDark?'#fff':'#000',
            fontFamily:'Anaheim-Bold',
            fontSize:20,
            marginLeft:15
        },
        feedbackentry:
        {
            color:icontheme,
            marginHorizontal:10,
            fontSize:20,
            fontFamily:'Anaheim-Regular'
        },
        toolbar:
        {
            backgroundColor:isDark?'#252525':'#fff',
            paddingVertical:'3%',
            borderTopWidth:1,
            borderTopColor:isDark?'#444':'#ccc',
            flexDirection:'row'
        },
        reminder_text_before:
        {
            color:isDark?"orange":'rgba(255, 161, 30, 1)',
            fontFamily:'Anaheim-SemiBold',
            fontSize:16
        },
        reminder_text_after:
        {
            color:isDark?"orange":'rgba(255, 161, 30, 1)',
            fontFamily:'Anaheim-SemiBold',
            fontSize:16,
            top:'10%'
        },
        reminder_icon_before:
        {
            marginLeft:'12%',
            marginRight:'3%',
            marginTop: '2%'
        },
        reminder_icon_after:
        {
            marginLeft:'6%',
            marginRight:'3%',
            marginTop: '2%'
        }
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={{alignItems:'flex-end', marginRight:15, marginTop:10}}>
                <TouchableOpacity onPress={() => setIsSettingsModalVisible(true)}>
                    <MaterialIcons name="settings" size={24} color={isDark?"#fff":'#000'} />
                </TouchableOpacity>
            </View>
            <Text style={styles.TabTitle} >Tasks</Text>
            <View style={{alignItems:'center'}}>
                <Searchbar
                placeholder='Search Tasks'
                placeholderTextColor={isDark?'#e6e6e6aa':'gray'}
                inputStyle={{marginTop:-7 , fontSize:17, fontFamily:'Anaheim-SemiBold', color:icontheme}}
                style={styles.Searchbar}
                onChangeText={setSearchQuery}
                value={searchQuery}
                iconColor={isDark?'gray':'#5B5B5B'}
                clearButtonMode='always' />
            </View>

            <FlatList 
            style={{paddingBottom:570,}}
            data={showTasks}
            renderItem={renderTasks}
            ListEmptyComponent={() => (
                        <View style={{flex:1, alignItems:'center', marginTop:250}}>
                            <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily:'Anaheim-Bold' }}>
                                {searchQuery ? 'No matching results' : "Press '+' to add tasks"}
                            </Text>
                        </View>
                    )} />

            <FAB icon={'plus'} style={styles.fab} color='#fff' onPress={() => {setIsAddModalVisible(true); setAdded_Date(format(new Date(), 'dd-MMM-yyyy     hh:mm aa'))}} />
        
        {/* Add MODAL */}
        <Modal visible={isaddmodalvisible}
        onRequestClose={() => {
            setIsAddModalVisible(false);
            addTasks();
        }}
        animationType='slide' >
        
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => {
                        setIsAddModalVisible(false);
                        addTasks();
                    }}>
                    <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView style={styles.keyboardAvoidingContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <ScrollView contentContainerStyle={styles.scrollViewContent}
                        ref={scrollViewRef}
                        keyboardShouldPersistTaps="always">
                    <TextInput placeholder='Title'
                        maxLength={30}
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
                        onDelete={() => deleteCheckbox(checkbox.id)}
                    />
                    ))}
                        
                    <TextInput
                        style={styles.tasksEntry}
                        placeholder="Add new item here..."
                        placeholderTextColor={'gray'}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleAddCheckbox}
                        returnKeyType="done"
                        blurOnSubmit={false}
                        />
        
                    </ScrollView>
                    <View style={styles.toolbar}>
                        {selecteddate ? 
                            <View style={{flexDirection:'row', justifyContent: 'space-between', flex:1}}>
                                <TouchableOpacity onPress={() => setIsDatePickModalVisible(true)} style={{flexDirection:'row'}}>                            
                                    <Ionicons name="alarm" size={20} color={isDark?"orange":'orange'} style={styles.reminder_icon_after} />
                                    <Text style={styles.reminder_text_after}> Reminder: {format(selecteddate, "dd-MMM-yyyy hh:mm aa")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{marginRight:'6%'}} onPress={() => setSelectedDate()} >
                                    <MaterialIcons name="cancel" size={20} color="#ff3333" />
                                </TouchableOpacity>
                            </View>
                            :
                            <TouchableOpacity onPress={() => setIsDatePickModalVisible(true)} style={{flexDirection:'row'}}>                            
                                <Ionicons name="alarm" size={20} color={isDark?"orange":'orange'} style={styles.reminder_icon_before} />
                                <Text style={styles.reminder_text_before}> Reminder</Text>
                            </TouchableOpacity>
                        }
                    </View>          
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>

        {/* EDIT MODAL */}
        <Modal visible={iseditmodalvisible}
        onRequestClose={() => {
            editTask();
        }}
        animationType='fade' >
        
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => {
                        editTask();
                    }}>
                    <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView style={styles.keyboardAvoidingContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <ScrollView contentContainerStyle={styles.scrollViewContent}
                        ref={scrollViewRef}
                        keyboardShouldPersistTaps="always">
                    <TextInput placeholder='Title'
                        maxLength={30}
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
                        onDelete={() => deleteCheckbox(checkbox.id)}
                    />
                    ))}
                        
                    <TextInput
                        style={styles.tasksEntry}
                        placeholder="Add new item here..."
                        placeholderTextColor={'gray'}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleAddCheckbox_editModal}
                        returnKeyType="done"
                        blurOnSubmit={false}
                        />		
                    </ScrollView>
                    <View style={styles.toolbar}>
                        {reminder_date !== 'null' ? 
                            <View style={{flexDirection:'row', justifyContent: 'space-between', flex:1}}>
                                <TouchableOpacity onPress={() => setIsDatePickModalVisible(true)} style={{flexDirection:'row'}}>                            
                                    <Ionicons name="alarm" size={20} color={isDark?"orange":'orange'} style={styles.reminder_icon_after} />
                                    <Text style={styles.reminder_text_after}> Reminder: {reminder_date}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{marginRight:'6%'}} onPress={() => {setSelectedDate(); setReminder_Date('null')}} >
                                    <Entypo name="squared-cross" size={20} color="#ff3333" style={{marginTop:4}} />
                                </TouchableOpacity>
                            </View>
                            :
                            <TouchableOpacity onPress={() => setIsDatePickModalVisible(true)} style={{flexDirection:'row'}}>                            
                                <Ionicons name="alarm" size={20} color={isDark?"orange":'orange'} style={styles.reminder_icon_before} />
                                <Text style={styles.reminder_text_before}> Reminder</Text>
                            </TouchableOpacity>
                        }
                    </View>             
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>

         {/* OPTION MODAL */}
        <Modal style={{maxHeight:'50%'}}
        animationType='slide'
        transparent={true}
        visible={isoptionmodalvisible}
        onRequestClose={()=> {
            setIsOptionModalVisible(false)
        }}>
            <View style={styles.centeredView}>
                <TouchableOpacity style={{flex:1, paddingHorizontal:1454}} onPress={()=>setIsOptionModalVisible(false)}>
                </TouchableOpacity>
            <View style={styles.modalView}>
                <View style={{flexDirection:'row'}}>
                    <FontAwesome6 style={{margin:13}} name="arrow-left" size={20} color={icontheme} onPress={()=> setIsOptionModalVisible(false) } />
                </View>
                <Divider />
                <View style={styles.Modalbtn}>
                    <TouchableOpacity onPress={handlePin} style={{flexDirection:'row', marginTop: 20, width:175}}>
                        <Entypo style={[styles.ModalIcons, {marginTop:3}]} name="pin" size={20}  />
                        <Text style={{marginLeft:10, fontSize:18, fontFamily:'Anaheim-SemiBold', color:icontheme, marginTop:'-2.5%'}}>Pin/Unpin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={{flexDirection:'row', marginTop: 20, width:175}}>
                        <MaterialIcons style={styles.ModalIcons} name="delete" size={22} />
                        <Text style={{marginLeft:10, fontSize:18, fontFamily:'Anaheim-SemiBold', color:icontheme, marginTop:'-2.5%'}}>Delete</Text>
                    </TouchableOpacity>
                </View>
                
                
            </View>
        </View>
        </Modal>

        {/* SETTINGS MODAL */}
        <Modal visible={issettingsmodalvisible}
        onRequestClose={() => {
            setIsSettingsModalVisible(false);
            setTitle('');
            setCheckboxes([])
        }}
        animationType='slide' >
        
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
                        <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <View>
                    <Text style={styles.TabTitle}>MEMO</Text>
                </View>
                <View>
                    <Text style={styles.subtitle}>Delete</Text>
                    <View style={{alignItems:'center'}}>
                        <View style={{backgroundColor:isDark?'#151515':'#E6E6E6', alignItems:'center', marginTop:10, borderRadius:15, width:'90%'}}>
                            <TouchableOpacity onPress={deleteAllData} style={[styles.settingsbtn, {paddingBottom:13}]}>
                                <Text style={styles.settingtext}>All Tasks</Text>
                                <Entypo name="chevron-right" size={18} color={isDark?'gray':'#858383'} style={{marginTop:16, marginRight:15}} />
                            </TouchableOpacity>
                            {/*<TouchableOpacity onPress={deleteAllData} style={[styles.settingsbtn,{paddingBottom:10}]}>
                                <Text style={styles.settingtext}>All Data</Text>
                                <Entypo name="chevron-right" size={18} color={isDark?'gray':'#858383'} style={{marginTop:16, marginRight:15}} />
                            </TouchableOpacity>*/}
                        </View>
                    </View>
                </View>

                <View>
                    <Text style={[styles.subtitle, {marginTop:15}]}>Opinion</Text>
                    <View style={{alignItems:'center'}}>
                        <View style={{backgroundColor:isDark?'#151515':'#E6E6E6', alignItems:'center', marginTop:10, borderRadius:15, width:'90%'}}>
                            <TouchableOpacity onPress={()=>setIsFeedbackModalVisible(true)} style={{paddingBottom:13,
                            backgroundColor: isDark?'#151515':'#E6E6E6',
                            width:'100%',
                            flexDirection:'row',
                            borderRadius:15}}>
                                <MaterialIcons name="feedback" size={23} color={isDark?'gray':'#858383'} style={{marginTop:13, marginLeft:10}} />
                                <Text style={styles.settingtext}>Feedback</Text>
                                <Entypo name="chevron-right" size={18} color={isDark?'gray':'#858383'} style={{marginTop:16, marginRight:15, left:'53%'}} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>

        {/* SETTINGS MODAL */}
        <Modal visible={isfeedbackmodalvisible}
        onRequestClose={() => {
            setIsFeedbackModalVisible(false);
            setFeedback('')
        }}
        animationType='slide' >
        
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff',}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => {setIsFeedbackModalVisible(false); setFeedback('')}}>
                        <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <View>
                    <Text style={styles.TabTitle}>Feedback</Text>
                </View>
                <View style={{backgroundColor:isDark?'#151515':'#E6E6E6', width:'92%', left:15, marginTop:10, borderRadius:15, height:225}}>
                    <TextInput placeholder='Enter'
                    placeholderTextColor={'gray'}
                    style={styles.feedbackentry}
                    multiline
                    maxLength={250}
                    value={feedback}
                    onChangeText={setFeedback} />
                </View>
                <View style={{alignItems:'center'}}>
                    <View style={{backgroundColor:isDark?'#151515':'#E6E6E6', alignItems:'center', marginTop:15, borderRadius:15, width:'92%'}}>
                        <TouchableOpacity onPress={openWhatsApp} style={{paddingBottom:10,
                        backgroundColor: isDark?'#151515':'#E6E6E6',
                        width:'100%',
                        flexDirection:'row',
                        justifyContent:"center",
                        borderRadius:15}}>
                            <Ionicons name="send" size={22} color="orange" style={{marginTop:13}} />
                            <Text style={styles.settingtext}>Send Feedback</Text>
                        </TouchableOpacity>
                    </View>   
                </View>
            </SafeAreaView>
        </Modal>

        {/* Date Picker */}
        <Modal
            animationType='fade'
            transparent
            style={{backgroundColor:'green'}}
            visible={isdatepickmodalvisible}
            onRequestClose={() => setIsDatePickModalVisible(false)}
        >
            <View style={{justifyContent:'center', backgroundColor:'rgba(150,150,150,0.2)', flex:1}}>
                <View style={{backgroundColor:isDark?'#252525':'#fff', borderRadius:10, width:'92%', marginLeft:'4%'}}>
                    <DateTimePicker
                        mode='single'
                        timePicker
                        use12Hours
                        minDate={todaycur}
                        date={selecteddate}
                        onChange={({date}) => {
                            setSelectedDate(date);
                            const new_date = format(date, "dd-MMM-yyyy hh:mm aa");
                            setReminder_Date(new_date)
                        }}
                        styles={{...defaultStyles,
                            today: { borderColor: 'orange', borderWidth: 1 },
                            selected: { backgroundColor: 'orange' },
                            selected_label: { color: 'white' },
                        }} />
                </View>
                {/*<View style={{backgroundColor:isDark?'#252525':'#fff', borderRadius:10, width:'92%', marginLeft:'4%', marginVertical:'2%', paddingVertical:'3%'}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                        <Text style={styles.subtitle}>Repeat</Text>
                        <TouchableOpacity style={{marginRight:'4%'}} onPress={changeRepeatMode}>
                            <Text style={{color:isDark?"#C4BFBF":"fff", fontFamily:'Anaheim-Bold',fontSize:16}}>
                                {repeat_time}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:'5%'}}>
                        <Text style={[styles.subtitle, {marginTop:'3%', fontSize:18}]}>Label</Text>
                            <TextInput
                                maxLength={30}
                                placeholderTextColor={'gray'}
                                placeholder='No Label'
                                value={label}
                                onChangeText={setLabel}
                                style={{color:isDark?"#C4BFBF":"fff", fontFamily:'Anaheim-Bold',fontSize:15}}>
                            </TextInput>
                    </View>
                </View>*/}
            </View>
        </Modal>
    </SafeAreaView>
  )
}

export default Tasks
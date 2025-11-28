import { FlatList, Linking, StyleSheet, Text, useColorScheme, View, Modal, TextInput, Share, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAB, Divider, Searchbar } from 'react-native-paper';
import { format } from 'date-fns';

// Vector Icon Imports
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';

export default function Notes() {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark?'#fff':'000';
    const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Notes'

    const [added_date, setAdded_Date] = useState()
    const [title, setTitle] = useState('')
    const [notes, setNotes] = useState('')
    const [allNotes, setAllNotes] = useState([])
    const [showNotes, setShowNotes] = useState([])
    const [searchQuery, setSearchQuery] = useState('');
    const [selected_id, setSelected_ID] = useState(0)
    const [selected_id_pinned, setSelected_ID_Pinned] = useState('');
    const [feedback, setFeedback] = useState('')

    const[isaddmodalvisible, setIsAddModalVisible] = useState(false)
    const[iseditmodalvisible, setIsEditModalVisible] = useState(false)
    const[isoptionmodalvisible, setIsOptionModalVisible] = useState(false)
    const[issettingsmodalvisible, setIsSettingsModalVisible] = useState(false)
    const[isfeedbackmodalvisible, setIsFeedbackModalVisible] = useState(false)

    const scrollViewRef = useRef(null);
    const notesInputRef = useRef(null);

    useEffect(() => {
        getNotes();
    },[isaddmodalvisible, iseditmodalvisible, isoptionmodalvisible, issettingsmodalvisible])

    // This useEffect will now handle both filtering and pinning logic
useEffect(() => {
    // 1. Start with a copy of allNotes to avoid direct mutation
    let currentNotes = [...allNotes];

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
    const pinnedNotes = currentNotes.filter(note => note._ispinned === 'Yes');
    const unpinnedNotes = currentNotes.filter(note => note._ispinned !== 'Yes');

    // 4. Combine Pinned first, then Unpinned
    const sortedAndFilteredNotes = [...pinnedNotes, ...unpinnedNotes];

    // 5. Update the state that FlatList renders
    setShowNotes(sortedAndFilteredNotes);
}, [allNotes, searchQuery]); // Re-run this effect when allNotes or searchQuery changes

    const loadNotes = async() =>
    {
        try
        {
            const storedNotes = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)
            if(storedNotes !== null)
            {
                const notes = JSON.parse(storedNotes)
                return notes
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

    const getNotes = async() =>
    {
        const curNotes = await loadNotes();

        if(curNotes.length === 0)
        {
            setAllNotes([])
            setShowNotes([])
            return 0;
        }
        else
        {
            setAllNotes(curNotes)
            setShowNotes(curNotes)
            curNotes.forEach((item, index) => {
                {/*console.log(item?._title)*/}
            });
        }
    }

    const saveNotes = async(noti) =>
    {
        try
        {
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(noti))
        }
        catch(e)
        {
            console.log(e)
        }
    }

    const addNotes = async() =>
    {
        if(notes.trim()==='')
        {
            if(notes.trim()==='')
            {
                return 0;
            }
            Alert.alert("Memo", "Enter Title and notes")
            setIsAddModalVisible(true);
            return 0;
        }

        const curNotes = await loadNotes();

        const newNotes = {
            _id:Date.now().toString(),
            _title:title,
            _notes:notes,
            _addeddate:added_date,
            _ispinned:'No'
        }

        const updateNotes = [newNotes, ...curNotes]
        await saveNotes(updateNotes)
        setAllNotes(updateNotes)
        
        setTitle('');
        setNotes('');
    }

    const handleShare = () =>
    {
        const msg = `${title}\n${notes}`
        const handlesharemsg = Share.share({message:msg})
    }
    
    const handlePin = async () => {
    if (selected_id === 0) {
        console.warn("No note selected for pinning.");
        return;
    }

    // Find the note that was selected for options
    const selectedNote = allNotes.find(item => item._id === selected_id);
    if (!selectedNote) {
        console.warn("Selected note not found.");
        setIsOptionModalVisible(false);
        return;
    }

    // Create a NEW array with the updated note (IMMUTABILITY!)
    const updatedAllNotes = allNotes.map(item => {
        if (item._id === selected_id) {
            return {
                ...item, // Copy all existing properties
                _ispinned: item._ispinned === 'No' ? 'Yes' : 'No' // Toggle pin status
            };
        }
        return item; // Return unchanged items as they are
    });

    // 1. Save the updated master list to AsyncStorage
    await saveNotes(updatedAllNotes);

    // 2. Update the component's state (allNotes).
    // This is crucial. When `allNotes` changes, the `useEffect` will re-run
    // and automatically re-filter and re-sort `showNotes`.
    setAllNotes(updatedAllNotes);

    // Close the options modal after handling the pin action
    setIsOptionModalVisible(false);
};

    const gettxt =(note) =>
    {
        if(note.includes('\n') || note.includes('\r'))
        {
            const dum = note.split(/[\r\n]+/)
            if(dum[0].length>44)
            {
                return dum[0].slice(0,44)+'...'
            }
            else
            {
                return dum[0]+'...'
            }
        }
        else
        {
            if(note.length>44)
            {
                return note
                //return note.slice(0,44)+'...'
            }
            else
            {
                return note
            }
        }
    } 
    
    const handleEdit =(id, tit, not, adddate) =>
    {
        setIsEditModalVisible(true)
        setSelected_ID(id)
        setTitle(tit)
        setNotes(not)
        setAdded_Date(adddate)
    }

    const editNotes =async() =>
    {
        if(title.trim()==='' && notes.trim()==='')
        {
            handleDelete();
            return 0;
        }

        let dontsave = false;
        
        showNotes.map((item, index) => 
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
                item._notes = notes;
            }
        });
        if(!dontsave)
        {
            setIsEditModalVisible(false);
        }
        else
        {
            Alert.alert('Memo', 'Title can not be empty!')
        }
        await saveNotes(showNotes)
    }

    const handleAddNotes =() =>
    {
        setIsAddModalVisible(false);
        addNotes();
    }

    const handleOption =(id, pinned) =>
    {
        setIsOptionModalVisible(true)
        setSelected_ID(id);
        setSelected_ID_Pinned(pinned);
    }

    const handleDelete = async() =>
    {
        const afterDeleteNotes = showNotes.filter(item => item._id !== selected_id)
        setIsOptionModalVisible(false)
        await saveNotes(afterDeleteNotes)
    }

    const deleteall = async() =>
    {
        await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
    }

    const deleteAllData_notes =async() =>
    {
        Alert.alert('Waring', 'It clears all Notes.\nThis process cannot be reversed.', [{
            text:'Confirm',
            onPress:() => deleteall(),
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
        const email = 'nmanoj0212@gmail.com';
        if(feedback==='')
        {
            Alert.alert('Error', 'Enter the feedback')
            return 0;
        }
        const msg =encodeURIComponent(feedback)
        let url = `mailto:${email}?subject=${encodeURIComponent('Feedback for app MEMO')}&body=${encodeURIComponent(msg)}`

        //let whatsappURL = `https://wa.me/${phoneNumber}?text=${msg}`;
        try
        {
            setFeedback('')
            await Linking.openURL(url);
            //await Linking.openURL(whatsappURL);
        }
        catch (error)
        {
            console.error('Error opening WhatsApp:', error);
            Alert.alert('Error', 'An unexpected error occurred while trying to open WhatsApp.');
        }
    };

    const renderNotes =({item, index}) =>
    {
        return (
        <View style={styles.listcontainer}>
            <TouchableOpacity style={styles.listbtn} onLongPress={() => handleOption(item?._id, item?._ispinned)} onPress={() => handleEdit(item?._id, item?._title, item?._notes, item?._addeddate)}>
                <View style={{ flexDirection: 'row', marginHorizontal: 10, alignItems: 'center', justifyContent:'space-between' }}>
                    <Text style={styles.listheading}>{item?._title}</Text>
                    {item?._ispinned === 'Yes' && (
                        <Entypo name="pin" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                    )}
                </View>
                <Text style={styles.listdate}>{item?._addeddate}</Text>
                <Text style={styles.listnote} numberOfLines={3}>{gettxt(item?._notes)}</Text>
            </TouchableOpacity>
        </View>
    );
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
        TabTitile:
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
            fontSize:17
        },
        notesEntry:
        {
            marginTop:10,
            color:isDark?'#fff':'#000',
            fontFamily:'Anaheim-Regular',
            fontSize:20,
            marginLeft:7
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
        listcontainer:
        {
            marginLeft:15,
        },
        listbtn:
        {
            backgroundColor:isDark?"#151515":'#E6E6E6',
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
        listnote:
        {
            fontFamily:'Anaheim-SemiBold',
            fontSize:17,
            marginLeft:10,
            marginBottom:'5%',
            color:isDark?'#fff':'#000'
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
            fontFamily:'Anaheim-SemiBold',
            fontSize:20,
            marginLeft:15,
        },
        TabTitle:
        {
            color:isDark?"#fff":'#000',
            fontSize:35,
            fontFamily:'impact',
            marginLeft:15,
            marginBottom:10
        },
        feedbackentry:
        {
            color:icontheme,
            marginHorizontal:10,
            fontSize:20,
            fontFamily:'Anaheim-SemiBold'
        },
        })

  return (
    <SafeAreaView style={styles.container}>
        <View style={{alignItems:'flex-end', marginRight:15, marginTop:10}}>
            <TouchableOpacity onPress={() => setIsSettingsModalVisible(true)}>
                <MaterialIcons name="settings" size={24} color={isDark?"#fff":'#000'} />
            </TouchableOpacity>
        </View>
        <Text style={styles.TabTitile} >Notes</Text>
        <View style={{alignItems:'center'}}>
            <Searchbar
            placeholder='Search Notes'
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
            data={showNotes}
            renderItem={renderNotes}
            ListEmptyComponent={() => (
                        <View style={{flex:1, alignItems:'center', marginTop:250}}>
                            <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily:'Anaheim-Bold' }}>
                                {searchQuery ? 'No matching results' : "Press '+' to add notes"}
                            </Text>
                        </View>
                    )} />

        <FAB icon={'plus'} style={styles.fab} color='#fff' onPress={() => {setIsAddModalVisible(true); setAdded_Date(format(new Date(), 'dd-MMM-yyyy     hh:mm aa'))}} />

        {/* ADD MODAL */}
        <Modal visible={isaddmodalvisible}
        onRequestClose={handleAddNotes}
        animationType='slide' >

            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={handleAddNotes}>
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
                
                    <TextInput placeholder='Start typing...'
                    value={notes}
                    onChangeText={setNotes}
                    placeholderTextColor={'gray'}
                    cursorColor={'gray'}
                    style={styles.notesEntry}
                    multiline />

                    </ScrollView>                
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>

        {/* EDIT MODAL */}
        <Modal animationType='fade'
        visible={iseditmodalvisible}
        onRequestClose={() =>{
            editNotes();
        }}>
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => {
                                editNotes();
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
                
                    <TextInput placeholder='Start typing...'
                    value={notes}
                    onChangeText={setNotes}
                    placeholderTextColor={'gray'}
                    cursorColor={'gray'}
                    style={styles.notesEntry}
                    multiline />

                    </ScrollView>                
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
                            <TouchableOpacity onPress={deleteAllData_notes} style={[styles.settingsbtn, {paddingBottom:13}]}>
                                <Text style={styles.settingtext}>All Notes</Text>
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
                            <TouchableOpacity onPress={() => setIsFeedbackModalVisible(true)} style={{paddingBottom:13,
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

        {/* FEEDBACK MODAL */}
        <Modal visible={isfeedbackmodalvisible}
        onRequestClose={() => {
            setIsFeedbackModalVisible(false);
        }}
        animationType='slide' >
        
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff',}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => setIsFeedbackModalVisible(false)}>
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
                            <Ionicons name="send" size={22} color="orange" style={{marginTop:13, marginLeft:10}} />
                            <Text style={styles.settingtext}>Send Feedback</Text>
                        </TouchableOpacity>
                    </View>   
                </View>
            </SafeAreaView>
        </Modal>
        
    </SafeAreaView>
  )
}
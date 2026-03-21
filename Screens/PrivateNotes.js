import 'react-native-get-random-values';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
  Modal,
  Share,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Platform
} from "react-native";
import { format, } from 'date-fns';
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FAB, TextInput, Searchbar, Divider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { useNavigation } from "@react-navigation/native";

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const STORAGE_KEY = "PRIVATE_NOTES";
const SECRET_KEY = "SAFE_MEMO_PAGE";

export default function PrivateNotes() {

    const isDark = useColorScheme() === "dark";
    const icontheme = isDark ? "#fff" : "#000";

    const navi = useNavigation();

    const [title,setTitle] = useState("");
    const [notes,setNotes] = useState("");
    const [added_date, setAdded_Date] = useState()
    
    const [allNotes,setAllNotes] = useState([]);
    const [search,setSearch] = useState("");

    const [isaddmodalvisible, setIsAddModalVisible] = useState(false);
    const [isoptionmodalvisible, setIsOptionModalVisible] = useState(false);
    const [iseditmodalvisible, setIsEditModalVisible] = useState(false);
    const [selected_id, setSelected_ID] = useState(0);
    const [selected_id_pinned, setSelected_ID_Pinned] = useState('');

    const scrollViewRef = useRef(null);
    

    // -------------------------
    // ENCRYPT
    // -------------------------

    const encrypt = (data) => {
        return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    };

    const decrypt = (cipher) => {
        try{
        const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
        }catch{
        return [];
        }
    };

    // -------------------------
    // LOAD NOTES
    // -------------------------

    const loadNotes = async () => {

        const data = await AsyncStorage.getItem(STORAGE_KEY);

        if(data){
            const decrypted = decrypt(data);
            setAllNotes(sortNotes(decrypted));
        }
    };

    useEffect(()=>{
        loadNotes();
    },[]);

    // -------------------------
    // SAVE NOTES
    // -------------------------

    const saveNotes = async (notesData) => {

        const encrypted = encrypt(notesData);

        await AsyncStorage.setItem(STORAGE_KEY, encrypted);

    };

    // -------------------------
    // ADD NOTE
    // -------------------------

    const addNote = async () => {

        if(title.trim()==="" && notes.trim()===""){
        setIsAddModalVisible(false);
        return;
        }

        const newNote = {
        id: Date.now().toString(),
        title,
        notes,
        added_date: added_date,
        ispinned: 'No',
        };

        const updated = sortNotes([newNote,...allNotes]);

        setAllNotes(updated);

        await saveNotes(updated);

        setTitle("");
        setNotes("");

        setIsAddModalVisible(false);
    };

    const handleOption = (id, pinned) => {
        setIsOptionModalVisible(true)
        setSelected_ID(id);
        setSelected_ID_Pinned(pinned);
    }

    const sortNotes = (notes) => {
        return notes.sort((a, b) => {

            // pinned first
            if (a.ispinned === 'Yes' && b.ispinned !== 'Yes') return -1;
            if (a.ispinned !== 'Yes' && b.ispinned === 'Yes') return 1;

            // then by newest timestamp
            return Number(b.id) - Number(a.id);
        });
    };

    const handlePin = async () => {

        const updatedNotes = allNotes.map(item => {
            if (item.id === selected_id) {
            return {
                ...item,
                ispinned: item.ispinned === 'Yes' ? 'No' : 'Yes'
            };
            }
            return item;
        });

        const sorted = sortNotes(updatedNotes);

        setAllNotes(sorted);
        await saveNotes(sorted);

        setIsOptionModalVisible(false);
    };

    const handleDelete = async () => {
        const afterDeleteNotes = allNotes.filter(item => item.id !== selected_id)
        setAllNotes(afterDeleteNotes);
        await saveNotes(afterDeleteNotes)
        setIsOptionModalVisible(false)
    }

    const handleEdit = (id, tit, not, adddate,) => {
        setIsEditModalVisible(true)
        setSelected_ID(id)
        setTitle(tit)
        setNotes(not)
        setAdded_Date(adddate)
    }

    // -------------------------
    // UI RENDER
    // -------------------------

    const renderNotes = ({ item, index }) => {
        console.log(item)
        return (
            <View style={styles.listcontainer}>
                <TouchableOpacity style={styles.listbtn} onPress={() => handleEdit(item?.id, item?.title, item?.notes, item?.added_date)} onLongPress={() => handleOption(item?.id, item?.ispinned)}  >
                    <View style={{ flexDirection: 'row', marginHorizontal: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.listheading}>{item?.title}</Text>
                        {item?.ispinned === 'Yes' && (
                            <Entypo name="pin" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                        )}
                    </View>
                    <Text style={styles.listdate}>{item?.added_date}</Text>
                    <Text style={styles.listnote} numberOfLines={3}>{gettxt(item?.notes)}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleAddNotes = () => {
        setIsAddModalVisible(false);
        addNote();
    }

    const handleShare = () => {
        const msg = `${title}\n${notes}`
        const handlesharemsg = Share.share({ message: msg })
    }

    const gettxt = (note) => {
        if (note.includes('\n') || note.includes('\r')) {
            const dum = note.split(/[\r\n]+/)
            if (dum[0].length > 44) {
                return dum[0].slice(0, 44) + '...'
            }
            else {
                return dum[0] + '...'
            }
        }
        else {
            if (note.length > 44) {
                return note
                //return note.slice(0,44)+'...'
            }
            else {
                return note
            }
        }
    }

    const editNotes = async () => {
        const updatedNotes = allNotes.map(item => {

            if (item.id === selected_id) {
                return {
                    ...item,
                    title: title,
                    notes: notes,
                    added_date: added_date
                };
            }

            return item;
        });

        const sorted = sortNotes(updatedNotes);

        setAllNotes(sorted);

        await saveNotes(sorted);

        setIsEditModalVisible(false);

        setTitle("");
        setNotes("");
    };

    const styles = StyleSheet.create({
            container:
            {
                flex: 1,
                backgroundColor: isDark ? '#252525' : '#fff'
            },
            Searchbar:
            {
                backgroundColor: isDark ? '#151515' : '#E6E6E6',
                width: '93%',
                borderRadius: 15,
                height: 45,
                marginBottom: 10,
            },
            TabTitile:
            {
                color: isDark ? "#fff" : '#000',
                fontSize: 35,
                fontFamily: 'impact',
                marginLeft: 15,
                marginBottom: 10
            },
            fab:
            {
                position: 'absolute',
                margin: 16,
                right: '5%',
                bottom: '5%',
                backgroundColor: isDark ? 'orange' : 'orange',
            },
            titleEntry:
            {
                color: isDark ? '#fff' : '#000',
                fontSize: 25,
                fontFamily: 'Anaheim-Bold',
                backgroundColor: isDark ? '#252525' : '#fff',
            },
            dateText:
            {
                color: isDark ? 'gray' : '#000',
                marginLeft: 12,
                fontFamily: 'Anaheim-Regular',
                fontSize: 17
            },
            notesEntry:
            {
                color: isDark ? '#fff' : '#000',
                fontFamily: 'Anaheim-Regular',
                height: '100%'
            },
            keyboardAvoidingContainer:
            {
                flex: 1,
            },
            scrollViewContent:
            {
                flexGrow: 1,
                paddingHorizontal: 0,
                paddingBottom: 75,
            },
            listcontainer:
            {
                alignItems: 'center',
            },
            listbtn:
            {
                backgroundColor: isDark ? "#151515" : '#E6E6E6',
                // height:'auto',
                marginBottom: 10,
                borderRadius: 10,
                width: '95%'
            },
            listheading:
            {
                fontFamily: 'Anaheim-Bold',
                fontSize: 25,
                marginBottom: 7,
                color: isDark ? '#fff' : '#000'
            },
            listdate:
            {
                fontFamily: 'Anaheim-SemiBold',
                fontSize: 17,
                marginLeft: 10,
                marginBottom: 7,
                color: isDark ? 'gray' : '#858383'
            },
            listnote:
            {
                fontFamily: 'Anaheim-SemiBold',
                fontSize: 17,
                marginLeft: 10,
                marginBottom: '5%',
                color: isDark ? '#fff' : '#000'
            },
            modalView:
            {
                margin: 0,
                backgroundColor: isDark ? '#252525' : '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 0,
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
                height: 230,
                maxHeight: '75%',
                width: '99%',
            },
            centeredView:
            {
                flex: 1,
                justifyContent: 'flex-end',
                alignItems: 'center',
                backgroundColor: 'rgba(107, 107, 107, 0.4)'
            },
            ModalIcons:
            {
                marginLeft: 10,
                color: isDark ? '#C6C6C6' : '#000'
            },
    
            subtitle:
            {
                marginLeft: 17,
                color: isDark ? "#C4BFBF" : "fff",
                fontFamily: 'Anaheim-Bold',
                fontSize: 18
            },
            settingsbtn:
            {
                backgroundColor: isDark ? '#151515' : '#E6E6E6',
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderRadius: 15,
            },
            settingtext:
            {
                marginTop: 7,
                color: isDark ? '#fff' : '#000',
                fontFamily: 'Anaheim-SemiBold',
                fontSize: 20,
                marginLeft: 15,
            },
            TabTitle:
            {
                color: isDark ? "#fff" : '#000',
                fontSize: 35,
                fontFamily: 'impact',
                marginLeft: 15,
                marginBottom: 10
            },
            feedbackentry:
            {
                marginHorizontal: 15,
                minHeight: 255,
                backgroundColor: '#252525',
            },
        });

    return (

        <SafeAreaView style={styles.container}>

        <View style={{padding:12}}>
            <TouchableOpacity onPress={()=>navi.goBack()}>
            <Feather name="arrow-left" size={24} color={icontheme}/>
            </TouchableOpacity>
        </View>

        <Text style={styles.TabTitle}>SAFE</Text>

        <View style={{ alignItems: 'center' }}>
                <Searchbar
                    placeholder='Search Notes'
                    placeholderTextColor={isDark ? '#e6e6e6aa' : 'gray'}
                    inputStyle={{ marginTop: -7, fontSize: 17, fontFamily: 'Anaheim-SemiBold', color: icontheme }}
                    style={styles.Searchbar}
                    onChangeText={setSearch}
                    value={search}
                    iconColor={isDark ? 'gray' : '#5B5B5B'}
                    clearButtonMode='always' />
            </View>

            <FlatList
                data={allNotes.filter(n =>
                n.title.toLowerCase().includes(search.toLowerCase())
                )}
                showsVerticalScrollIndicator={false}
                renderItem={renderNotes}
                keyExtractor={(item)=>item.id}
                keyboardDismissMode='on-drag'
                ListEmptyComponent={() => (
                    <View style={{ flex: 1, alignItems: 'center', marginTop: '65%' }}>
                        <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold' }}>
                            {search ? 'No matching results' : "Press '+' to add notes"}
                        </Text>
                    </View>
                )}
            />

            <FAB icon={'plus'} style={styles.fab} rippleColor={'#ffc123'} color='#fff' onPress={() => { setIsAddModalVisible(true); setAdded_Date(format(new Date(), 'dd-MMM-yyyy     hh:mm aa')) }} />
        

        {/* <FAB
            icon="plus"
            style={styles.fab}
            color="#fff"
            onPress={()=>setIsAddModalVisible(true)}
        /> */}

        {/* ADD MODAL */}
        <Modal visible={isaddmodalvisible}
            onRequestClose={handleAddNotes}
            animationType='slide' >
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#fff' }}>
                <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={handleAddNotes}>
                        <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView style={styles.keyboardAvoidingContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView contentContainerStyle={styles.scrollViewContent}
                        ref={scrollViewRef}
                        keyboardShouldPersistTaps='always'
                        decelerationRate="fast"
                        removeClippedSubviews={true}>
        
                        <TextInput
                            placeholder={"Title"}
                            placeholderTextColor={'gray'}
                            selectionColor='#ffb52cc5'
                            selectionHandleColor={'#ffb52cc5'}
                            underlineColor={isDark ? '#252525' : "#fff"}
                            activeUnderlineColor={isDark ? '#252525' : "#fff"}
                            value={title}
                            onChangeText={(text) => setTitle(text)}
                            cursorColor={isDark ? "#abababff" : "#252525"}
                            style={styles.titleEntry}
                            contentStyle={{ fontSize: 25, backgroundColor: isDark ? '#252525' : '#fff', fontFamily: 'Anaheim-SemiBold', color:isDark?"#fff":"#000" }} />
        
                        <Text style={styles.dateText}>{added_date}</Text>
        
                        <TextInput
                            placeholder={"Start Typing..."}
                            placeholderTextColor={'gray'}
                            selectionColor='#ffb52cc5'
                            selectionHandleColor={'#ffb52cc5'}
                            underlineColor={isDark ? '#252525' : "#fff"}
                            activeUnderlineColor={isDark ? '#252525' : "#fff"}
                            value={notes}
                            onChangeText={(text) => setNotes(text)}
                            cursorColor={isDark ? "#abababff" : "#252525"}
                            multiline
                            style={styles.notesEntry}
                            contentStyle={{ fontSize: 18, backgroundColor: isDark ? '#252525' : '#fff', fontFamily: 'Anaheim-SemiBold', marginLeft: -8,  color:isDark?"#fff":"#000"}} />
        
                        </ScrollView>
                        {/* <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}>
                            <TouchableOpacity style={{marginLeft:'5%'}} onPress={() => setIsPaintModalVisible(true)}>
                            <FontAwesome5 name="paint-brush" size={20} color={'orange'} style={{marginBottom:'3%', marginLeft:'5%'}} />
                        </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: '5%' }} onPress={handleImageSelection}>
                                <FontAwesome name="picture-o" size={20} color={'orange'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: '5%' }} onPress={handleCameraImageSelection}>
                                <FontAwesome name="camera" size={20} color="orange" />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: '5%' }} onPress={toggleListening}>
                                <FontAwesome name={isListening ? 'microphone' : 'microphone-slash'} size={20} color={isListening ? 'orange' : '#ff3333'} />
                            </TouchableOpacity>
                        </View> */}
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* EDIT MODAL */}
            <Modal animationType='fade'
                visible={iseditmodalvisible}
                onRequestClose={() => {
                    editNotes();
                }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#fff' }}>
                    <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
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
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <ScrollView contentContainerStyle={styles.scrollViewContent}
                            ref={scrollViewRef}
                            keyboardShouldPersistTaps="always">
                            <TextInput
                                placeholder={"Title"}
                                placeholderTextColor={'gray'}
                                selectionColor='#ffb52cc5'
                                selectionHandleColor={'#ffb52cc5'}
                                underlineColor={isDark ? '#252525' : "#fff"}
                                activeUnderlineColor={isDark ? '#252525' : "#fff"}
                                value={title}
                                onChangeText={(text) => setTitle(text)}
                                cursorColor={isDark ? "#abababff" : "#252525"}
                                style={styles.titleEntry}
                                contentStyle={{ fontSize: 25, backgroundColor: isDark ? '#252525' : '#fff', fontFamily: 'Anaheim-SemiBold', color:isDark?"#fff":"#000" }} />

                            <Text style={styles.dateText}>{added_date}</Text>

                            <TextInput
                                placeholder={"Start Typing..."}
                                placeholderTextColor={'gray'}
                                selectionColor='#ffb52cc5'
                                selectionHandleColor={'#ffb52cc5'}
                                underlineColor={isDark ? '#252525' : "#fff"}
                                activeUnderlineColor={isDark ? '#252525' : "#fff"}
                                value={notes}
                                onChangeText={(text) => setNotes(text)}
                                cursorColor={isDark ? "#abababff" : "#252525"}
                                multiline
                                style={styles.notesEntry}
                                contentStyle={{ fontSize: 18, backgroundColor: isDark ? '#252525' : '#fff', fontFamily: 'Anaheim-SemiBold', marginLeft: -8,  color:isDark?"#fff":"#000" }} />

                        </ScrollView>
                        {/* <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}>
                            <TouchableOpacity style={{marginLeft:'5%'}} onPress={() => setIsPaintModalVisible(true)}>
                            <FontAwesome5 name="paint-brush" size={20} color={'orange'} style={{marginBottom:'3%', marginLeft:'5%'}} />
                        </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: '5%' }} onPress={handleImageSelection}>
                                <FontAwesome name="picture-o" size={20} color={'orange'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: '5%' }} onPress={handleCameraImageSelection}>
                                <FontAwesome name="camera" size={20} color="orange" />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ marginLeft: '5%' }} onPress={toggleListening}>
                                <FontAwesome name={isListening ? 'microphone' : 'microphone-slash'} size={20} color={isListening ? 'orange' : '#ff3333'} />
                            </TouchableOpacity>
                        </View> */}
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* OPTION MODAL */}
            <Modal style={{ maxHeight: '50%' }}
                animationType='slide'
                transparent={true}
                visible={isoptionmodalvisible}
                onRequestClose={() => {
                    setIsOptionModalVisible(false)
                }}>
                <View style={styles.centeredView}>
                    <TouchableOpacity style={{ flex: 1, paddingHorizontal: 1454 }} onPress={() => setIsOptionModalVisible(false)}>
                    </TouchableOpacity>
                    <View style={styles.modalView}>
                        <View style={{ flexDirection: 'row' }}>
                            <FontAwesome6 style={{ margin: 13 }} name="arrow-left" size={20} color={icontheme} onPress={() => setIsOptionModalVisible(false)} />
                        </View>
                        <Divider />
                        <View style={styles.Modalbtn}>
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
}
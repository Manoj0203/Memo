import {
    FlatList, StyleSheet, Text, useColorScheme, View, Modal,
    Share, TouchableOpacity, Alert,
} from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAB, Divider, Searchbar, Snackbar } from 'react-native-paper';
import { format } from 'date-fns';
import RNFS from 'react-native-fs';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Vector Icon Imports
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

export default function Notes() {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';
    const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Notes';

    const navi = useNavigation();

    const [allNotes, setAllNotes] = useState([]);
    const [showNotes, setShowNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selected_id, setSelected_ID] = useState(0);
    const [selected_id_pinned, setSelected_ID_Pinned] = useState('');
    const [selectedImageUri, setSelectedImageUri] = useState(null);

    const [isoptionmodalvisible, setIsOptionModalVisible] = useState(false);
    const [Snack, setSnack] = useState(false);

    // Reload notes whenever screen comes into focus (after returning from AddNotesScreen)
    useFocusEffect(
        useCallback(() => {
            getNotes();
        }, [])
    );

    useEffect(() => {
        enableBiometrics();
    }, []);

    useEffect(() => {
        let currentNotes = [...allNotes];

        if (searchQuery.trim()) {
            currentNotes = currentNotes.filter(note => {
                const lowercasedQuery = searchQuery.toLowerCase();
                return note._title?.toLowerCase().includes(lowercasedQuery);
            });
        }

        const pinnedNotes = currentNotes.filter(note => note._ispinned === 'Yes');
        const unpinnedNotes = currentNotes.filter(note => note._ispinned !== 'Yes');
        setShowNotes([...pinnedNotes, ...unpinnedNotes]);
    }, [allNotes, searchQuery]);

    const enableBiometrics = () => {
        const rnBiometrics = new ReactNativeBiometrics();
        rnBiometrics.isSensorAvailable()
            .then(({ available, biometryType }) => {
                if (!available && biometryType === BiometryTypes.Biometrics) {
                    Alert.alert('Device biometric', 'This device does not support biometrics.');
                }
            })
            .catch(error => {
                console.log('Error', error);
            });
    };

    const loadNotes = async () => {
        try {
            const storedNotes = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
            if (storedNotes !== null) return JSON.parse(storedNotes);
            return [];
        } catch (e) {
            console.log(e);
            return [];
        }
    };

    const getNotes = async () => {
        const curNotes = await loadNotes();
        if (curNotes.length === 0) {
            setAllNotes([]);
            setShowNotes([]);
        } else {
            setAllNotes(curNotes);
            setShowNotes(curNotes);
        }
    };

    const saveNotes = async (noti) => {
        try {
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(noti));
        } catch (e) {
            console.log(e);
        }
    };

    const handlePin = async () => {
        if (selected_id === 0) return;

        const updatedAllNotes = allNotes.map(item => {
            if (item._id === selected_id) {
                return { ...item, _ispinned: item._ispinned === 'No' ? 'Yes' : 'No' };
            }
            return item;
        });

        await saveNotes(updatedAllNotes);
        setAllNotes(updatedAllNotes);
        setIsOptionModalVisible(false);
    };

    const handleDelete = async () => {
        const afterDeleteNotes = showNotes.filter(item => item._id !== selected_id);
        if (selectedImageUri) {
            try {
                await RNFS.unlink(selectedImageUri);
            } catch (error) {
                console.log('Image delete error:', error);
            }
        }
        setIsOptionModalVisible(false);
        setAllNotes(afterDeleteNotes);
        await saveNotes(afterDeleteNotes);
    };

    const handleOption = (id, pinned, imageuri) => {
        setIsOptionModalVisible(true);
        setSelected_ID(id);
        setSelected_ID_Pinned(pinned);
        setSelectedImageUri(imageuri);
    };

    const gettxt = (note) => {
        if (!note) return '';
        if (note.includes('\n') || note.includes('\r')) {
            const dum = note.split(/[\r\n]+/);
            return dum[0].length > 44 ? dum[0].slice(0, 44) + '...' : dum[0] + '...';
        }
        return note.length > 44 ? note : note;
    };

    const handleBiometric = async () => {
        try {
            const rnBiometrics = new ReactNativeBiometrics();
            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: 'Authenticate to access safe'
            });
            if (success) {
                navi.navigate('PrivateNotes');
            } else {
                Alert.alert('Verification failed', 'Biometric Verification unsuccessful');
            }
        } catch (error) {
            Alert.alert('Error', 'Biometric authentication failed from the device');
        }
    };

    const renderNotes = ({ item }) => {
        return (
            <View style={styles.listcontainer}>
                <TouchableOpacity
                    style={styles.listbtn}
                    onLongPress={() => handleOption(item?._id, item?._ispinned, item?._imageuri)}
                    onPress={() => navi.navigate('AddNotes', {
                        mode: 'edit',
                        noteId: item?._id,
                        noteTitle: item?._title,
                        noteContent: item?._notes,
                        noteDate: item?._addeddate,
                        noteImageUri: item?._imageuri,
                        noteImageHeight: item?._imageheight,
                        noteImageWidth: item?._imagewidth,
                    })}>
                    <View style={{ flexDirection: 'row', marginHorizontal: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.listheading}>{item?._title}</Text>
                        {item?._ispinned === 'Yes' && (
                            <Entypo name="pin" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', marginRight: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.listdate}>{item?._addeddate}</Text>
                        {item?._imageuri !== null && (
                            <FontAwesome name="picture-o" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                        )}
                    </View>
                    <Text style={styles.listnote} numberOfLines={3}>{gettxt(item?._notes)}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? '#252525' : '#fff'
        },
        Searchbar: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '93%',
            borderRadius: 15,
            height: 45,
            marginBottom: 10,
        },
        TabTitile: {
            color: isDark ? '#fff' : '#000',
            fontSize: 35,
            fontFamily: 'impact',
            marginLeft: 15,
            marginBottom: 10
        },
        fab: {
            position: 'absolute',
            margin: 16,
            right: '5%',
            bottom: '0%',
            backgroundColor: 'orange',
        },
        listcontainer: {
            alignItems: 'center',
        },
        listbtn: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            marginBottom: 10,
            borderRadius: 10,
            width: '95%'
        },
        listheading: {
            fontFamily: 'Anaheim-Bold',
            fontSize: 25,
            marginBottom: 7,
            color: isDark ? '#fff' : '#000'
        },
        listdate: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 17,
            marginLeft: 10,
            marginBottom: 7,
            color: isDark ? 'gray' : '#858383'
        },
        listnote: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 17,
            marginLeft: 10,
            marginBottom: '5%',
            color: isDark ? '#fff' : '#000'
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
            backgroundColor: 'rgba(107, 107, 107, 0.4)'
        },
        ModalIcons: {
            marginLeft: 10,
            color: isDark ? '#C6C6C6' : '#000'
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ justifyContent: 'flex-end', marginRight: 15, marginTop: 10, flexDirection: 'row', gap: 15 }}>
                <TouchableOpacity onPress={handleBiometric}>
                    <FontAwesome name="lock" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navi.navigate('Settings')}>
                    <MaterialIcons name="settings" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
            </View>
            <Text style={styles.TabTitile}>Notes</Text>
            <View style={{ alignItems: 'center' }}>
                <Searchbar
                    placeholder='Search Notes'
                    placeholderTextColor={isDark ? '#e6e6e6aa' : 'gray'}
                    inputStyle={{ marginTop: -7, fontSize: 17, fontFamily: 'Anaheim-SemiBold', color: icontheme }}
                    style={styles.Searchbar}
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    iconColor={isDark ? 'gray' : '#5B5B5B'}
                    clearButtonMode='always' />
            </View>

            <FlatList
                data={showNotes}
                showsVerticalScrollIndicator={false}
                renderItem={renderNotes}
                keyboardDismissMode='on-drag'
                ListEmptyComponent={() => (
                    <View style={{ flex: 1, alignItems: 'center', marginTop: '65%' }}>
                        <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold' }}>
                            {searchQuery ? 'No matching results' : "Press '+' to add notes"}
                        </Text>
                    </View>
                )} />

            <FAB
                icon={'plus'}
                style={styles.fab}
                rippleColor={'#ffc123'}
                color='#fff'
                onPress={() => navi.navigate('AddNotes', {
                    mode: 'add',
                    curDate: format(new Date(), 'dd-MMM-yyyy     hh:mm aa')
                })} />

            <Snackbar
                visible={Snack}
                duration={1500}
                onDismiss={() => setSnack(false)}
                style={{ borderRadius: 15, bottom: '0%' }}>
                Notes Added
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
}

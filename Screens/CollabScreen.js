import {
    FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity,
    useColorScheme, View, Image
} from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { onAuthStateChanged } from '@firebase/auth';
import { FAB, Divider, Snackbar } from 'react-native-paper';
import {
    arrayRemove,
    collection, deleteDoc, doc,
    getCountFromServer, getDoc, getDocs, increment, orderBy, query,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

import { auth, db } from '../services/firebaseAuth';
import Alerts from '../components/Alerts';
import { useTheme } from '../utils/Theme';

// Vector Icon Imports
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const ASYNC_KEY_NOTES = 'ASYNC_STORAGE_KEY_NOTES_Collab';
const ASYNC_KEY_PINS = 'ASYNC_STORAGE_KEY_NOTES_Collab_Pins';

const CollabScreen = () => {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';
    const { BUTTON } = useTheme();

    const [refreshing, setRefreshing] = useState(false);
    const [collabnotes, setCollabNotes] = useState([]);
    const [pinnedIds, setPinnedIds] = useState(new Set());
    const [collaborators, setCollaborators] = useState([]);

    const [managecollaborator, setManageCollaborator] = useState(false)
    const [infovisible, setInfoVisible] = useState(false);
    const [isoptionmodalvisible, setIsOptionModalVisible] = useState(false);
    const [selectedid, setSelectedId] = useState('');
    const [ownerid, setOwnerId] = useState('');
    const [count, setCount] = useState(0);

    const [cannotdelete, setCannotDelete] = useState(false);
    const [noselfremove, setNoSelfRemove] = useState(false);
    const [notowner, setNotOwner] = useState(false);

    const [user, setUser] = useState(null);
    const navi = useNavigation();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currUser) => {
            setUser(currUser ?? null);
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!user) return;
        const fetchCount = async () => {
            try {
                const ref = collection(db, 'users', user.uid, 'collabrequestreceived');
                const snap = await getCountFromServer(ref);
                setCount(snap.data().count);
            } catch (e) {
                console.log('count error', e);
            }
        };
        fetchCount();
    }, [user]);

    const loadPins = async () => {
        try {
            const stored = await AsyncStorage.getItem(ASYNC_KEY_PINS);
            setPinnedIds(stored ? new Set(JSON.parse(stored)) : new Set());
        } catch (e) {
            console.log('loadPins error', e);
        }
    };

    const savePins = async (updated) => {
        try {
            await AsyncStorage.setItem(ASYNC_KEY_PINS, JSON.stringify([...updated]));
        } catch (e) {
            console.log('savePins error', e);
        }
    };

    const loadFromStorage = async () => {
        try {
            const stored = await AsyncStorage.getItem(ASYNC_KEY_NOTES);
            setCollabNotes(stored ? JSON.parse(stored) : []);
        } catch (e) {
            console.log('loadFromStorage error', e);
            setCollabNotes([]);
        }
    };

    useEffect(() => {
        if (!user) return;
        loadFromStorage();
        loadPins();
    }, [user]);

    // ─── Fetch from Firestore ────────────────────────────────────────────────
    /**
     * Core fetch — used by both pull-to-refresh and useFocusEffect.
     * Pins are kept separate in AsyncStorage and are NOT cleared on refresh.
     */
    const fetchAndStore = useCallback(async () => {
        if (!user) return;
        try {
            const q = query(collection(db, 'notes'), orderBy('sortDate', 'asc'));
            const snapshot = await getDocs(q);

            const fresh = [];
            snapshot.docs.forEach((item) => {
                const data = item.data();
                if (data.collaborator?.includes(user.uid)) {
                    fresh.push({
                        noteId: item.id,
                        title: data.title,
                        notes: data.notes,
                        curDate: data.curDate,
                    });
                }
            });

            await AsyncStorage.setItem(ASYNC_KEY_NOTES, JSON.stringify(fresh));
            setCollabNotes(fresh);
        } catch (e) {
            console.log('fetchAndStore error', e);
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAndStore();
        setRefreshing(false);
    }, [fetchAndStore]);

    useFocusEffect(
        useCallback(() => {
            if (user) fetchAndStore();
        }, [user, fetchAndStore])
    );

    const handleTogglePin = async () => {
        const updated = new Set(pinnedIds);
        if (updated.has(selectedid)) {
            updated.delete(selectedid);
        } else {
            updated.add(selectedid);
        }
        setPinnedIds(updated);
        await savePins(updated);
        setIsOptionModalVisible(false);
    };

    const sortedNotes = [...collabnotes].sort((a, b) => {
        const aPinned = pinnedIds.has(a.noteId) ? 0 : 1;
        const bPinned = pinnedIds.has(b.noteId) ? 0 : 1;
        return aPinned - bPinned;
    });

    const handleDeleteCollabNotes = async () => {
        try {
            const notesRef = doc(db, 'notes', selectedid);
            const snapshot = await getDoc(notesRef);
            if (user.uid === snapshot?.data()?.ownerID) {
                await deleteDoc(notesRef);
                // Also remove pin entry if it exists
                const updated = new Set(pinnedIds);
                updated.delete(selectedid);
                setPinnedIds(updated);
                await savePins(updated);
                await fetchAndStore();
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    totalcollab: increment(-1),
                });
                setIsOptionModalVisible(false);
            } else {
                setCannotDelete(true);
                setIsOptionModalVisible(false);
            }
        } catch (e) {
            console.log('delete error', e);
        }
    };

    const handleOptionMenu = (id) => {
        setSelectedId(id);
        setIsOptionModalVisible(true);
    };

    const gettxt = (note) => {
        if (!note) return '';
        if (note.includes('\n') || note.includes('\r')) {
            const lines = note.split(/[\r\n]+/);
            const first = lines[0];
            return first.length > 44 ? first.slice(0, 44) + '...' : first + '...';
        }
        return note.length > 44 ? note.slice(0, 44) + '...' : note;
    };

    const renderCollabNotes = ({ item }) => {
        const isPinned = pinnedIds.has(item.noteId);
        return (
            <View style={styles.listcontainer}>
                <TouchableOpacity
                    onLongPress={() => handleOptionMenu(item.noteId)}
                    onPress={() =>
                        navi.navigate('AddCollabScreen', {
                            mode: 'edit',
                            curDate: item.curDate,
                            noteId: item.noteId,
                            noteTitle: item.title,
                            noteContent: item.notes,
                            noteDate: format(new Date(), 'dd-MMM-yyyy     hh:mm aa'),
                            openedDate: Date.now(),
                        })
                    }
                    style={styles.listbtn}>

                    {/* Pin indicator */}
                    {isPinned && (
                        <View style={styles.pinBadge}>
                            <Entypo name="pin" size={13} color="#000" />
                        </View>
                    )}

                    <View style={{ marginHorizontal: 10, alignItems: 'flex-start' }}>
                        <Text numberOfLines={1} style={styles.listheading}>{item.title}</Text>
                        <Text style={styles.listdate}>{item.curDate}</Text>
                        <Text style={styles.listnote} numberOfLines={3}>
                            {gettxt(item.notes)}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCollaborators = ({ item, index }) => {
        return (
            <View style={styles.collaboratorcontainer}>
                {/* Avatar */}
                <Image
                    source={{ uri: item.pic }}
                    style={styles.collaboratorAvatar} />

                {/* Text block */}
                <View style={styles.collaboratorTextBlock}>
                    <Text numberOfLines={1} style={styles.collaboratorusername}>
                        {item.username}
                        {<Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontFamily: 'Anaheim-Regular', fontSize: 14 }}>
                            {user.uid == item.id ? ' (You)' : null}</Text>
                        }
                        {
                            <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontFamily: 'Anaheim-Regular', fontSize: 14 }}>
                                {ownerid == item.id ? ' (Owner)' : null}</Text>
                        }
                    </Text>
                    <Text numberOfLines={1} style={styles.collaboratorFullname}> {item.fullname} </Text>
                </View>

                {/* Actions */}
                <View style={styles.collaboratorActions}>
                    <TouchableOpacity
                        onPress={() => handleRemoveCollaborator(item.id)}>
                        <Ionicons name="person-remove-sharp" size={20} color="#e03333" />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    const handleRemoveCollaborator = async (id) => {
        if (user.uid !== ownerid) {
            setNotOwner(true);
            return;
        }

        if (id === ownerid) {
            setNoSelfRemove(true);
            return;
        }

        const batch = writeBatch(db);
        const notesRef = doc(db, 'notes', selectedid);
        const afterDeleteUser = collaborators.filter(item => item.id !== id);
        setCollaborators(afterDeleteUser);
        batch.update(notesRef, {
            collaborator: arrayRemove(id)
        })
        batch.update(doc(db, 'users', id), {
            totalcollab: increment(-1),
        });
        batch.commit();
    };

    const handleOpenManageCollaborators = async () => {
        const notesRef = doc(db, 'notes', selectedid);
        const snapshot = await getDoc(notesRef);

        const collaboratorIds = snapshot.data().collaborator;

        const lst = await Promise.all(
            collaboratorIds.map(async (id) => {
                const userRef = doc(db, 'users', id);
                const usersnapshot = (await getDoc(userRef)).data();
                return {
                    id: usersnapshot.uid,
                    fullname: usersnapshot.fullname,
                    username: usersnapshot.username,
                    pic: usersnapshot.image,
                };
            })
        );

        setOwnerId(snapshot.data().ownerID);
        setCollaborators(lst);
        setManageCollaborator(true);
        setIsOptionModalVisible(false);
    };

    const styles = StyleSheet.create({
        container: {
            backgroundColor: isDark ? '#252525' : '#fff',
            flex: 1,
        },
        TabTitile: {
            color: isDark ? '#fff' : '#000',
            fontSize: 35,
            fontFamily: 'impact',
            marginLeft: 15,
            marginBottom: 10,
        },
        section: {
            alignItems: 'center',
            marginTop: '0%',
        },
        sectionCard: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            alignItems: 'center',
            borderRadius: 15,
            width: '95%',
            overflow: 'hidden',
        },
        rowBtn: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderRadius: 15,
            paddingBottom: 13,
            alignItems: 'center',
        },
        settingtext: {
            marginTop: 7,
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-Regular',
            fontSize: 20,
            marginLeft: 15,
        },
        fab: {
            position: 'absolute',
            margin: 16,
            right: '2%',
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
            marginBottom: 7,
            color: isDark ? 'gray' : '#858383',
        },
        listnote: {
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 17,
            marginBottom: '5%',
            color: isDark ? '#fff' : '#000',
        },
        pinBadge: {
            position: 'absolute',
            top: 8,
            right: 10,
            backgroundColor: 'orange',
            borderRadius: 6,
            padding: 3,
            zIndex: 1,
        },
        ModalIcons: {
            marginLeft: 10,
            color: isDark ? '#C6C6C6' : '#000',
        },
        collaboratorcontainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#1e1e1e' : '#fff',
            borderRadius: 12,
            margin: '1.5%',
            marginBottom: 5,
            padding: 7,
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0 : 0.07,
            shadowRadius: 4,
            elevation: 2,
        },
        collaboratorAvatar: {
            width: 48,
            height: 48,
            borderRadius: 10,
            marginRight: 10,
        },
        collaboratorTextBlock: {
            flex: 1,
            justifyContent: 'center',
            marginRight: 8,
        },
        collaboratorusername: {
            color: isDark ? '#fff' : '#111',
            fontFamily: 'Anaheim-Bold',
            fontSize: 16,
            marginBottom: 2,
        },
        collaboratorFullname: {
            color: isDark ? '#aaa' : '#666',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 14,
        },
        collaboratorActions: {
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
        },
    });

    const isSelectedPinned = pinnedIds.has(selectedid);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={{ justifyContent: 'flex-end', marginRight: '4%', marginTop: '2.5%', flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setInfoVisible(true)}>
                    <Ionicons name="information-circle-sharp" size={24} color={icontheme} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navi.navigate('Settings')}>
                    <MaterialIcons name="settings" size={24} color={icontheme} />
                </TouchableOpacity>
            </View>
            <Text style={styles.TabTitile}>Collab</Text>

            {user ? (
                <>
                    {/* Collab Request Row */}
                    <View style={styles.section}>
                        <View style={styles.sectionCard}>
                            <TouchableOpacity
                                onPress={() => navi.navigate('Settings')}
                                style={[styles.rowBtn, { alignItems: 'center', alignSelf: 'center' }]}>
                                <Text style={styles.settingtext}>Collab Request</Text>
                                <View style={{
                                    backgroundColor: 'orange',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '6%',
                                    right: 10,
                                    borderRadius: 7,
                                    top: '20%',
                                }}>
                                    <Text style={{ color: '#000', fontFamily: 'Anaheim-Bold', }}>{count}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#ccc', width: '95%', top: '1.2%', alignSelf: 'center' }} />

                    {/* Notes list */}
                    <View style={{ height: '80%', marginTop: '5%' }}>
                        <FlatList
                            data={sortedNotes}
                            showsVerticalScrollIndicator={false}
                            renderItem={renderCollabNotes}
                            keyExtractor={(item) => item.noteId}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                            ListEmptyComponent={() => (
                                <View style={{ flex: 1, alignItems: 'center', marginTop: '65%' }}>
                                    <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold' }}>
                                        Press '+' to add collab
                                    </Text>
                                </View>
                            )}
                        />
                    </View>

                    {collabnotes.length < 3 && (
                        <FAB
                            icon={'plus'}
                            style={styles.fab}
                            rippleColor={'#ffc123'}
                            color='#fff'
                            onPress={() =>
                                navi.navigate('AddCollabScreen', {
                                    mode: 'add',
                                    curDate: format(new Date(), 'dd-MMM-yyyy     hh:mm aa'),
                                })
                            }
                        />
                    )}
                </>
            ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold' }}>
                        Login to add Collab!
                    </Text>
                    <TouchableOpacity
                        style={[BUTTON.subbtn, { borderColor: 'orange', width: '25%', marginTop: '4%', paddingVertical: 7 }]}
                        onPress={() => navi.navigate('Login')}>
                        <Text style={BUTTON.subbtntxt}>Login</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Option Modal */}
            <Modal
                animationIn={'slideInUp'}
                isVisible={isoptionmodalvisible}
                hasBackdrop={true}
                onDismiss={() => setIsOptionModalVisible(false)}
                onBackButtonPress={() => setIsOptionModalVisible(false)}
                onBackdropPress={() => setIsOptionModalVisible(false)}
                style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{
                    width: '105%',
                    backgroundColor: isDark ? '#252525' : '#fff',
                    borderTopLeftRadius: 15,
                    borderTopRightRadius: 15,
                    marginBottom: '-5%',
                    maxHeight: '75%',
                    paddingBottom: '2%',
                }}>
                    <View style={{ marginBottom: '2%' }}>
                        <View style={{ flexDirection: 'row' }}>
                            <FontAwesome6
                                style={{ margin: 13 }}
                                name="arrow-left"
                                size={20}
                                color={icontheme}
                                onPress={() => setIsOptionModalVisible(false)}
                            />
                        </View>
                        <Divider />
                        <View style={{ flexWrap: 'wrap', paddingHorizontal: 10 }}>{/* Users */}
                            <TouchableOpacity
                                onPress={handleOpenManageCollaborators}
                                style={{ flexDirection: 'row', marginTop: 20, alignItems: 'center' }}>
                                <FontAwesome style={styles.ModalIcons} name="users" size={21} />
                                <Text style={{ marginLeft: 10, fontSize: 18, fontFamily: 'Anaheim-SemiBold', color: icontheme, marginTop: '-2.5%' }}>
                                    Manage Collaborators
                                </Text>
                            </TouchableOpacity>

                            {/* Pin / Unpin */}
                            <TouchableOpacity
                                onPress={handleTogglePin}
                                style={{ flexDirection: 'row', marginTop: 20, width: 175 }}>
                                <Entypo
                                    style={[styles.ModalIcons, { marginTop: 3, color: isDark ? '#C6C6C6' : '#000' }]}
                                    name="pin"
                                    size={20}
                                />
                                <Text style={{ marginLeft: 10, fontSize: 18, fontFamily: 'Anaheim-SemiBold', color: icontheme, marginTop: '-2.5%' }}>
                                    {isSelectedPinned ? 'Unpin' : 'Pin'}
                                </Text>
                            </TouchableOpacity>

                            {/* Delete */}
                            <TouchableOpacity
                                onPress={handleDeleteCollabNotes}
                                style={{ flexDirection: 'row', marginTop: 20, width: 175 }}>
                                <MaterialIcons style={styles.ModalIcons} name="delete" size={22} />
                                <Text style={{ marginLeft: 10, fontSize: 18, fontFamily: 'Anaheim-SemiBold', color: icontheme, marginTop: '-2.5%' }}>
                                    Delete
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Manage Collaborators Modal */}
            <Modal
                animationIn={'slideInUp'}
                isVisible={managecollaborator}
                hasBackdrop={true}
                onDismiss={() => setManageCollaborator(false)}
                onBackButtonPress={() => setManageCollaborator(false)}
                onBackdropPress={() => setManageCollaborator(false)}
                style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{
                    width: '105%',
                    backgroundColor: isDark ? '#252525' : '#fff',
                    borderTopLeftRadius: 15,
                    borderTopRightRadius: 15,
                    marginBottom: '-5%',
                    flex: 1,
                    maxHeight: '85%',
                    paddingBottom: '2%',
                }}>
                    <View style={{ marginBottom: '2%' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome6 style={{ margin: 13 }} name="arrow-left" size={20} color={icontheme} onPress={() => setManageCollaborator(false)} />
                            <Text style={{ color: isDark ? '#fff' : '#000', fontFamily: 'Anaheim-SemiBold', fontSize: 18 }}>Collaborators</Text>
                        </View>
                        <FlatList
                            data={collaborators}
                            renderItem={renderCollaborators}
                            style={{}} />
                        <Divider />
                    </View>

                    {/* You are not owner */}
                    <Snackbar
                        visible={notowner}
                        duration={1500}
                        sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                        onDismiss={() => setNotOwner(false)}
                        style={{ borderRadius: 15, bottom: '0%', }}>
                        Only the owner can remove collaborators!
                    </Snackbar>

                    {/* No self remove */}
                    <Snackbar
                        visible={noselfremove}
                        duration={1500}
                        sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                        onDismiss={() => setNoSelfRemove(false)}
                        style={{ borderRadius: 15, bottom: '0%' }}>
                        You cannot remove yourself
                    </Snackbar>
                </View>
            </Modal>

            {/* Info Alert */}
            <Alerts
                visible={infovisible}
                title='Info'
                titleAlign='center'
                body={'This feature allows you to edit notes as a team without sharing.\nSign up to use this feature.\nYou can add up to 3 collab notes.\n\nPull down to refresh↻'}
                borderRadius={12}
                onCancel={() => setInfoVisible(false)}
                type='info'
                alertText='Continue'
                alertColor={'orange'}
                alertTextColor={''}
                onAlert={() => setInfoVisible(false)}
            />

            <Snackbar
                visible={cannotdelete}
                duration={1500}
                sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                onDismiss={() => setCannotDelete(false)}
                style={{ borderRadius: 15, bottom: '0%', }}>
                Only the owner can delete collab notes!
            </Snackbar>
        </SafeAreaView>
    );
};

export default CollabScreen;
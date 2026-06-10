import {
    StyleSheet, Text, View, TouchableOpacity, useColorScheme, ScrollView,
    FlatList, RefreshControl, Image
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { cancelallnoti } from '../utils/notificationhandler';
import Alerts from '../components/Alerts';
import { Snackbar } from 'react-native-paper';

import { arrayUnion, collection, deleteField, doc, getDoc, getDocs, increment, query, arrayRemove, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../services/firebaseAuth';
import { deleteUser, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential } from '@firebase/auth';

// Vector Icon Imports
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const NOTES_KEY = 'ASYNC_STORAGE_KEY_NOTES_Notes';
const TASKS_KEY = 'ASYNC_STORAGE_KEY_NOTES_Tasks';
const REQUEST_KEY = 'ASYNC_STORAGE_KEY_NOTES_Request';
const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Collab';


const SettingsScreen = () => {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';
    const navi = useNavigation();

    const [curruser, setCurrUser] = useState(null);
    const [deleteuseralert, setDeleteUserAlert] = useState(false);

    const [request, setRequest] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Snackbar
    const [cantaccept, setCantAccept] = useState(false);
    const [incorrectpasswd, setIncorrectPasswd] = useState(false);
    const [loginagain, setLoginAgain] = useState(false);

    useEffect(() => {
        const unsubscribed = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrUser(user)
            } else {
                setCurrUser(null);
                console.log('No user logged in');
            }
        });
        return unsubscribed;
    }, []);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const storedRequest = await AsyncStorage.getItem(REQUEST_KEY);

                if (storedRequest !== null) {
                    setRequest(JSON.parse(storedRequest));
                } else {
                    setRequest([]);
                }
            } catch (e) {
                console.log(e);
                setRequest([]);
            }
        };

        curruser ? fetchRequest() : null
    }, [curruser]);

    const saveRequest = async (noti) => {
        await AsyncStorage.setItem(REQUEST_KEY, JSON.stringify(noti));
    }

    const loadRequest = async () => {
        try {
            const storedRequest = await AsyncStorage.getItem(REQUEST_KEY);
            if (storedRequest !== null) return JSON.parse(storedRequest);
            return [];
        } catch (e) {
            console.log(e);
            return [];
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        if (!curruser) return null;
        setTimeout(async () => {
            const docRef = collection(db, 'users', curruser.uid, 'collabrequestreceived');
            const snapshot = await getDocs(docRef);

            const dumreq = snapshot.docs.map((data) => ({
                doc: data.data().id,
                fullname: data.data().fullname,
                pic: data.data().pic,
                username: data.data().username,
                notereqs: data.data().notereqs,
                sentto: data.data().sentto,
            }));
            setRequest(dumreq);
            await saveRequest(dumreq)

            setRefreshing(false)
        }, 2000)
    })

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

    const sleep = (ms) =>
        new Promise(resolve => setTimeout(resolve, ms));

    const handleSignOut = async () => {
        await sleep(1500);
        await signOut(auth);
        await AsyncStorage.removeItem(REQUEST_KEY);
        await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
        setRequest([])
        console.log('logged out')
    }

    const handleDeleteAccount = async () => {
        setDeleteUserAlert(true);
    }
    const deleteuser = async (password) => {
        try {
            if (!password?.trim()) {
                console.log('Password required');
                return;
            }

            const user = auth.currentUser;

            if (!user || !user.email) {
                console.log('No authenticated user');
                return;
            }

            //Delete id that contains notes Remove user from all notes they're a collaborator in
            const notesQuery = query(collection(db, 'notes'), where('collaborator', 'array-contains', user.uid));
            const notesSnapshot = await getDocs(notesQuery);

            const batch = writeBatch(db);
            notesSnapshot.docs.forEach((noteDoc) => {
                batch.update(noteDoc.ref, {
                    collaborator: arrayRemove(user.uid)
                });
            });

            // Then delete user doc
            batch.delete(doc(db, 'users', user.uid))

            await batch.commit();

            // Reauthenticate
            const credential = EmailAuthProvider.credential(
                user.email,
                password
            );

            await reauthenticateWithCredential(user, credential);

            await AsyncStorage.removeItem(REQUEST_KEY);
            await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);

            // Delete Firebase Auth account
            await deleteUser(user);

            console.log('Account deleted successfully');
        } catch (error) {
            console.log(error);

            switch (error.code) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setIncorrectPasswd(true)
                    break;

                case 'auth/requires-recent-login':
                    setLoginAgain(true)
                    break;

                default:
                    console.log(error.message);
            }
        }
    };

    const handleDeleteRequest = async (senderID, noteID) => {
        const receivedRef = doc(db, 'users', curruser.uid, 'collabrequestreceived', senderID);
        const sentRef = doc(db, 'users', senderID, 'collabrequestsent', curruser.uid);

        const batch = writeBatch(db);

        // Check if this sender has other pending note requests
        const senderEntry = request.find(item => item.doc === senderID);
        const remainingNotes = Object.keys(senderEntry?.notereqs || {}).filter(k => k !== noteID);

        if (remainingNotes.length === 0) {
            // Last note request from this sender — delete the whole doc on both sides
            batch.delete(receivedRef);
            batch.delete(sentRef);
        } else {
            // Other note requests still exist — only remove this one key from the map
            batch.update(receivedRef, { [`notereqs.${noteID}`]: deleteField() });
            batch.update(sentRef, { [`notereqs.${noteID}`]: deleteField() });
        }

        await batch.commit();

        // Update local state: remove just this noteID from the sender's notereqs
        const next = request
            .map(item => {
                if (item.doc !== senderID) return item;
                const updatedReqs = { ...item.notereqs };
                delete updatedReqs[noteID];
                return { ...item, notereqs: updatedReqs };
            })
            .filter(item => Object.keys(item.notereqs || {}).length > 0);

        setRequest(next);
        await saveRequest(next);
    }

    const handleAddRequest = async (senderID, noteID, sentto) => {
        const noteRef = doc(db, 'notes', noteID);
        const receivedRef = doc(db, 'users', curruser.uid, 'collabrequestreceived', senderID);
        const sentRef = doc(db, 'users', senderID, 'collabrequestsent', curruser.uid);
        const totalCollabRef = doc(db, 'users', curruser.uid);

        const totalCollabsnapshot = await getDoc(totalCollabRef);
        const value = totalCollabsnapshot.data().totalcollab;
        if (value >= 3) {
            setCantAccept(true);
            return;
        }

        const batch = writeBatch(db);

        // Add the recipient as a collaborator on the note
        batch.update(noteRef, { collaborator: arrayUnion(sentto) });
        batch.update(totalCollabRef, { totalcollab: increment(1) });

        // Check if this sender has other pending note requests
        const senderEntry = request.find(item => item.doc === senderID);
        const remainingNotes = Object.keys(senderEntry?.notereqs || {}).filter(k => k !== noteID);

        if (remainingNotes.length === 0) {
            // Last note request — delete the whole doc on both sides
            batch.delete(receivedRef);
            batch.delete(sentRef);
        } else {
            // Other note requests still pending — only remove this key
            batch.update(receivedRef, { [`notereqs.${noteID}`]: deleteField() });
            batch.update(sentRef, { [`notereqs.${noteID}`]: deleteField() });
        }

        await batch.commit();

        // Update local state: remove just this noteID
        const next = request
            .map(item => {
                if (item.doc !== senderID) return item;
                const updatedReqs = { ...item.notereqs };
                delete updatedReqs[noteID];
                return { ...item, notereqs: updatedReqs };
            })
            .filter(item => Object.keys(item.notereqs || {}).length > 0);

        setRequest(next);
        await saveRequest(next);
    }

    // Flatten: one card per (sender × note) pair so each row is independent
    const flatRequests = request.flatMap((item) =>
        Object.values(item?.notereqs || {}).map((req) => ({
            senderID: item.doc,
            fullname: item.fullname,
            pic: item.pic,
            username: item.username,
            sentto: item.sentto,
            noteID: req.noteID,
            noteTitle: req.title,
        }))
    );

    const renderRequest = ({ item }) => {
        return (
            <View style={styles.requestCard}>
                {/* Avatar */}
                <Image
                    source={{ uri: item?.pic }}
                    style={styles.requestAvatar} />

                {/* Text block */}
                <View style={styles.requestTextBlock}>
                    <Text numberOfLines={1} style={styles.requestNoteTitle}>
                        {item.noteTitle}
                    </Text>
                    <Text numberOfLines={1} style={styles.requestFullname}>
                        {item.fullname}
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.requestActions}>
                    <TouchableOpacity
                        onPress={() => handleAddRequest(item.senderID, item.noteID, item.sentto)}>
                        <FontAwesome name="check" size={18} color="orange" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteRequest(item.senderID, item.noteID)}>
                        <FontAwesome name="close" size={20} color="#e03333" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

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
        userContainer: {
            backgroundColor: isDark ? '#151515' : "#e6e6e6",
            borderRadius: 10,
            marginBottom: '3%',
        },
        // ── Request card ──────────────────────────────────────────────────────
        requestCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#1e1e1e' : '#fff',
            borderRadius: 12,
            margin: '1.5%',
            marginBottom: 5,
            padding: 7,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0 : 0.07,
            shadowRadius: 4,
            elevation: 2,
        },
        requestAvatar: {
            width: 48,
            height: 48,
            borderRadius: 10,
            marginRight: 10,
        },
        requestTextBlock: {
            flex: 1,
            justifyContent: 'center',
            marginRight: 8,
        },
        requestNoteTitle: {
            color: isDark ? '#fff' : '#111',
            fontFamily: 'Anaheim-Bold',
            fontSize: 16,
            marginBottom: 2,
        },
        requestFullname: {
            color: isDark ? '#aaa' : '#666',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 13,
        },
        requestActions: {
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ padding: 12, flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={icontheme} />
                </TouchableOpacity>
                <Image source={require('../assets/images/Memo.png')} style={{ width: 27, height: 27 }} />
            </View>

            <ScrollView
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.TabTitle}>MEMO</Text>
                </View>

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

                {/* Request Section */}
                <Text style={[styles.subtitle, { marginTop: 20 }]}>Requests</Text>
                <View style={[styles.section, { height: 245 }]}>
                    <View style={[styles.sectionCard, { height: '100%' }]}>
                        {
                            <FlatList
                                data={flatRequests}
                                nestedScrollEnabled={true}
                                scrollEnabled={true}
                                style={{ height: '100%', width: '100%' }}
                                renderItem={renderRequest}
                                keyExtractor={(item) => `${item.senderID}_${item.noteID}`}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh} />
                                }
                                ListEmptyComponent={() => (
                                    <View style={{ flex: 1, alignItems: 'center', marginTop: '27%' }}>
                                        <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-Bold' }}>
                                            Pull down to refresh
                                        </Text>
                                    </View>
                                )} />
                        }
                    </View>
                </View>

                {/* Account & Security Section */}
                <Text style={[styles.subtitle, { marginTop: 20 }]}>Account & Security</Text>
                <View style={styles.section}>
                    <View style={styles.sectionCard}>
                        {
                            curruser ?
                                <>
                                    <TouchableOpacity onPress={() => navi.navigate('SecurityInfoScreen')} style={styles.rowBtn}>
                                        <Text style={styles.settingtext}>Security</Text>
                                        <Entypo name="chevron-right" size={18} color={isDark ? 'gray' : '#858383'} style={{ marginRight: '5%', marginTop: '4%' }} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSignOut}
                                        style={styles.rowBtnWithIcon}>
                                        <Text style={[styles.settingtext, { flex: 1, color: 'orange' }]}>Logout</Text>
                                        <Entypo name="chevron-right" size={18} color={'orange'} style={{ marginRight: '5%', marginTop: '4%' }} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleDeleteAccount}
                                        style={styles.rowBtnWithIcon}>
                                        <Text style={[styles.settingtext, { flex: 1, color: isDark ? '#bc1515' : '#e00000' }]}>Delete</Text>
                                        <Entypo name="chevron-right" size={18} color={isDark ? '#ff2525' : '#e00000'} style={{ marginRight: '5%', marginTop: '4%' }} />
                                    </TouchableOpacity>
                                </>
                                :
                                <TouchableOpacity
                                    onPress={() => navi.navigate('Login')}
                                    style={styles.rowBtnWithIcon}>
                                    <Text style={[styles.settingtext, { flex: 1 }]}>Login</Text>
                                    <Entypo name="chevron-right" size={18} color={isDark ? 'gray' : '#858383'} style={{ marginRight: '5%', marginTop: '4%' }} />
                                </TouchableOpacity>
                        }
                    </View>
                </View>

                {/* Opinion Section */}
                <Text style={[styles.subtitle, { marginTop: 20 }]}>Opinion</Text>
                <View style={styles.section}>
                    <View style={styles.sectionCard}>
                        <TouchableOpacity
                            onPress={() => navi.navigate('Feedback')}
                            style={styles.rowBtnWithIcon}>
                            <MaterialIcons name="feedback" size={23} color={isDark ? 'gray' : '#858383'} style={{ marginLeft: '4%', marginTop: '4%' }} />
                            <Text style={[styles.settingtext, { flex: 1 }]}>Feedback</Text>
                            <Entypo name="chevron-right" size={18} color={isDark ? 'gray' : '#858383'} style={{ marginRight: '5%', marginTop: '4%' }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

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

            {/* Delete User Alert */}
            <Alerts
                visible={deleteuseralert}
                borderRadius={10}
                title={'Account Deletion'}
                body={"Are you sure to delete your ACCOUNT?\nIt is permanent and can not undo this action!!"}
                width={'90%'}
                bodyAlign='left'
                titleAlign="left"
                actionButtonAlign='right'
                onCancel={() => setDeleteUserAlert(false)}
                onAlert={(password) => {
                    setDeleteUserAlert(false);
                    deleteuser(password);
                }}
                alertText='Delete'
                needPassword={true} />
            <Snackbar
                visible={cantaccept}
                onDismiss={() => setCantAccept(false)}
                duration={3000}
                sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                wrapperStyle={{ position: 'absolute' }}
                style={{ height: 'auto' }}>
                Only 3 collab can be done!
            </Snackbar>

            <Snackbar
                visible={incorrectpasswd}
                onDismiss={() => setIncorrectPasswd(false)}
                duration={3000}
                sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                wrapperStyle={{ position: 'absolute' }}
                style={{ height: 'auto' }}>
                Incorrect Password!
            </Snackbar>

            <Snackbar
                visible={loginagain}
                onDismiss={() => setLoginAgain(false)}
                duration={3000}
                sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                wrapperStyle={{ position: 'absolute' }}
                style={{ height: 'auto' }}>
                Login again and try deleting!
            </Snackbar>
        </SafeAreaView>
    );
};

export default SettingsScreen;
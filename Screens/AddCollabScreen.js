import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView, KeyboardAvoidingView,
    Platform, useColorScheme, Share, useWindowDimensions, BackHandler,
} from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextInput, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Modal from 'react-native-modal';

import UserModal from '../components/UserModal';
import Alerts from '../components/Alerts';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {
    arrayUnion, doc, serverTimestamp, setDoc,
    getDoc, updateDoc,
    increment,
    writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../services/firebaseAuth';

const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Collab';

const AddNotesScreen = () => {
    const navi = useNavigation();
    const route = useRoute();

    const {
        mode = 'add',
        curDate,
        noteId: existingId,
        noteTitle,
        noteContent,
        noteDate,
        openedDate,
    } = route.params || {};

    const isDark = useColorScheme() === 'dark';
    const iconTheme = isDark ? '#fff' : '#000';

    const scrollViewRef = useRef(null);

    // ─── State ───────────────────────────────────────────────────────────────
    const [conflictAlert, setConflictAlert] = useState(false);
    const [viewchangesmodal, setViewChangesModal] = useState(false);
    const [cannotsave, setCannotSave] = useState(false)
    const [addUsers, setAddUsers] = useState(false);
    const [title, setTitle] = useState(mode === 'edit' ? noteTitle ?? '' : '');
    const [notes, setNotes] = useState(mode === 'edit' ? noteContent ?? '' : '');
    const [viewTitle, setViewTitle] = useState('');
    const [viewNotes, setViewNotes] = useState('');

    // ─── Stable refs (never trigger re-render) ───────────────────────────────
    const [noteId] = useState(existingId || Date.now().toString());
    const [addedDate] = useState(mode === 'edit' ? noteDate : curDate);

    const initialLastUpdatedRef = useRef(null);
    const liveLastUpdatedRef = useRef(null);
    const initialTitleRef = useRef(mode === 'edit' ? noteTitle ?? '' : '');
    const initialNotesRef = useRef(mode === 'edit' ? noteContent ?? '' : '');

    // True once the user has made any edit — prevents Firestore snapshots from
    // overwriting in-progress typing.
    const hasEditedRef = useRef(false);

    const handleTitleChange = (text) => { hasEditedRef.current = true; setTitle(text); };
    const handleNotesChange = (text) => { hasEditedRef.current = true; setNotes(text); };

    // Keep a live copy of title/notes for the BackHandler callback without
    // needing to re-register it every keystroke.
    const titleRef = useRef(title);
    const notesRef = useRef(notes);
    useEffect(() => { titleRef.current = title; }, [title]);
    useEffect(() => { notesRef.current = notes; }, [notes]);

    // ─── Single read on open ──────────────────────────────────────────────────
    // One getDoc instead of a persistent onSnapshot listener — no ongoing read
    // cost while the user is typing.
    useEffect(() => {
        if (!noteId) return;

        getDoc(doc(db, 'notes', noteId)).then((snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();
            const freshTitle = data.title ?? '';
            const freshNotes = data.notes ?? '';
            const freshTs = data.lastUpdated ?? null;

            liveLastUpdatedRef.current = freshTs;
            initialLastUpdatedRef.current = freshTs;
            initialTitleRef.current = freshTitle;
            initialNotesRef.current = freshNotes;

            // Only update state if the user hasn't started typing yet
            if (!hasEditedRef.current) {
                setTitle(freshTitle);
                setNotes(freshNotes);
            }
        });
    }, [noteId]);

    // ─── Android back button ─────────────────────────────────────────────────
    // Uses a stable callback that reads latest values via refs so we don't
    // need to re-register on every keystroke.
    const handleSaveAndGoBack = useCallback(async () => {
        try {
            if (mode === 'add') {
                await addNote(titleRef.current, notesRef.current);
                navi.goBack();
            } else {
                await editNote(titleRef.current, notesRef.current);
            }
        } catch (e){
            navi.goBack();
        }
    }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => { handleSaveAndGoBack(); return true; },
        );
        return () => backHandler.remove();
    }, [handleSaveAndGoBack]);

    // ─── Save helpers ─────────────────────────────────────────────────────────
    const addNote = async (currentTitle, currentNotes) => {
        if (!currentTitle.trim() && !currentNotes.trim()) return;

        const uid = auth.currentUser.uid;
        const noteData = {
            title: currentTitle,
            notes: currentNotes,
            noteId,
            curDate: addedDate,
            ownerID: uid,
            sortDate: serverTimestamp(),
            collaborator: arrayUnion(uid),
            lastUpdated: Date.now(),
        };

        await setDoc(doc(db, 'notes', noteId), noteData, { merge: true });
        const userRef = doc(db, 'users', auth.currentUser.uid);

        await updateDoc(userRef, {
            totalcollab: increment(1)
        })
        await patchCollabCache({ noteId, title: currentTitle, notes: currentNotes, curDate: addedDate });
    };

    // Patches the local AsyncStorage cache for a single note — no Firestore read.
    const patchCollabCache = async (updatedNote) => {
        try {
            const raw = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
            const cached = raw ? JSON.parse(raw) : [];
            const exists = cached.some(n => n.noteId === updatedNote.noteId);
            const next = exists
                ? cached.map(n => n.noteId === updatedNote.noteId ? { ...n, ...updatedNote } : n)
                : [...cached, updatedNote];
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Non-critical — list screen will re-fetch on next open
        }
    };

    const deleteafternotitleandnotes = async () => {
        const batch = writeBatch(db);
        const ref = doc(db, 'notes', noteId);
        const snapshot = await getDoc(ref);
        const collaboratorlst = snapshot.data().collaborator;

        collaboratorlst.forEach(userid => {
            const userRef = doc(db, 'users', userid);
            batch.update(userRef, {
                totalcollab: increment(-1)
            });
        });
        batch.delete(doc(db, 'notes', noteId));
        batch.commit()
        navi.goBack()
    }

    const editNote = async (currentTitle, currentNotes) => {
        const titleChanged = currentTitle.trim() !== initialTitleRef.current;
        const notesChanged = currentNotes.trim() !== initialNotesRef.current;

        if (!titleChanged && !notesChanged) {
            navi.goBack();
            return;
        }

        // ✅ Fetch the latest server state right before saving
        const snapshot = await getDoc(doc(db, 'notes', noteId));

        if (snapshot.exists()) {
            const serverLastUpdated = snapshot.data().lastUpdated ?? null;

            // Conflict: server was updated after we opened the note
            if (
                serverLastUpdated !== null &&
                initialLastUpdatedRef.current !== null &&
                serverLastUpdated > initialLastUpdatedRef.current
            ) {
                setConflictAlert(true);
                return;
            }
        }

        if (auth.currentUser.uid === snapshot?.data()?.ownerID) {
            if (currentTitle.trim() === '' && currentNotes.trim() === '') {
                deleteafternotitleandnotes();
            }
            else if (currentTitle.trim() === '') {
                setCannotSave(true)
                return;
            }
        }

        await performUpdate(currentTitle, currentNotes);
    };

    const performUpdate = async (currentTitle, currentNotes) => {
        await updateDoc(doc(db, 'notes', noteId), {
            title: currentTitle,
            notes: currentNotes,
            lastUpdated: Date.now(),
        });
        await patchCollabCache({ noteId, title: currentTitle, notes: currentNotes, curDate: addedDate });
        navi.goBack();
    };

    // ─── UI helpers ───────────────────────────────────────────────────────────
    const handleShare = () => {
        Share.share({ message: `${title}\n${notes}` });
    };

    // ─── Styles ───────────────────────────────────────────────────────────────
    const bg = isDark ? '#252525' : '#fff';
    const styles = StyleSheet.create({
        titleEntry: {
            color: isDark ? '#fff' : '#000',
            fontSize: 25,
            fontFamily: 'Anaheim-Bold',
            backgroundColor: bg,
        },
        dateText: {
            color: isDark ? 'gray' : '#000',
            marginLeft: 8,
            fontFamily: 'Anaheim-Regular',
            fontSize: 17,
        },
        notesEntry: {
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-Regular',
            height: '100%',
        },
        scrollViewContent: {
            flexGrow: 1,
            paddingHorizontal: 15,
            paddingBottom: 75,
        },
        actionButton: {
            padding: '1.5%',
            borderRadius: 5,
            backgroundColor: 'red'
        },
        cancelBtntxt: {
            color: isDark ? '#999999' : '#000',
            fontFamily: 'Anaheim-Regular',
        },
    });

    const inputUnderline = { underlineColor: bg, activeUnderlineColor: bg };
    const inputCursorColor = isDark ? '#abababff' : '#252525';
    const sharedContentStyle = {
        backgroundColor: bg,
        fontFamily: 'Anaheim-SemiBold',
        color: isDark ? '#fff' : '#000',
    };

    const handleExtraButton = async () => {
        setConflictAlert(false);

        const snapshot = await getDoc(doc(db, 'notes', noteId));

        if (snapshot.exists()) {
            setViewTitle(snapshot.data().title || '');
            setViewNotes(snapshot.data().notes || '');
        }

        setViewChangesModal(true);
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
            {/* Header */}
            <View style={{ padding: 12, flexDirection: 'row' }}>
                <View style={{ width: '83%' }}>
                    <TouchableOpacity onPress={handleSaveAndGoBack}>
                        <Feather name="arrow-left" size={24} color={iconTheme} />
                    </TouchableOpacity>
                </View>
                <View style={{ width: '17%', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color={iconTheme} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAddUsers(true)}>
                        <FontAwesome5 name="user-plus" size={20} color={iconTheme} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Body */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    ref={scrollViewRef}
                    keyboardShouldPersistTaps="always"
                    decelerationRate="fast"
                    removeClippedSubviews>

                    <TextInput
                        placeholder="Title"
                        placeholderTextColor="gray"
                        selectionColor="#ffb52cc5"
                        selectionHandleColor="#ffb52cc5"
                        {...inputUnderline}
                        value={title}
                        onChangeText={handleTitleChange}
                        cursorColor={inputCursorColor}
                        style={styles.titleEntry}
                        contentStyle={{ ...sharedContentStyle, fontSize: 25, marginLeft: -8 }}
                    />

                    <Text style={styles.dateText}>{addedDate}</Text>

                    <TextInput
                        placeholder="Start Typing..."
                        placeholderTextColor="gray"
                        selectionColor="#ffb52cc5"
                        selectionHandleColor="#ffb52cc5"
                        {...inputUnderline}
                        value={notes}
                        onChangeText={handleNotesChange}
                        cursorColor={inputCursorColor}
                        multiline
                        style={styles.notesEntry}
                        contentStyle={{ ...sharedContentStyle, fontSize: 18, marginLeft: -8 }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modals */}
            <UserModal
                visible={addUsers}
                title={title}
                setVisible={setAddUsers}
                noteID={noteId}
                mode={mode}
            />

            <Alerts
                visible={conflictAlert}
                borderRadius={15}
                title="Conflict"
                body={
                    'This note was updated by someone else while you were editing.\n' +
                    'Saving now will overwrite their changes. Continue?'
                }
                onCancel={() => setConflictAlert(false)}
                alertText="Save Anyway"
                type="conflict"
                // Wire up the "Save Anyway" action so the user can actually proceed
                onAlert={async () => {
                    setConflictAlert(false);
                    await performUpdate(titleRef.current, notesRef.current);
                }}
                onExtraButton={handleExtraButton}
            />

            <Modal
                animationIn={'slideInUp'}
                isVisible={viewchangesmodal}
                onDismiss={() => { setViewChangesModal(false); setConflictAlert(true); }}
                hasBackdrop={true}
                style={{ alignItems: 'center', justifyContent: 'flex-end' }}
                onBackButtonPress={() => { setViewChangesModal(false); setConflictAlert(true); }}
                onBackdropPress={() => { setViewChangesModal(false); setConflictAlert(true); }}>
                <View style={{ width: '105%', backgroundColor: isDark ? "#252525" : '#fff', borderTopLeftRadius: 15, borderTopRightRadius: 15, marginBottom: '-5%', maxHeight: '75%', paddingBottom: '2%' }}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Anaheim-Bold', color: isDark ? '#fff' : '#000', fontSize: 23, }}>View Changes</Text>
                    </View>
                    <ScrollView style={{ marginBottom: '2%' }}>
                        <Text style={{ fontFamily: 'Anaheim-Bold', color: isDark ? '#fff' : '#000', fontSize: 21, marginLeft: '5%' }}>{viewTitle}</Text>
                        <Text style={{ fontFamily: 'Anaheim-Regular', color: isDark ? '#fff' : '#000', fontSize: 17, marginLeft: '5%' }}>{viewNotes}</Text>
                    </ScrollView>
                    <View style={{ alignItems: 'center', marginHorizontal: '3%', flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                        <TouchableOpacity onPress={() => { setViewChangesModal(false); setConflictAlert(true); }}>
                            <Text style={styles.cancelBtntxt}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => performUpdate(titleRef.current, notesRef.current)} style={styles.actionButton}>
                            <Text style={{ color: '#fff', fontFamily: 'Anaheim-SemiBold' }}>Discard Changes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navi.goBack()} style={[styles.actionButton, { backgroundColor: 'orange', paddingHorizontal: '4%' }]}>
                            <Text style={{ color: '#0000', fontFamily: 'Anaheim-SemiBold' }}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* No title */}
            <Snackbar
                visible={cannotsave}
                duration={1500}
                sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                onDismiss={() => setCannotSave(false)}
                style={{ borderRadius: 15, }}>
                Enter title to save collab notes!
            </Snackbar>
        </SafeAreaView>
    );
};

export default AddNotesScreen;

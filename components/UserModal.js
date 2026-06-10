import {
    FlatList, StyleSheet, Text, View, useColorScheme, Image, TouchableOpacity,
    BackHandler
} from 'react-native'
import React, { useEffect, useState } from 'react';
import { Searchbar, Snackbar } from 'react-native-paper';

import { db, auth } from '../services/firebaseAuth';
import { collection, doc, where, getDocs, query, writeBatch, addDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const UserModal = ({ visible, title, setVisible, noteID, mode }) => {

    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';

    const [searchQuery, setSearchQuery] = useState('');
    const [allusers, setAllUsers] = useState(null);

    const [addtitle, setAddTitle] = useState(false);
    const [successcollab, setSuccessCollab] = useState(false);

    const user = auth.currentUser;

    useEffect(() => {

        const backAction = () => {

            if (visible) {
                setVisible(false);
                return true;
            }

            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();

    }, [visible]);

    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery == '') {
                setAllUsers([])
                return null;
            }

            const q = query(collection(db, 'users'), where('fullnamelower', '>=', searchQuery.toLowerCase()), where('fullnamelower', '<=', searchQuery.toLowerCase() + '\uf8ff'));
            const usersRef = await (getDocs(q));
            let userdocs = []

            const myName = (((await (getDoc(doc(db, 'users', user.uid)))).data()).fullname).toLowerCase()

            usersRef.docs.map((users) => {
                if (myName !== (users.data().fullname).toLowerCase()) {
                    userdocs.push({
                        id: users.id,
                        fullname: users.data().fullname,
                        username: users.data().username,
                        pic: users.data().image
                    })
                }
            });
            setAllUsers(userdocs);
        }
        searchUsers();
        console.log(allusers);
    }, [searchQuery])

    const handleAddUser = async (id, fullname, username, pic) => {
        if (!(title.trim())) {
            setAddTitle(true);
            return;
        }
        setSuccessCollab(true);
        const userRef = doc(db, 'users', user.uid, 'collabrequestsent', id);
        const docRef = doc(db, 'users', id, 'collabrequestreceived', user.uid);
        const mydocRef = (await getDoc(doc(db, 'users', user.uid)));
        const senderData = mydocRef.data();

        const batch = writeBatch(db);

        batch.set(userRef, {
            id: id,
            sentFrom: user.uid,
            fullname: fullname,
            username: username,
            pic: pic,
            notereqs: {
                [noteID]: {
                    noteID,
                    title,
                }
            }
        }, { merge: true });

        batch.set(docRef, {
            id: user.uid,
            sentto: id,
            fullname: senderData.fullname,
            username: senderData.username,
            pic: senderData.image,
            notereqs: {
                [noteID]: {
                    noteID,
                    title,
                }
            }
        }, { merge: true });

        // Only initialise the note document when creating for the first time.
        // In edit mode the document already exists — skip this step but still
        // commit the request writes above.
        if (mode !== 'edit') {
            batch.set(doc(db, 'notes', noteID), {
                title: title,
                ownerID: auth.currentUser.uid,
                collaborator: arrayUnion(auth.currentUser.uid)
            }, { merge: true });
        }

        await batch.commit();
    }

    const renderUser = ({ item, index }) => {
        console.log(item)
        return (
            <View style={[styles.userContainer, { flexDirection: 'row' }]}>
                <View style={{ padding: 5, width: '19%' }}>
                    <Image source={{ uri: item?.pic }} style={{ width: 50, height: 50, borderRadius: 10 }} />
                </View>
                <View style={{ justifyContent: 'center', width: '70%', }}>
                    <Text numberOfLines={1} style={{ color: isDark ? "#fff" : "#000", fontFamily: 'Anaheim-SemiBold' }}>{item?.fullname}</Text>
                    <Text numberOfLines={1} style={{ color: isDark ? "#fff" : "#000", fontFamily: 'Anaheim-SemiBold' }}>{item?.username}</Text>
                </View>
                <View style={{ justifyContent: 'center', width: '11%', }}>
                    <TouchableOpacity onPress={() => handleAddUser(item?.id, item?.fullname, item?.username, item?.pic)}>
                        <MaterialIcons name="add" size={24} color={'orange'} />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    const styles = StyleSheet.create({
        overlay: {
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            zIndex: 999,
            elevation: 999,
            backgroundColor: isDark ? "rgba(23, 23, 23, 0.87)" : 'rgba(124, 124, 124, 0.87)',
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center'
        },
        container: {
            backgroundColor: isDark ? "#000" : '#fff',
            width: '90%',
            height: 'auto',
            borderRadius: 10,
            padding: '3%',
            maxWidth: '90%',
            height: '60%',
            alignItems: 'center'
        },
        titletxt: {
            color: isDark ? "#fff" : '#000',
            fontFamily: 'Anaheim-Bold',
            fontSize: 20,
            textAlign: 'center',
            overflow: 'hidden',
            marginBottom: '3%'
        },
        Searchbar: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '100%',
            borderRadius: 10,
            height: 45,
            marginBottom: 10,
        },
        userContainer: {
            backgroundColor: isDark ? '#151515' : "#e6e6e6",
            borderRadius: 10,
            marginBottom: '3%',
        }
    })

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <Text style={styles.titletxt}>Add Collaborator</Text>
                <Searchbar
                    placeholder='Search User by fullname'
                    placeholderTextColor={isDark ? '#e6e6e6aa' : 'gray'}
                    inputStyle={{ marginTop: -7, fontSize: 17, fontFamily: 'Anaheim-SemiBold', color: icontheme }}
                    style={styles.Searchbar}
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    iconColor={isDark ? 'gray' : '#5B5B5B'}
                    clearButtonMode='always'
                    cursorColor={'orange'}
                    selectionColor={'orange'}
                    selectionHandleColor={'orange'} />
                <View style={{ backgroundColor: isDark ? '#000' : '#fff', flex: 1, width: '100%', borderRadius: 10 }}>
                    <FlatList
                        data={allusers}
                        keyboardDismissMode='on-drag'
                        renderItem={renderUser}
                        ListEmptyComponent={() => (
                            <View style={{ flex: 1, alignItems: 'center', marginTop: '50%' }}>
                                <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily: 'Anaheim-SemiBold' }}>
                                    {searchQuery ? 'No matching User' : "Search User"}
                                </Text>
                            </View>
                        )} />
                </View>
            </View>
            <Snackbar
                visible={addtitle}
                onDismiss={() => setAddTitle(false)}
                duration={3000}
                sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
                wrapperStyle={{ position: 'absolute', }}
                style={{ height: 'auto', }}>
                Add title before adding Collaborator!
            </Snackbar>

            <Snackbar
                visible={successcollab}
                onDismiss={() => setSuccessCollab(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: 'orange' }}
                style={{ height: 'auto' }}>
                Request sent to Collaborator!
            </Snackbar>
        </View>
    )
}

export default UserModal;
import { StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card, Divider, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Modal from 'react-native-modal';

import { useTheme } from '../utils/Theme'
import Feather from 'react-native-vector-icons/Feather'
import Entypo from "react-native-vector-icons/Entypo";

import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseAuth';
import { verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider, signOut, updatePassword, } from 'firebase/auth';

const SecurityInfoScreen = () => {

    const isDark = useColorScheme() === 'dark'
    const { TEXT, Colour, BUTTON, TEXTINPUT } = useTheme();
    const navi = useNavigation();
    const user = auth.currentUser;

    const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff';

    const [changeemailmodalvisible, setChangeEmailModalVisible] = useState(false);

    // CHANGE EMAIL
    const [curremail, setCurrEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currpasswd, setCurrPasswd] = useState('');
    const [showpasswd, setShowPasswd] = useState(false)
    const [emailsnackvisible, setEmailSnackVisible] = useState(false);
    const [wrongemailsnackvisible, setWrongEmailSnackVisible] = useState(false);

    // CHANGE PASSWORD
    const [changepasswordmodalvisible, setChangePasswordModalVisible] = useState(false);
    const [newpasswd, setNewPasswd] = useState('');
    const [repasswd, setRePasswd] = useState('');
    const [passwdsnackvisible, setPasswdSnackVisible] = useState(false);
    const [wrongrepasswdsnackvisible, setWrongRePasswdSnackVisible] = useState(false);
    const [wrongpasswdsnackvisible, setWrongPasswdSnackVisible] = useState(false);
    const [shownewpasswd, setShowNewPasswd] = useState(false)
    const [showrenewpasswd, setShowReNewPasswd] = useState(false)

    // Change Phone Number
    const [changephonenumber, setChangePhoneNumber] = useState(false);
    const [phonenumber, setPhoneNumber] = useState('');
    const [newphonenumber, setNewPhoneNumber] = useState('');
    const [wrongphonenosnackvisible, setWrongPhoneNoSnackVisible] = useState(false);
    const [phonenumberchangedsnackvisible, setPhoneNumberChangedSnackVisible] = useState(false);

    const buttoncard = isDark ? '#5c5c5cff' : '#d5d5d5ff';

    const styles = StyleSheet.create({
        container:
        {
            flex: 1,
            backgroundColor: isDark ? '#252525' : '#fff',
        },
        header:
        {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: '3%',
            gap: 15
        },
        subtitle: {
            marginLeft: 17,
            color: isDark ? '#C4BFBF' : '#666',
            fontFamily: 'Anaheim-Bold',
            fontSize: 18,
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
        settingtext: {
            marginTop: 7,
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 18,
            marginLeft: 15,
        },
    });

    const changeEmailFunc = async () => {
        try {
            const Credentials = EmailAuthProvider.credential(curremail, currpasswd);
            await reauthenticateWithCredential(user, Credentials);
            await verifyBeforeUpdateEmail(user, newEmail);
            setEmailSnackVisible(true);
        }
        catch (e) {
            console.log("Error changing email: ", e);
            setWrongEmailSnackVisible(true);
            return;
        }

        setCurrPasswd('');
        setNewEmail('');
        setChangeEmailModalVisible(false);
        setShowPasswd(false);
    }

    const changePasswdFunc = async () => {
        if (newpasswd !== repasswd) {
            setWrongRePasswdSnackVisible(true);
            return;
        }
        if (repasswd === '' || newpasswd === '' || currpasswd === '') {
            setWrongPasswdSnackVisible(true);
            return;
        }

        try {
            const Crendential = EmailAuthProvider.credential(user.email, currpasswd);
            await reauthenticateWithCredential(user, Crendential);
            await updatePassword(user, newpasswd);
            setPasswdSnackVisible(true);
        }
        catch (e) {
            console.log("Error changing password: ", e);
            setWrongPasswdSnackVisible(true);
            return;
        }

        setCurrPasswd('');
        setNewPasswd('');
        setRePasswd('');
        setChangePasswordModalVisible(false);
    }

    const changePhoneNumberFunc = async () => {

        // const templateParams = {
        //     from_name: 'Team Connect',
        //     to_email: 'nmanoj0212@gmail.com',
        //     message: 'This email was sent automatically from React Native!',
        // };

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if ((phonenumber === '' && docSnap.data().phone_number !== '') || newphonenumber === '') {
            setWrongPhoneNoSnackVisible(true);
            return;
        }
        try {
            if (docSnap.exists() && docSnap.data().phone_number !== phonenumber) {
                setWrongPhoneNoSnackVisible(true);
                return;
            }
            await updateDoc(doc(db, 'users', user.uid), {
                phone_number: newphonenumber
            });
            setPhoneNumberChangedSnackVisible(true);
            setChangePhoneNumber(false);
            setPhoneNumber('');
            setNewPhoneNumber('');
        }
        catch (e) {
            console.log("Error changing phone number: ", e);
            setWrongPhoneNoSnackVisible(true);
            return;
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                {/* APP NAME */}
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={isDark ? "#fff" : '#000'} />
                </TouchableOpacity>
                <Text style={TEXT.heading}>Security Info</Text>
            </View>

            <View style={{ width: '100%', alignSelf: 'center', }}>
                {/* SECURITY */}
                <View id='Security' style={{}}>
                    <Text style={styles.subtitle}>Security</Text>
                    <View style={styles.section}>
                        <View style={styles.sectionCard}>
                            {/* Change Email */}
                            <TouchableOpacity onPress={() => setChangeEmailModalVisible(true)} style={styles.rowBtn}>
                                <Text style={styles.settingtext}>Change Email</Text>
                            </TouchableOpacity>
                            <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#ccc', width: '95%' }} />
                            {/* 2 FACTOR AUTHENTICATION */}
                            <TouchableOpacity onPress={() => setChangePasswordModalVisible(true)} style={styles.rowBtn}>
                                <Text style={styles.settingtext}>Change password</Text>
                            </TouchableOpacity>
                            <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#ccc', width: '95%' }} />
                            {/* VERIFICATION BADGE */}
                            <TouchableOpacity onPress={() => setChangePhoneNumber(true)} style={styles.rowBtn}>
                                <Text style={styles.settingtext}>Change phone number</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* CHANGE EMAIL MODAL */}
            <Modal isVisible={changeemailmodalvisible}
                hasBackdrop={true}
                onBackdropPress={() => { setChangeEmailModalVisible(false); setCurrPasswd(''); }}
                onBackButtonPress={() => { setChangeEmailModalVisible(false); setCurrPasswd(''); }}
                animationIn={'rubberBand'}
                style={{ justifyContent: 'flex-end' }} >

                <View style={{ backgroundColor: isDark ? '#333' : '#fff', padding: 20, borderRadius: 8, alignItems: 'center', }}>
                    <Text style={[TEXT.subheading, { alignSelf: 'center', marginBottom: 10, }]}>Change Email</Text>

                    <TextInput
                        placeholder='Email'
                        placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                        style={[TEXTINPUT.txtinput, { minWidth: '97%' }]}
                        keyboardType='email-address'
                        value={curremail}
                        onChangeText={setCurrEmail} />

                    <TextInput
                        placeholder='New Email'
                        placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                        style={[TEXTINPUT.txtinput, { minWidth: '97%' }]}
                        keyboardType='email-address'
                        value={newEmail}
                        onChangeText={setNewEmail} />

                    <View style={{
                        backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                        borderRadius: 8,
                        marginVertical: 6,
                        minWidth: '95%',
                        minHeight: '5%',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                    }}>

                        <TextInput
                            style={{ color: isDark ? '#fff' : '#000', width: '85%', fontFamily: "Anaheim-SemiBold", }}
                            placeholder='Current password'
                            value={currpasswd}
                            onChangeText={setCurrPasswd}
                            secureTextEntry={!showpasswd}
                            placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'} />
                        <TouchableOpacity onPress={() => setShowPasswd(!showpasswd)}>
                            {
                                showpasswd ? <Entypo name="eye" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                    :
                                    <Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                            }
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[
                        BUTTON.subbtn,
                        {
                            borderColor: 'orange',
                            width: '45%',
                            marginTop: '5%',
                            paddingVertical: 7,
                        },
                    ]} onPress={changeEmailFunc}>
                        <Text style={BUTTON.subbtntxt}>Change</Text>
                    </TouchableOpacity>
                </View>

                {/* WRONG EMAIL SNACK */}
                <Snackbar
                    visible={wrongemailsnackvisible}
                    onDismiss={() => setWrongEmailSnackVisible(false)}
                    onclick={() => setWrongEmailSnackVisible(false)}
                    duration={3000}
                    wrapperStyle={{ position: 'absolute' }}
                    sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                    Invalid email or password!
                </Snackbar>
            </Modal>

            {/* CHANGE PASSWORD MODAL */}
            <Modal isVisible={changepasswordmodalvisible}
                hasBackdrop={true}
                onBackdropPress={() => { setChangePasswordModalVisible(false); setCurrPasswd(''); setNewPasswd(''); setRePasswd(''); }}
                onBackButtonPress={() => { setChangePasswordModalVisible(false); setCurrPasswd(''); setNewPasswd(''); setRePasswd(''); }}
                animationIn={'rubberBand'}
                style={{ justifyContent: 'flex-end' }} >

                <View id='Current Passwd' style={{ backgroundColor: isDark ? '#333' : '#fff', padding: 20, borderRadius: 8, alignItems: 'center', }}>
                    <Text style={[TEXT.subheading, { alignSelf: 'center', marginBottom: 10, }]}>Change Password</Text>
                    <View style={{
                        backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                        borderRadius: 8,
                        marginVertical: 6,
                        minWidth: '95%',
                        minHeight: '5%',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                    }}>

                        <TextInput
                            style={{ color: isDark ? '#fff' : '#000', width: '85%', fontFamily: "Anaheim-SemiBold", }}
                            placeholder='Current password'
                            value={currpasswd}
                            onChangeText={setCurrPasswd}
                            secureTextEntry={!showpasswd}
                            placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'} />
                        <TouchableOpacity onPress={() => setShowPasswd(!showpasswd)}>
                            {
                                showpasswd ? <Entypo name="eye" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                    :
                                    <Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                            }
                        </TouchableOpacity>
                    </View>

                    <View id='New Passwd' style={{
                        backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                        borderRadius: 8,
                        marginVertical: 6,
                        minWidth: '95%',
                        minHeight: '5%',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                    }}>

                        <TextInput
                            style={{ color: isDark ? '#fff' : '#000', width: '85%', fontFamily: "Anaheim-SemiBold", }}
                            placeholder='New password'
                            value={newpasswd}
                            onChangeText={setNewPasswd}
                            secureTextEntry={!shownewpasswd}
                            placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'} />
                        <TouchableOpacity onPress={() => setShowNewPasswd(!shownewpasswd)}>
                            {
                                shownewpasswd ? <Entypo name="eye" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                    :
                                    <Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                            }
                        </TouchableOpacity>
                    </View>

                    <View id='re-new passwd' style={{
                        backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                        borderRadius: 8,
                        marginVertical: 6,
                        minWidth: '95%',
                        minHeight: '5%',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                    }}>

                        <TextInput
                            style={{ color: isDark ? '#fff' : '#000', width: '85%', fontFamily: "Anaheim-SemiBold", }}
                            placeholder='Re-enter new password'
                            value={repasswd}
                            onChangeText={setRePasswd}
                            secureTextEntry={!showrenewpasswd}
                            placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'} />
                        <TouchableOpacity onPress={() => setShowReNewPasswd(!showrenewpasswd)}>
                            {
                                showrenewpasswd ? <Entypo name="eye" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                                    :
                                    <Entypo name="eye-with-line" size={20} color={placeholdercolor} style={{ alignSelf: 'center', top: '22%', marginRight: '5%', justifyContent: 'center' }} />
                            }
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[
                        BUTTON.subbtn,
                        {
                            borderColor: 'orange',
                            width: '45%',
                            marginTop: '5%',
                            paddingVertical: 7,
                        },
                    ]} onPress={changePasswdFunc}>
                        <Text style={BUTTON.subbtntxt}>Change</Text>
                    </TouchableOpacity>
                </View>

                {/* WRONG RePasswd SNACK */}
                <Snackbar
                    visible={wrongrepasswdsnackvisible}
                    onDismiss={() => setWrongRePasswdSnackVisible(false)}
                    onclick={() => setWrongRePasswdSnackVisible(false)}
                    duration={3000}
                    wrapperStyle={{ position: 'absolute' }}
                    sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                    New passwords do not match!
                </Snackbar>

                {/* WRONG PASSWORD SNACK */}
                <Snackbar
                    visible={wrongpasswdsnackvisible}
                    onDismiss={() => setWrongPasswdSnackVisible(false)}
                    onclick={() => setWrongPasswdSnackVisible(false)}
                    duration={3000}
                    wrapperStyle={{ position: 'absolute' }}
                    sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                    Invalid password!
                </Snackbar>
            </Modal>

            {/* CHANGE PHONE NUMBER MODAL */}
            <Modal isVisible={changephonenumber}
                hasBackdrop={true}
                onBackdropPress={() => { setChangePhoneNumber(false); }}
                onBackButtonPress={() => { setChangePhoneNumber(false); }}
                animationIn={'rubberBand'}
                style={{ justifyContent: 'flex-end' }} >

                <View style={{ backgroundColor: isDark ? '#333' : '#fff', padding: 20, borderRadius: 8, alignItems: 'center', }}>
                    <Text style={[TEXT.subheading, { alignSelf: 'center', marginBottom: 10, }]}>Change phone number</Text>

                    <TextInput
                        placeholder='Phone number'
                        placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                        style={[TEXTINPUT.txtinput, { minWidth: '97%' }]}
                        keyboardType='phone-pad'
                        value={phonenumber}
                        onChangeText={setPhoneNumber} />

                    <TextInput
                        placeholder='New phone number'
                        placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                        style={[TEXTINPUT.txtinput, { minWidth: '97%' }]}
                        keyboardType='phone-pad'
                        value={newphonenumber}
                        onChangeText={setNewPhoneNumber} />

                    <TouchableOpacity style={[
                        BUTTON.subbtn,
                        {
                            borderColor: 'orange',
                            width: '45%',
                            marginTop: '5%',
                            paddingVertical: 7,
                        },
                    ]} onPress={changePhoneNumberFunc}>
                        <Text style={BUTTON.subbtntxt}>Change</Text>
                    </TouchableOpacity>
                </View>

                {/* WRONG PHONE NUMBER SNACK */}
                <Snackbar
                    visible={wrongphonenosnackvisible}
                    onDismiss={() => setWrongPhoneNoSnackVisible(false)}
                    onclick={() => setWrongPhoneNoSnackVisible(false)}
                    duration={3000}
                    wrapperStyle={{ position: 'absolute' }}
                    sidebg={{ backgroundColor: 'rgba(255, 71, 71, 1)' }}>
                    Wrong phone number!
                </Snackbar>
            </Modal>

            {/* CHANGED EMAIL SNACK */}
            <Snackbar
                visible={emailsnackvisible}
                onDismiss={() => setEmailSnackVisible(false)}
                onclick={() => setEmailSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: isDark ? 'rgba(86, 255, 71, 1)' : 'rgba(0, 192, 0, 1)' }}>
                Email changed successfully!
            </Snackbar>

            {/* CHANGED PASSWD SNACK */}
            <Snackbar
                visible={passwdsnackvisible}
                onDismiss={() => setPasswdSnackVisible(false)}
                onclick={() => setPasswdSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: isDark ? 'rgba(86, 255, 71, 1)' : 'rgba(0, 192, 0, 1)' }}>
                Password changed successfully!
            </Snackbar>

            {/* CHANGED PHONE NUMBER SNACK */}
            <Snackbar
                visible={phonenumberchangedsnackvisible}
                onDismiss={() => setPhoneNumberChangedSnackVisible(false)}
                onclick={() => setPhoneNumberChangedSnackVisible(false)}
                duration={3000}
                wrapperStyle={{ position: 'absolute' }}
                sidebg={{ backgroundColor: isDark ? 'rgba(86, 255, 71, 1)' : 'rgba(0, 192, 0, 1)' }}>
                Phone number changed successfully!
            </Snackbar>

        </SafeAreaView>
    )
}

export default SecurityInfoScreen
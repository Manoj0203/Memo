import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useState } from 'react';
import { sendPasswordResetEmail } from '@firebase/auth';

import { useTheme } from '../utils/Theme';
import { auth } from '../services/firebaseAuth';
import Alerts from './Alerts';

const ForgotPassword = () => {
    const isDark = useColorScheme() === 'dark';

    const [email, setEmail] = useState('');

    const { TEXT, Colour, BUTTON, TEXTINPUT } = useTheme();

    const sendVerification = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email.trim().toLowerCase())
            Alert.alert('Verification sent', `The password reset verification email has been sent to ${email.trim().toLowerCase()}`)
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                Alert.alert('asd', 'No account found with this email');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('asd', 'Invalid email address');
            } else {
                Alert.alert('asd', error.message);
            }
        }
    }

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <TextInput
                placeholder='Email'
                placeholderTextColor={isDark ? '#acacacff' : '#7e7e7eff'}
                style={[TEXTINPUT.txtinput, { minWidth: '72%', }]}
                keyboardType='email-address'
                value={email}
                onChangeText={setEmail} />

            <TouchableOpacity
                style={[
                    BUTTON.subbtn,
                    {
                        width: '45%',
                        marginTop: '5%',
                        paddingVertical: 7,
                    },
                ]}
                onPress={sendVerification}>

                <Text style={BUTTON.subbtntxt}>
                    Send Verification
                </Text>
            </TouchableOpacity>

        </View>
    )
}

export default ForgotPassword

const styles = StyleSheet.create({})
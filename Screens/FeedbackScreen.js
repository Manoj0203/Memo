import {
    StyleSheet, Text, View, TouchableOpacity, useColorScheme,
    Alert, Linking, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

// Vector Icon Imports
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FeedbackScreen = () => {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';
    const navi = useNavigation();

    const [feedback, setFeedback] = useState('');

    const openEmail = async () => {
        const email = 'nmanoj0212@gmail.com';
        if (feedback.trim() === '') {
            Alert.alert('Error', 'Please enter your feedback before sending.');
            return;
        }
        const msg = encodeURIComponent(feedback.trim());
        const url = `mailto:${email}?subject=${encodeURIComponent('Feedback for app MEMO')}&body=${encodeURIComponent(msg)}`;
        try {
            setFeedback('');
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred while trying to open the mail app.');
        }
    };

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
            marginBottom: 15,
        },
        feedbackCard: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '92%',
            alignSelf: 'center',
            borderRadius: 15,
            minHeight: 220,
            marginBottom: 15,
            overflow: 'hidden',
        },
        feedbackEntry: {
            marginHorizontal: 0,
            minHeight: 220,
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
        },
        sendBtn: {
            backgroundColor: isDark ? '#151515' : '#E6E6E6',
            width: '92%',
            alignSelf: 'center',
            borderRadius: 15,
            flexDirection: 'row',
            justifyContent: 'center',
            paddingVertical: 13,
        },
        sendText: {
            marginTop: 0,
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-SemiBold',
            fontSize: 20,
            marginLeft: 10,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ padding: 12, flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => navi.goBack()}>
                    <Feather name="arrow-left" size={24} color={icontheme} />
                </TouchableOpacity>
            </View>

            <Text style={styles.TabTitle}>Feedback</Text>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    keyboardShouldPersistTaps='always'
                    contentContainerStyle={{ paddingBottom: 30 }}>
                    <View style={styles.feedbackCard}>
                        <TextInput
                            placeholder={"Enter Feedback..."}
                            placeholderTextColor={'gray'}
                            selectionColor='#ffb52cc5'
                            selectionHandleColor={'#ffb52cc5'}
                            underlineColor={'transparent'}
                            activeUnderlineColor={'transparent'}
                            value={feedback}
                            onChangeText={setFeedback}
                            cursorColor={isDark ? '#abababff' : '#252525'}
                            multiline
                            style={styles.feedbackEntry}
                            contentStyle={{
                                backgroundColor: isDark ? '#151515' : '#E6E6E6',
                                fontFamily: 'Anaheim-SemiBold',
                                borderRadius: 15,
                                fontSize: 17,
                                color: isDark ? '#fff' : '#000',
                            }} />
                    </View>

                    <TouchableOpacity onPress={openEmail} style={styles.sendBtn}>
                        <Ionicons name="send" size={22} color="orange" />
                        <Text style={styles.sendText}>Send Feedback</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default FeedbackScreen;

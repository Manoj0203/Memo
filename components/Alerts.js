import { StyleSheet, Text, View, useColorScheme, TouchableOpacity, Animated, TextInput } from 'react-native'
import React, { useRef, useEffect, useState } from 'react';
import Entypo from "react-native-vector-icons/Entypo";

const Alerts = ({ visible,
    borderRadius,
    title = 'Alert',
    body = 'Add a body for the Alert Container',
    bodyAlign = 'left',
    titleAlign = "left",
    actionButtonAlign = 'flex-end',
    width,
    onCancel,
    alertText = 'Alert',
    onAlert,
    type = 'alert',
    alertColor,
    onExtraButton,
    alertTextColor,
    needPassword,
}) => {

    const isDark = useColorScheme() === 'dark';
    const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff'

    const [password, setPassword] = useState('');
    const [showpasswd, setShowPasswd] = useState(false)

    //Animation
    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 6,
                tension: 80,
            }).start();
        }
        else {
            scaleAnim.setValue(0.8);
        }
    }, [visible]);

    if (actionButtonAlign == 'right') {
        actionButtonAlign = 'flex-end';
    }
    else if (actionButtonAlign == 'left') {
        actionButtonAlign = 'flex-start'
    }
    else if (actionButtonAlign == 'center') {
        actionButtonAlign = 'center';
    }
    else {
        actionButtonAlign = 'flex-end'
    }

    const styles = StyleSheet.create({
        overlay: {
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
            backgroundColor: isDark ? "rgba(23, 23, 23, 0.87)" : 'rgba(124, 124, 124, 0.87)',
            position: 'absolute',
            elevation: 999
        },
        container: {
            backgroundColor: isDark ? "#000" : '#fff',
            width: width,
            height: 'auto',
            borderRadius: borderRadius,
            padding: '3%',
            maxWidth: '90%',
            maxHeight: '50%',
        },
        titletxt: {
            color: isDark ? "#fff" : '#000',
            fontFamily: 'Anaheim-Bold',
            fontSize: 20,
            textAlign: titleAlign,
            overflow: 'hidden',
            marginBottom: '3%'
        },
        body: {
            fontFamily: 'Anaheim-SemiBold',
            color: isDark ? "#fff" : '#000',
            fontSize: 14,
            overflow: 'hidden',
            textAlign: bodyAlign,
            marginBottom: '3%'
        },
        cancelBtntxt: {
            color: isDark ? '#999999' : '#000',
            fontFamily: 'Anaheim-Regular',
        },
        deleteBtn: {
            backgroundColor: type == 'alert' || type == 'conflict' ? isDark ? '#ff2525' : '#e00000' : alertColor || 'orange',
            paddingVertical: '1.5%',
            paddingHorizontal: '3%',
            borderRadius: borderRadius * 0.5,
            marginBottom: 5
        },
        deleteBtnTxt: {
            fontFamily: 'Anaheim-Regular',
            color: type == 'alert' || type == 'conflict' ? '#fff' : alertTextColor || '#000',
        }
    })

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                <Text style={styles.titletxt}>{title}</Text>
                <Text style={styles.body}>{body}</Text>

                {
                    needPassword && (
                        <View
                            style={{
                                backgroundColor: isDark ? '#666666dc' : '#dadadadc',
                                borderRadius: 8,
                                marginVertical: 6,
                                minWidth: '80%',
                                minHeight: '5%',
                                justifyContent: 'space-between',
                                flexDirection: 'row',
                            }}
                        >
                            <TextInput
                                style={{
                                    color: isDark ? '#fff' : '#000',
                                    width: '65%',
                                    fontFamily: 'Anaheim-SemiBold',
                                }}
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showpasswd}
                                placeholderTextColor={placeholdercolor}
                            />

                            <TouchableOpacity
                                onPress={() => setShowPasswd(!showpasswd)}
                            >
                                {showpasswd ? (
                                    <Entypo
                                        name="eye"
                                        size={20}
                                        color={placeholdercolor}
                                        style={{
                                            alignSelf: 'center',
                                            top: '22%',
                                            marginRight: '5%',
                                            justifyContent: 'center',
                                        }}
                                    />
                                ) : (
                                    <Entypo
                                        name="eye-with-line"
                                        size={20}
                                        color={placeholdercolor}
                                        style={{
                                            alignSelf: 'center',
                                            top: '22%',
                                            marginRight: '5%',
                                            justifyContent: 'center',
                                        }}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    )
                }

                <View style={{ flexDirection: 'row', gap: 13, justifyContent: actionButtonAlign, alignItems: 'center', marginTop: '3%' }}>
                    {
                        type == 'alert' || type == 'conflict' ?
                            <TouchableOpacity onPress={onCancel}>
                                <Text style={styles.cancelBtntxt}>Cancel</Text>
                            </TouchableOpacity>
                            : null
                    }
                    {
                        type == 'conflict' ?
                            <TouchableOpacity onPress={onExtraButton} style={[styles.deleteBtn, { backgroundColor: 'orange' }]}>
                                <Text style={[styles.deleteBtnTxt, { color: 'black' }]}>{'View Changes'}</Text>
                            </TouchableOpacity>
                            :
                            null
                    }
                    {
                        type == 'conflict' || type == 'alert' || type == 'info' ?
                            <TouchableOpacity
                                onPress={() => {
                                    if (needPassword) {
                                        onAlert(password);
                                        setPassword('');
                                    } else {
                                        onAlert();
                                    }
                                }}
                                style={styles.deleteBtn}
                            >
                                <Text style={styles.deleteBtnTxt}>{alertText}</Text>
                            </TouchableOpacity>
                            :
                            null
                    }
                </View>
            </Animated.View>
        </View>
    )
}

export default Alerts
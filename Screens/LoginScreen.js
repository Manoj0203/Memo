import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { Snackbar } from 'react-native-paper';
import Modal from 'react-native-modal';

import { useTheme } from '../utils/Theme'
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import { auth, db } from '../services/firebaseAuth';
import ForgotEmail from '../components/ForgotEmail';
import ForgotPassword from '../components/ForgotPassword';
import Alerts from '../components/Alerts';

import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {

	const { Colour, isDark, TEXT, TEXTINPUT, BUTTON } = useTheme();
	const icontheme = isDark ? '#fff' : '#000';

	const navi = useNavigation();

	const placeholdercolor = isDark ? '#acacacff' : '#7e7e7eff'

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showpasswd, setShowPasswd] = useState(false)

	const [forgotmodal, setForgotModal] = useState(false)
	const [currentforgot, setCurrentForgot] = useState('Email');
	const [invalid, setInValidSnackVisible] = useState(false);

	useEffect(() => {
		GoogleSignin.configure({
			webClientId: '264923450484-4l9a9sf530nq2brsq4p5ckj9v4v76q80.apps.googleusercontent.com'
		})
	}, [])

	async function onGoogleButtonPress() {
		try {
			await GoogleSignin.hasPlayServices({
				showPlayServicesUpdateDialog: true,
			});

			const result = await GoogleSignin.signIn();

			console.log(result);

			const idToken =
				result?.data?.idToken ||
				result?.idToken;

			if (!idToken) {
				throw new Error('Google Sign-In did not return an idToken');
			}

			const credential = GoogleAuthProvider.credential(idToken);

			const userCredential = await signInWithCredential(
				auth,
				credential
			);

			console.log('User UID:', userCredential.user.uid);
			console.log('User Email:', userCredential.user.email);

			return userCredential;
		} catch (error) {
			console.log('Google Sign-In Error:', error);
			Alert.alert(
				'Google Sign-In Failed',
				error.message || 'An unknown error occurred'
			);
		}
	}

	const sendVerificationEmail = async () => {
		await GoogleSignin.revokeAccess();
		await GoogleSignin.signOut();
	};

	const handleLogin = async () => {
		signInWithEmailAndPassword(auth, email, password)
			.then(async (userCredential) => {
				const user = userCredential.user;
				const docRef = doc(db, 'users', user.uid);
				const docSnap = await getDoc(docRef);
				if (docSnap.exists() && docSnap.data().authentication === true) {
					// navi.replace('Auth');
					return;
				}
				else {
					navi.replace('Tabs')
				}
			})
			.catch((error) => {
				console.log(`errorr: ${error}`)
				setInValidSnackVisible(true);
			})
	}

	const styles = StyleSheet.create({
		container: {
			backgroundColor: isDark ? "#252525" : '#fff',
			flex: 1,
			alignItems: 'center'
		},
		topNavigationButton: {
			alignItems: 'center',
			flexDirection: 'row',
			justifyContent: 'space-evenly',
			width: '75%',
			alignSelf: 'center',
			borderRadius: 10,
			height: 40,
			backgroundColor: isDark ? '#2f2f2f' : 'red',
			marginTop: 10
		},
		tabButton: {
			width: '50%',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%'
		}
	});

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				style={{ flex: 1, width: '100%' }}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={{ flex: 1 }}>
						<View style={{ padding: 12, flexDirection: 'row', alignSelf: 'flex-start' }}>
							<TouchableOpacity onPress={() => navi.goBack()}>
								<Feather name="arrow-left" size={24} color={icontheme} />
							</TouchableOpacity>
						</View>

						<View
							style={{
								flex: 1,
								alignItems: 'center',
								justifyContent: 'center',
								width: '80%',
								alignSelf: 'center',
							}}
						>
							<Image
								source={require('../assets/images/Memo.png')}
								style={{ width: 65, height: 65, marginBottom: '6%' }}
							/>

							<Text style={[TEXT.heading, { marginBottom: '10%' }]}>
								Login
							</Text>

							<TextInput
								placeholder="Email"
								placeholderTextColor={placeholdercolor}
								style={TEXTINPUT.txtinput}
								keyboardType="email-address"
								value={email}
								onChangeText={setEmail}
							/>

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

							<TouchableOpacity
								style={BUTTON.subbtn}
								onPress={handleLogin}
							>
								<Text style={BUTTON.subbtntxt}>Login</Text>
							</TouchableOpacity>

							<View style={{ flexDirection: 'row' }}>
								<Text
									style={{
										color: isDark ? '#fff' : '#000',
										marginTop: '6%',
										fontFamily: 'Anaheim-Regular',
										fontSize: 15,
									}}
								>
									New user?{' '}
								</Text>

								<TouchableOpacity
									style={{ marginTop: '5%' }}
									onPress={() => navi.replace('Signup')}
								>
									<Text
										style={{
											color: isDark ? '#06ec06ff' : '#00b300ff',
											fontFamily: 'Anaheim-Bold',
											fontSize: 15,
										}}
									>
										Sign up
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						<Snackbar
							visible={invalid}
							onDismiss={() => setInValidSnackVisible(false)}
							duration={3000}
							sidebg={{ backgroundColor: 'rgba(255, 38, 38, 0.75)' }}
							wrapperStyle={{ position: 'absolute' }}
							style={{ height: 'auto' }}
						>
							Invalid credentials!
						</Snackbar>
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, useColorScheme, View, Text, TouchableOpacity, Linking, Animated, Dimensions, } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { cancelallnoti } from './utils/notificationhandler';
import { versioncheck } from './utils/versioncheck';
import { useTheme } from './utils/Theme';

// Screens
import TabManagement from './Screens/TabManagement';
import PrivateNotes from './Screens/PrivateNotes';
import SettingsScreen from './Screens/SettingsScreen';
import FeedbackScreen from './Screens/FeedbackScreen';
import AddNotesScreen from './Screens/AddNotesScreen';
import AddTasksScreen from './Screens/AddTasksScreen';
import LoginScreen from './Screens/LoginScreen';
import SignupScreen from './Screens/signupstack/SignupScreen';
import SettingUp from './Screens/signupstack/SettingUp';
import AddCollabScreen from './Screens/AddCollabScreen';
import SecurityInfoScreen from './Screens/SecurityInfoScreen';

const Stack = createNativeStackNavigator();

const { width, height } = Dimensions.get('window');

export default function App() {

  const isDarkMode = useColorScheme() === 'dark';
  const { BUTTON } = useTheme();
  const [needupdate, setNeedUpdate] = useState(false);

  const FLOAT_COUNT = 12;

  const floatingAnimations = useRef(
    Array.from(
      { length: FLOAT_COUNT },
      () => new Animated.Value(0),
    ),
  ).current;

  const floatingPositions = useRef(
    Array.from({ length: FLOAT_COUNT }, () => ({
      left: Math.random() * width,
      size: 25 + Math.random() * 35,
      opacity: 0.05 + Math.random() * 0.15,
      rotate: `${Math.random() * 360}deg`,
      duration: 7000 + Math.random() * 5000,
    })),
  ).current;

  useEffect(() => {

    floatingAnimations.forEach(
      (anim, index) => {

        Animated.loop(

          Animated.sequence([

            Animated.timing(anim, {
              toValue: 1,
              duration:
                floatingPositions[index]
                  .duration,
              useNativeDriver: true,
            }),

            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),

          ]),

        ).start();
      },
    );

  }, []);

  useEffect(() => {
    const unsubscribeForeground =
      notifee.onForegroundEvent(
        ({ type, detail }) => {
          if (type === EventType.PRESS) {
            console.log('Notification pressed:', detail.notification,);
          }
        },
      );

    async function checkInitialNotification() {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        console.log('Notification when closed:', initialNotification.notification,);
      }
    }

    checkInitialNotification();
    cancelallnoti();
    return () => {
      unsubscribeForeground();
    };
  }, []);

  useEffect(() => {
    async function checkVersion() {
      const updateRequired = await versioncheck();
      setNeedUpdate(updateRequired);
    }

    checkVersion();
  }, []);

  useEffect(() => {
    SystemNavigationBar.setNavigationColor(isDarkMode ? '#252525' : '#fff',);
    SystemNavigationBar.fullScreen(false);
    SystemNavigationBar.setBarMode(isDarkMode ? 'light' : 'dark',);
  }, [isDarkMode]);

  const openlink = () => {

    Linking.openURL(
      'https://play.google.com/store/apps/details?id=com.develax.memo',
    );
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false, }}>
            <Stack.Screen name="Tabs" component={TabManagement} />
            <Stack.Screen name="PrivateNotes" component={PrivateNotes} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="AddNotes" component={AddNotesScreen} />
            <Stack.Screen name="AddTasks" component={AddTasksScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="SettingUp" component={SettingUp} />
            <Stack.Screen name="AddCollabScreen" component={AddCollabScreen} />
            <Stack.Screen name="SecurityInfoScreen" component={SecurityInfoScreen} />
          </Stack.Navigator>

          {needupdate && (

            <View style={[styles.overlayContainer, { backgroundColor: isDarkMode ? '#252525' : '#fff', },]}>

              {/* Floating Logos */}

              {floatingAnimations.map(
                (anim, index) => {

                  const translateY =
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        -150,
                        height + 150,
                      ],
                    });

                  const translateX =
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        -150,
                        height + 150,
                      ],
                    });

                  return (

                    <Animated.Image
                      key={index}

                      source={require('./assets/images/Memo.png')}

                      style={{
                        position: 'absolute',

                        width:
                          floatingPositions[index]
                            .size,

                        height:
                          floatingPositions[index]
                            .size,

                        left:
                          floatingPositions[index]
                            .left,

                        top:
                          floatingPositions[index]
                            .top,

                        opacity:
                          floatingPositions[index]
                            .opacity + 0.2,

                        transform: [
                          {
                            rotate:
                              floatingPositions[index]
                                .rotate,
                          },
                          {
                            translateY,
                          },
                          {
                            translateX
                          },
                        ],
                      }}
                    />
                  );
                },
              )}

              {/* Main Content */}

              <Text style={[
                styles.heading,
                {
                  color:
                    isDarkMode
                      ? '#fff'
                      : '#000',
                },
              ]}>
                Good News!
              </Text>

              <Text style={[
                styles.subheading,
                {
                  color:
                    isDarkMode
                      ? '#fff'
                      : '#000',
                },
              ]}>
                New version of MEMO is
                available now
              </Text>

              <TouchableOpacity
                style={[
                  BUTTON.subbtn,
                  {
                    borderColor: 'orange',
                    width: '45%',
                    marginTop: '5%',
                    paddingVertical: 7,
                  },
                ]}
                onPress={openlink}>

                <Text style={BUTTON.subbtntxt}>
                  Update
                </Text>

              </TouchableOpacity>

            </View>
          )}

        </NavigationContainer>

      </PaperProvider>

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  overlayContainer: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 9999,
    elevation: 9999,

    justifyContent: 'center',
    alignItems: 'center',

    overflow: 'hidden',

    padding: 20,
  },

  heading: {
    fontSize: 30,
    fontFamily: 'Anaheim-Bold',
  },

  subheading: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Anaheim-SemiBold',
  },

});
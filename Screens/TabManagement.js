import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Screens
import Notes from "./Notes";
import Tasks from "./Tasks";

// Icons
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export default function TabManagement() {
    const isDark = useColorScheme() === 'dark';
    const bgColor = isDark ? "#252525" : '#ffffff';

    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator 
            initialRouteName="Notes" 
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: 'orange',
                tabBarInactiveTintColor: '#7e7e7e',
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 16,
                    fontFamily: 'impact',
                    marginBottom: 5,
                },
                tabBarStyle: {
                    backgroundColor: bgColor, 
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    borderTopWidth: 0,
                    elevation: 0,
                },
                tabBarIcon: ({ color, size }) => {
                    if (route.name === "Notes") {
                        return <MaterialIcons
                                name={'notes'}
                                size={24}
                                color={color}
                            />;
                    } else if (route.name === 'Tasks') {
                        return <FontAwesome5 name="tasks" size={22} color={color} />;
                    }
                },
            })}
        >
            <Tab.Screen name="Notes" component={Notes} />
            <Tab.Screen name="Tasks" component={Tasks} />
        </Tab.Navigator>
    );
}
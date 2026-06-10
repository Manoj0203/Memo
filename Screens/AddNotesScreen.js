import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView, KeyboardAvoidingView,
    Platform, useColorScheme, Share, Image, useWindowDimensions,
    PermissionsAndroid, BackHandler,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { TextInput, FAB } from 'react-native-paper';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { startListening, stopListening, addEventListener } from '@ascendtis/react-native-voice-to-text';

// Vector Icon Imports
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Notes';

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
        noteImageUri,
        noteImageHeight,
        noteImageWidth,
    } = route.params || {};

    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark ? '#fff' : '#000';

    const scrollViewRef = useRef(null);
    const { width: screenWidth } = useWindowDimensions();

    const [noteId] = useState(existingId || Date.now().toString());
    const [added_date] = useState(mode === 'edit' ? noteDate : curDate);
    const [title, setTitle] = useState(mode === 'edit' ? noteTitle === 'No Title' ? '' : noteTitle : '');
    const [notes, setNotes] = useState(mode === 'edit' ? noteContent==='No Notes' ? '' : noteContent : '');
    const [imageUri, setImageUri] = useState(mode === 'edit' ? noteImageUri || null : null);
    const [dumimageUri, setDumImageUri] = useState(null);
    const [imageheight, setImageHeight] = useState(mode === 'edit' ? noteImageHeight || 0 : 0);
    const [imagewidth, setImageWidth] = useState(mode === 'edit' ? noteImageWidth || 1 : 1);
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        const backAction = () => {
            handleSaveAndGoBack();
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [title, notes, imageUri]);

    useEffect(() => {
        const startEventListener = addEventListener('onSpeechStart', () => setIsListening(true));
        const endEventListener = addEventListener('onSpeechEnd', () => setIsListening(false));
        const resultEventListener = addEventListener('onSpeechResults', (e) => {
            setNotes(prev => prev + ' ' + e.value);
        });
        const errorEventListener = addEventListener('onSpeechError', () => setIsListening(false));

        return () => {
            startEventListener.remove();
            endEventListener.remove();
            resultEventListener.remove();
            errorEventListener.remove();
        };
    }, []);

    const loadNotes = async () => {
        try {
            const storedNotes = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
            if (storedNotes !== null) return JSON.parse(storedNotes);
            return [];
        } catch (e) {
            console.log(e);
            return [];
        }
    };

    const saveNotes = async (noti) => {
        try {
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(noti));
        } catch (e) {
            console.log(e);
        }
    };

    const handleSaveAndGoBack = async () => {
        if (mode === 'add') {
            await addNote();
        } else {
            await editNote();
        }
        navi.goBack();
    };

    const addNote = async () => {
        if (notes.trim() === '' && title.trim() === '' && imageUri === null) return;

        const curNotes = await loadNotes();
        let permanentImageUri = null;
        const id = noteId;

        if (imageUri) {
            const fileName = `${id}_image.jpg`;
            const IMAGE_DIR = `${RNFS.DocumentDirectoryPath}/memo_images`;
            permanentImageUri = `${IMAGE_DIR}/${fileName}`;
            try {
                await RNFS.mkdir(IMAGE_DIR);
                await RNFS.copyFile(imageUri, permanentImageUri);
            } catch (error) {
                console.error('RNFS Error moving file:', error);
                permanentImageUri = null;
            }
        }

        const newNote = {
            _id: id,
            _title: title || 'No Title',
            _notes: notes || 'No Notes',
            _addeddate: added_date,
            _ispinned: 'No',
            _imageuri: permanentImageUri,
            _imagewidth: imagewidth,
            _imageheight: imageheight,
        };

        await saveNotes([newNote, ...curNotes]);
    };

    const editNote = async () => {
        const curNotes = await loadNotes();

        if (title.trim() === '' && notes.trim() === '' && imageUri === null) {
            const filtered = curNotes.filter(item => item._id !== noteId);
            await saveNotes(filtered);
            return;
        }

        if (dumimageUri && imageUri === null) {
            try {
                await RNFS.unlink(dumimageUri);
            } catch (error) {
                console.error('RNFS Error unlinking old image:', error);
            }
        }

        const updated = curNotes.map(item => {
            if (item._id === noteId) {
                return {
                    ...item,
                    _title: title || 'No Title',
                    _notes: notes || 'No Notes',
                    _imageuri: imageUri,
                    _imageheight: imageheight,
                    _imagewidth: imagewidth,
                };
            }
            return item;
        });

        await saveNotes(updated);
    };

    const handleShare = () => {
        Share.share({ message: `${title}\n${notes}` });
    };

    const handleImageSelection = async () => {
        try {
            const image = await ImagePicker.openPicker({
                compressImageQuality: 0.8,
                compressImageMaxHeight: 1200,
                compressImageMaxWidth: 1200,
                cropping: false,
                mediaType: 'photo',
            });
            setImageUri(image.path);
            setImageHeight(image.height);
            setImageWidth(image.width);
        } catch (error) {
            if (!(error.code === 'E_PICKER_CANCELLED' || (error.message && (error.message.includes('cancel') || error.message.includes('Cancel'))))) {
                console.log(error);
            }
        }
    };

    const handleCameraImageSelection = async () => {
        try {
            const image = await ImagePicker.openCamera({
                compressImageQuality: 0.8,
                compressImageMaxHeight: 1200,
                compressImageMaxWidth: 1200,
                cropping: false,
                mediaType: 'photo',
            });
            setImageUri(image.path);
            setImageHeight(image.height);
            setImageWidth(image.width);
        } catch (error) {
            if (!(error.code === 'E_PICKER_CANCELLED' || (error.message && (error.message.includes('cancel') || error.message.includes('Cancel'))))) {
                console.log(error);
            }
        }
    };

    const perMissionMic = async () => {
        if (Platform.OS !== 'android') return true;
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Microphone Access Required',
                    message: 'Memo needs access to your microphone so you can dictate notes.',
                    buttonPositive: 'Allow',
                    buttonNegative: 'Deny',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (e) {
            return false;
        }
    };

    const toggleListening = async () => {
        try {
            if (await perMissionMic()) {
                if (isListening) await stopListening();
                else await startListening();
            }
        } catch (e) {
            console.log(e);
        }
    };

    const styles = StyleSheet.create({
        titleEntry: {
            color: isDark ? '#fff' : '#000',
            fontSize: 25,
            fontFamily: 'Anaheim-Bold',
            backgroundColor: isDark ? '#252525' : '#fff',
        },
        dateText: {
            color: isDark ? 'gray' : '#000',
            marginLeft: 12,
            fontFamily: 'Anaheim-Regular',
            fontSize: 17,
        },
        notesEntry: {
            color: isDark ? '#fff' : '#000',
            fontFamily: 'Anaheim-Regular',
            height: '100%',
        },
        keyboardAvoidingContainer: {
            flex: 1,
        },
        scrollViewContent: {
            flexGrow: 1,
            paddingHorizontal: 15,
            paddingBottom: 75,
        },
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#252525' : '#fff' }}>
            <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={handleSaveAndGoBack}>
                    <Feather name="arrow-left" size={24} color={icontheme} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare}>
                    <Ionicons name="share-outline" size={24} color={icontheme} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    ref={scrollViewRef}
                    keyboardShouldPersistTaps='always'
                    decelerationRate="fast"
                    removeClippedSubviews={true}>

                    <TextInput
                        placeholder={"Title"}
                        placeholderTextColor={'gray'}
                        selectionColor='#ffb52cc5'
                        selectionHandleColor={'#ffb52cc5'}
                        underlineColor={isDark ? '#252525' : '#fff'}
                        activeUnderlineColor={isDark ? '#252525' : '#fff'}
                        value={title}
                        onChangeText={setTitle}
                        cursorColor={isDark ? '#abababff' : '#252525'}
                        style={styles.titleEntry}
                        contentStyle={{
                            fontSize: 25,
                            backgroundColor: isDark ? '#252525' : '#fff',
                            fontFamily: 'Anaheim-SemiBold',
                            color: isDark ? '#fff' : '#000',
                        }} />

                    <Text style={styles.dateText}>{added_date}</Text>

                    {imageUri && (
                        <View style={{ marginTop: 10 }}>
                            <Image
                                source={{ uri: mode === 'edit' ? `file://${imageUri}` : imageUri }}
                                style={{
                                    width: '100%',
                                    height: (imageheight / imagewidth) * screenWidth,
                                    alignSelf: 'center',
                                    borderRadius: 15,
                                }}
                                resizeMode='cover' />
                            <FAB
                                icon={'close'}
                                size={'small'}
                                color='#ff3333'
                                label=''
                                style={{ position: 'absolute', top: '2%', right: '3%', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                onPress={() => { setDumImageUri(imageUri); setImageUri(null); }} />
                        </View>
                    )}

                    <TextInput
                        placeholder={"Start Typing..."}
                        placeholderTextColor={'gray'}
                        selectionColor='#ffb52cc5'
                        selectionHandleColor={'#ffb52cc5'}
                        underlineColor={isDark ? '#252525' : '#fff'}
                        activeUnderlineColor={isDark ? '#252525' : '#fff'}
                        value={notes}
                        onChangeText={setNotes}
                        cursorColor={isDark ? '#abababff' : '#252525'}
                        multiline
                        style={styles.notesEntry}
                        contentStyle={{
                            fontSize: 18,
                            backgroundColor: isDark ? '#252525' : '#fff',
                            fontFamily: 'Anaheim-SemiBold',
                            marginLeft: -8,
                            color: isDark ? '#fff' : '#000',
                        }} />
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}>
                    <TouchableOpacity style={{ marginLeft: '5%' }} onPress={handleImageSelection}>
                        <FontAwesome name="picture-o" size={20} color={'orange'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: '5%' }} onPress={handleCameraImageSelection}>
                        <FontAwesome name="camera" size={20} color="orange" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: '5%' }} onPress={toggleListening}>
                        <FontAwesome
                            name={isListening ? 'microphone' : 'microphone-slash'}
                            size={20}
                            color={isListening ? 'orange' : '#ff3333'} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddNotesScreen;

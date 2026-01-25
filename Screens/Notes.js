import { FlatList, Linking, StyleSheet, Text, useColorScheme, View, Modal,
    Share, TouchableOpacity, Alert, KeyboardAvoidingView,
    ScrollView, Platform, useWindowDimensions, Image, PermissionsAndroid } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAB, Divider, Searchbar, Snackbar, TextInput } from 'react-native-paper';
import { format, } from 'date-fns';
import RNFS from 'react-native-fs';
import ImagePicker from "react-native-image-crop-picker";
import notifee from '@notifee/react-native'
import { startListening, stopListening, addEventListener } from '@ascendtis/react-native-voice-to-text'; 

// Vector Icon Imports
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export default function Notes() {
    const isDark = useColorScheme() === 'dark';
    const icontheme = isDark?'#fff':'#000';
    const ASYNC_STORAGE_KEY = 'ASYNC_STORAGE_KEY_NOTES_Notes'

    const [added_date, setAdded_Date] = useState()
    const [title, setTitle] = useState('')
    const [notes, setNotes] = useState('')
    const [allNotes, setAllNotes] = useState([])
    const [showNotes, setShowNotes] = useState([])
    const [searchQuery, setSearchQuery] = useState('');
    const [selected_id, setSelected_ID] = useState(0)
    const [selected_id_pinned, setSelected_ID_Pinned] = useState('');
    const [feedback, setFeedback] = useState('')
    const [isListening, setIsListening] = useState(false);

    const[isaddmodalvisible, setIsAddModalVisible] = useState(false)
    const[iseditmodalvisible, setIsEditModalVisible] = useState(false)
    const[isoptionmodalvisible, setIsOptionModalVisible] = useState(false)
    const[issettingsmodalvisible, setIsSettingsModalVisible] = useState(false)
    const[isfeedbackmodalvisible, setIsFeedbackModalVisible] = useState(false)
    // const[ispaintmodalvisible, setIsPaintModalVisible] = useState(false);
    const [Snack, setSnack] = useState(false);

    // DRAWING STATE VARIABLES
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState([]);
    const [drawingColor, setDrawingColor] = useState(isDark ? '#fff' : '#000'); // Theme-aware pen color
    const [eraseractive, setEraserActive] = useState(false);
    const [strokeWidth, setStrokeWidth] = useState(3);

    const scrollViewRef = useRef(null);
    const notesInputRef = useRef(null);

    // IMAGE
    const {width: screenWidth, height: screenHeight} = useWindowDimensions();
    const [imageUri, setImageUri] = useState(null);
    const [dumimageUri, setDumImageUri] = useState(null);
    const [imageheight, setImageHeight] = useState(0);
    const [imagewidth, setImageWidth] = useState(1);
    const IMAGE_DIR = `${RNFS.DocumentDirectoryPath}/my_images`;

    // const handleColorChange = (color) =>
    // {
    //     setEraserActive(false); 
    //     setDrawingColor(color);
    //     setStrokeWidth(3);
    // }

    // const handleToggleEraser = () => {
    //     const newEraserState = !eraseractive;
    //     setEraserActive(newEraserState);

    //     const backgroundColor = isDark ? '#252525' : '#fff';
    //     const penColor = isDark ? '#fff' : '#000'; 

    //     if (newEraserState) {
    //         setDrawingColor(backgroundColor);
    //         setStrokeWidth(10);
    //     } else {
    //         setDrawingColor(penColor);
    //         setStrokeWidth(3);
    //     }
    // };


    useEffect(() => {
        getNotes();
    },[isaddmodalvisible, iseditmodalvisible, isoptionmodalvisible, issettingsmodalvisible])

useEffect(() => {
    // 1. Start with a copy of allNotes to avoid direct mutation
    let currentNotes = [...allNotes];

    // 2. Apply Search Filter
    if (searchQuery.trim()) {
        currentNotes = currentNotes.filter(note => {
            const lowercasedQuery = searchQuery.toLowerCase();
            const titleMatches = note._title?.toLowerCase().includes(lowercasedQuery);
            // Consider adding contentMatches here if you want to search notes content too
            return titleMatches;
        });
    }

    // 3. Separate Pinned and Unpinned Notes
    const pinnedNotes = currentNotes.filter(note => note._ispinned === 'Yes');
    const unpinnedNotes = currentNotes.filter(note => note._ispinned !== 'Yes');

    // 4. Combine Pinned first, then Unpinned
    const sortedAndFilteredNotes = [...pinnedNotes, ...unpinnedNotes];

    // 5. Update the state that FlatList renders
    setShowNotes(sortedAndFilteredNotes);
}, [allNotes, searchQuery]); // Re-run this effect when allNotes or searchQuery changes

    const loadNotes = async() =>
    {
        try
        {
            const storedNotes = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)
            if(storedNotes !== null)
            {
                const notes = JSON.parse(storedNotes)
                return notes
            }
            else
            {
                return []
            }
        }
        catch(e)
        {
            console.log(e)
            return []
        }
    }

    const getNotes = async() =>
    {
        const curNotes = await loadNotes();

        if(curNotes.length === 0)
        {
            setAllNotes([])
            setShowNotes([])
            return 0;
        }
        else
        {
            setAllNotes(curNotes)
            setShowNotes(curNotes)
            curNotes.forEach((item, index) => {
                {/*console.log(item?._title)*/}
            });
        }
    }

    const saveNotes = async(noti) =>
    {
        try
        {
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(noti))
        }
        catch(e)
        {
            console.log(e)
        }
    }

    const addNotes = async() =>
    {
        // if(notes.trim()==='')
        // {
        //     if(notes.trim()==='')
        //     {
        //         return 0;
        //     }
        //     Alert.alert("Memo", "Enter Title and notes")
        //     setIsAddModalVisible(true);
        //     return 0;
        // }
        if(notes.trim() === '' && title.trim() === '' && imageUri === null)
        {
            setIsAddModalVisible(false);
            return 0;
        }

        const curNotes = await loadNotes();
        let permanentImageUri = null;
        const noteId = Date.now().toString();

        if (imageUri) {
            const tempPath = imageUri;
            const fileName = `${noteId}_image.jpg`;
            // Define the permanent directory and path
            const IMAGE_DIR = `${RNFS.DocumentDirectoryPath}/memo_images`;
            permanentImageUri = `${IMAGE_DIR}/${fileName}`;
            console.log('Permanent Image URI:', permanentImageUri);

            try {
                await RNFS.mkdir(IMAGE_DIR);
                await RNFS.copyFile(tempPath, permanentImageUri);
            } catch (error) {
                console.error("RNFS Error moving file:", error);
                permanentImageUri = null;
            }
        }

        const newNotes = {
            _id:noteId,
            _title:title,
            _notes:notes,
            _addeddate:added_date,
            _ispinned:'No',
            _imageuri: permanentImageUri,
            _imagewidth: imagewidth, 
            _imageheight: imageheight,
        }

        const updateNotes = [newNotes, ...curNotes]
        await saveNotes(updateNotes)
        setAllNotes(updateNotes)
        
        setTitle('');
        setNotes('');
        setCurrentPath([]);
        setPaths([]);
        setImageUri(null);
        setImageHeight(0); setImageWidth(1);

        setSnack(true);
    }

    const handleShare = () =>
    {
        const msg = `${title}\n${notes}`
        const handlesharemsg = Share.share({message:msg})
    }
    
    const handlePin = async () => {
    if (selected_id === 0) {
        console.warn("No note selected for pinning.");
        return;
    }

    // Find the note that was selected for options
    const selectedNote = allNotes.find(item => item._id === selected_id);
    if (!selectedNote) {
        console.warn("Selected note not found.");
        setIsOptionModalVisible(false);
        return;
    }

    // Create a NEW array with the updated note (IMMUTABILITY!)
    const updatedAllNotes = allNotes.map(item => {
        if (item._id === selected_id) {
            return {
                ...item, // Copy all existing properties
                _ispinned: item._ispinned === 'No' ? 'Yes' : 'No' // Toggle pin status
            };
        }
        return item; // Return unchanged items as they are
    });

    await saveNotes(updatedAllNotes);
    setAllNotes(updatedAllNotes);
    setIsOptionModalVisible(false);
};

    const gettxt =(note) =>
    {
        if(note.includes('\n') || note.includes('\r'))
        {
            const dum = note.split(/[\r\n]+/)
            if(dum[0].length>44)
            {
                return dum[0].slice(0,44)+'...'
            }
            else
            {
                return dum[0]+'...'
            }
        }
        else
        {
            if(note.length>44)
            {
                return note
                //return note.slice(0,44)+'...'
            }
            else
            {
                return note
            }
        }
    } 
    
    const handleEdit =(id, tit, not, adddate, image, height, width) =>
    {
        setIsEditModalVisible(true)
        setSelected_ID(id)
        setTitle(tit)
        setNotes(not)
        setAdded_Date(adddate)
        setImageUri(image);
        setImageHeight(height); setImageWidth(width)
    }

    const editNotes =async() =>
    {
        if(title.trim()==='' && notes.trim()==='' && imageUri === null)
        {
            const afterDeleteNotes = showNotes.filter(item => item._id !== selected_id);
            setIsEditModalVisible(false);
            setTitle('')
            setNotes('')            
            await saveNotes(afterDeleteNotes);
            return 0;
        }
        if (dumimageUri && imageUri === null) {
            try {
                await RNFS.unlink(dumimageUri);
                console.log(`Successfully deleted old image: ${dumimageUri}`);
            } catch (error) {
                console.error("RNFS Error unlinking old image:", error);
            }
        }
        showNotes.map((item, index) => 
        {
            if(item._id === selected_id)
            {
                item._title = title;
                item._notes = notes;
                item._imageuri = imageUri;
                item._imageheight = imageheight;
                item._imagewidth = imagewidth;
            }
        });
        
        setIsEditModalVisible(false);
        setTitle('')
        setNotes('')
        setImageUri(null);
        setDumImageUri(null);
        setImageHeight(0); setImageWidth(1);
        await saveNotes(showNotes)
    }

    const handleAddNotes =() =>
    {
        setIsAddModalVisible(false);
        addNotes();
    }

    const handleOption =(id, pinned, imageuri) =>
    {
        setIsOptionModalVisible(true)
        setSelected_ID(id);
        setSelected_ID_Pinned(pinned);
        setImageUri(imageuri)
    }

    const handleDelete = async() =>
    {
        const afterDeleteNotes = showNotes.filter(item => item._id !== selected_id)
        const deleteimage = imageUri;
        if(deleteimage)
        {
            try {
                await RNFS.unlink(deleteimage);
                console.log(`Successfully deleted image: ${imagePathToDelete}`);
            } catch (error) {
                
            }
        }
        setIsOptionModalVisible(false)
        await saveNotes(afterDeleteNotes)
    }

    const deleteall = async() =>
    {
        await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
    }

    const deleteAllData_notes =async() =>
    {
        Alert.alert('Waring', 'It clears all Notes.\nThis process cannot be reversed.', [{
            text:'Confirm',
            onPress:() => deleteall(),
            style:'destructive'
        },{
            text:'Cancel',
            onPress:null
        }
        ])
        
    }

    const openWhatsApp = async (message = '') =>
    {
        const phoneNumber = '918438582007';
        if(feedback==='')
        {
            Alert.alert('Error', 'Enter the feedback')
            return 0;
        }
        const msg =encodeURIComponent(feedback)
    
        let whatsappURL = `https://wa.me/${phoneNumber}?text=${msg}`;
        try
        {
            setFeedback('')
            await Linking.openURL(whatsappURL);
        }
        catch (error)
        {
            console.error('Error opening WhatsApp:', error);
            Alert.alert('Error', 'An unexpected error occurred while trying to open WhatsApp.');
        }
    };
    
    const openEmail = async(message='')=>
    {
        const email = 'nmanoj0212@gmail.com';
        if(feedback==='')
        {
            Alert.alert('Error', 'Enter the feedback')
            return 0;
        }
        const msg =encodeURIComponent(feedback)
        let url = `mailto:${email}?subject=${encodeURIComponent('Feedback for app MEMO')}&body=${encodeURIComponent(msg)}`

        try
        {
            setFeedback('')
            await Linking.openURL(url);
        }
        catch (error)
        {
            console.error('Error opening WhatsApp:', error);
            Alert.alert('Error', 'An unexpected error occurred while trying to open WhatsApp.');
        }
    }

    const onTouchEnd =() =>
    {
        if (currentPath.length > 0) {
        const newPathObject = {
            d: currentPath,
            color: drawingColor,
            width: strokeWidth,
        };
        setPaths(prevPaths => [...prevPaths, newPathObject]);
    }
    setCurrentPath([]);
    }

    const onTouchMove =(event) =>
    {
        const newPath = [...currentPath];
        const locationX = event.nativeEvent.locationX;
        const locationY = event.nativeEvent.locationY;

        const newPoint = `${newPath.length === 0? 'M': ''} ${locationX.toFixed(0)},${locationY.toFixed(0)}`;
        newPath.push(newPoint);
        setCurrentPath(newPath);
    }

    const handleclearPaint =() =>
    {
        setCurrentPath([])
        setPaths([])
    }

    const handleImageSelection = async () =>
    {
        try
        {
            const image = await ImagePicker.openPicker({
                    compressImageQuality:0.8,
                    compressImageMaxHeight: 1200,
                    compressImageMaxWidth:1200,
                    cropping: false,
                    cropperCircleOverlay: false, 
                    freeStyleCropEnabled: false,
                    cropperToolbarTitle: 'Image',
                    mediaType: 'photo',
                });
            setImageUri(image.path);
            setImageHeight(image.height);
            setImageWidth(image.width);
        }
        catch (error)
        {
            if (error.code === 'E_PICKER_CANCELLED' || error.message.includes('cancel') || error.message.includes('Cancel'))
            {
                if(imageUri !== null)
                {
                    console.log('present')
                    return;
                }
            }
        }
    }

    const handleCameraImageSelection = async () =>
    {
        try
        {
            const image = await ImagePicker.openCamera({
                    compressImageQuality:0.8,
                    compressImageMaxHeight: 1200,
                    compressImageMaxWidth:1200,
                    cropping: false,
                    cropperCircleOverlay: false, 
                    freeStyleCropEnabled: false,
                    cropperToolbarTitle: 'Image',
                    mediaType: 'photo',
                });
            setImageUri(image.path);
            setImageHeight(image.height);
            setImageWidth(image.width);
        }
        catch (error)
        {
            if (error.code === 'E_PICKER_CANCELLED' || error.message.includes('cancel') || error.message.includes('Cancel'))
            {
                if(imageUri !== null)
                {
                    console.log('present')
                    return;
                }
            }
        }
    }

    useEffect(() =>
    {
        const startEventListener = addEventListener('onSpeechStart', () => {
            setIsListening(true);
        });

        const endEventListener = addEventListener('onSpeechEnd', () => {
            setIsListening(false);
        });

        const resultEventListener = addEventListener('onSpeechResults', (e) => {
            console.log(e.value)
            setNotes(prevNotes => prevNotes + " " + e.value);
        });

        const errorEventListener = addEventListener('onSpeechError', (e) => {
            console.log("Speech Error: ", e);
            setIsListening(false); 
        });

        return () => {
            startEventListener.remove();
            endEventListener.remove();
            resultEventListener.remove();
            errorEventListener.remove();
        };
    },[])

    const perMissionMic = async () =>
    {
        if(Platform.OS !== 'android')
        {
            return true;
        }
        try
        {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title:'Microphone access required',
                    message:'This feature requires microphone access',
                    buttonPositive:'Allow',
                    buttonNegative:'Deny'
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        catch(e)
        {
            console.log('Denied access')
            return false;
        }
    }

    const toggleListening = async () =>
    {
        try
        {
            if(await perMissionMic())
            {
                if(isListening)
                {
                    await stopListening();
                }
                else
                {
                    await startListening();
                }
            }
        }
        catch(e)
        {
            console.log(e)
        }
    }

    const renderNotes =({item, index}) =>
    {
        return (
        <View style={styles.listcontainer}>
            <TouchableOpacity style={styles.listbtn} onLongPress={() => handleOption(item?._id, item?._ispinned, item?._imageuri)} onPress={() => handleEdit(item?._id, item?._title, item?._notes, item?._addeddate, item?._imageuri, item?._imageheight, item?._imagewidth)} >
                <View style={{ flexDirection: 'row', marginHorizontal: 10, alignItems: 'center', justifyContent:'space-between' }}>
                    <Text style={styles.listheading}>{item?._title}</Text>
                    {item?._ispinned === 'Yes' && (
                        <Entypo name="pin" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                    )}
                </View>
                <View style={{ flexDirection: 'row', marginRight: 10, alignItems: 'center', justifyContent:'space-between' }}>
                    <Text style={styles.listdate}>{item?._addeddate}</Text>
                    {item?._imageuri !== null && (
                        <FontAwesome name="picture-o" size={18} color={'orange'} style={{ marginLeft: 5 }} />
                    )}
                </View>
                
                <Text style={styles.listnote} numberOfLines={3}>{gettxt(item?._notes)}</Text>
            </TouchableOpacity>
        </View>
    );
    }

    const styles = StyleSheet.create({
        container:
        {
            flex:1,
            backgroundColor:isDark?'#252525':'#fff'
        },
        Searchbar:
        {
            backgroundColor:isDark?'#151515':'#E6E6E6',
            width:'93%',
            borderRadius:15,
            height:45,
            marginBottom:10,
        },
        TabTitile:
        {
            color:isDark?"#fff":'#000',
            fontSize:35,
            fontFamily:'impact',
            marginLeft:15,
            marginBottom:10
        },
        fab:
        {
            position: 'absolute',
            margin: 16,
            right:'5%',
            bottom:'0%',
            backgroundColor: isDark ? 'orange' : 'orange',
        },
        titleEntry:
        {
            color:isDark?'#fff':'#000',
            fontSize:25,
            fontFamily:'Anaheim-Bold',
            backgroundColor: isDark?'#252525':'#fff',

        },
        dateText:
        {
            color:isDark?'gray':'#000',
            marginLeft:12,
            fontFamily:'Anaheim-Regular',
            fontSize:17
        },
        notesEntry:
        {
            color:isDark?'#fff':'#000',
            fontFamily:'Anaheim-Regular',
            height:'100%'      
        },
        keyboardAvoidingContainer:
        {
            flex: 1,
        },
        scrollViewContent:
        {
            flexGrow: 1,
            paddingHorizontal: 15,
            paddingBottom: 75,
        },
        listcontainer:
        {   
            alignItems:'center',
        },
        listbtn:
        {
            backgroundColor:isDark?"#151515":'#E6E6E6',
            // height:'auto',
            marginBottom:10,
            borderRadius:10,
            width:'95%'
        },
        listheading:
        {
            fontFamily:'Anaheim-Bold',
            fontSize:25,
            marginBottom:7,
            color:isDark?'#fff':'#000'
        },
        listdate:
        {
            fontFamily:'Anaheim-SemiBold',
            fontSize:17,
            marginLeft:10,
            marginBottom:7,
            color:isDark?'gray':'#858383'
        },
        listnote:
        {
            fontFamily:'Anaheim-SemiBold',
            fontSize:17,
            marginLeft:10,
            marginBottom:'5%',
            color:isDark?'#fff':'#000'
        },
        modalView:
        {
            margin: 0,
            backgroundColor: isDark?'#252525':'#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius:20,
            padding: 0,
            shadowColor: '#000',
            shadowOffset: {
            width: 0,
            height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            height:230,
            maxHeight: '75%',
            width: '99%',
        },
        centeredView:
        {
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'center',
            backgroundColor:'rgba(107, 107, 107, 0.4)'
        },
        ModalIcons:
        {
            marginLeft:10,
            color:isDark?'#C6C6C6':'#000'
        },
        
        subtitle:
        {
            marginLeft:17,
            color:isDark?"#C4BFBF":"fff", 
            fontFamily:'Anaheim-Bold',
            fontSize:18
        },
        settingsbtn:
        {
            backgroundColor: isDark?'#151515':'#E6E6E6',
            width:'100%',
            flexDirection:'row',
            justifyContent:'space-between',
            borderRadius:15,
        },
        settingtext:
        {
            marginTop:7,
            color:isDark?'#fff':'#000',
            fontFamily:'Anaheim-SemiBold',
            fontSize:20,
            marginLeft:15,
        },
        TabTitle:
        {
            color:isDark?"#fff":'#000',
            fontSize:35,
            fontFamily:'impact',
            marginLeft:15,
            marginBottom:10
        },
        feedbackentry:
        {
            marginHorizontal:15,
            minHeight:255,
            backgroundColor:'#252525',
        },
        })

  return (
    <View style={styles.container}>
        <View style={{alignItems:'flex-end', marginRight:15, marginTop:10}}>
            <TouchableOpacity onPress={() => setIsSettingsModalVisible(true)}>
                <MaterialIcons name="settings" size={24} color={isDark?"#fff":'#000'} />
            </TouchableOpacity>
        </View>
        <Text style={styles.TabTitile} >Notes</Text>
        <View style={{alignItems:'center'}}>
            <Searchbar
            placeholder='Search Notes'
            placeholderTextColor={isDark?'#e6e6e6aa':'gray'}
            inputStyle={{marginTop:-7 , fontSize:17, fontFamily:'Anaheim-SemiBold', color:icontheme}}
            style={styles.Searchbar}
            onChangeText={setSearchQuery}
            value={searchQuery}
            iconColor={isDark?'gray':'#5B5B5B'}
            clearButtonMode='always' />
        </View>

        <FlatList 
            style={{paddingBottom:0}}
            data={showNotes}
            showsVerticalScrollIndicator={false}
            renderItem={renderNotes}
            keyboardDismissMode='on-drag'
            ListEmptyComponent={() => (
                        <View style={{flex:1, alignItems:'center', marginTop:'65%'}}>
                            <Text style={{ color: isDark ? '#aaa' : '#888', fontSize: 17, fontFamily:'Anaheim-Bold' }}>
                                {searchQuery ? 'No matching results' : "Press '+' to add notes"}
                            </Text>
                        </View>
                    )} />

        <FAB icon={'plus'} style={styles.fab} color='#fff' onPress={() => {setIsAddModalVisible(true); setAdded_Date(format(new Date(), 'dd-MMM-yyyy     hh:mm aa'))}} />


        <Snackbar visible={Snack}
            duration={1500}
            onDismiss={() => setSnack(false)}
            style={{borderRadius:15, bottom:'0%'}}
            onclick={() => setSnack(false)} // Added this line custom in Snackbar.tsx
            onTouchCancel={() => setSnack(false)} >
                Notes Added
        </Snackbar>

        {/* ADD MODAL */}
        <Modal visible={isaddmodalvisible}
        onRequestClose={handleAddNotes}
        animationType='slide' >

            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={handleAddNotes}>
                        <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView style={styles.keyboardAvoidingContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView contentContainerStyle={styles.scrollViewContent}
                        ref={scrollViewRef}
                        keyboardShouldPersistTaps='always'
                        decelerationRate="fast" 
                        removeClippedSubviews={true}>

                    <TextInput
                        placeholder={"Title"}
                        placeholderTextColor={'gray'}
                        selectionColor='#ffb52cc5'
                        selectionHandleColor={'#ffb52cc5'}
                        underlineColor={isDark?'#252525':"#fff"}
                        activeUnderlineColor={isDark?'#252525':"#fff"}
                        value={title}
                        onChangeText={(text) => setTitle(text)}
                        cursorColor={isDark?"#abababff": "#252525"}
                        style={styles.titleEntry}
                        contentStyle={{fontSize:25, backgroundColor: isDark?'#252525':'#fff', fontFamily:'Anaheim-SemiBold'}} />

                    <Text style={styles.dateText}>{added_date}</Text>
                    
                    {imageUri && (
                            <View style={{marginTop:10}}>
                                <Image 
                                    source={{uri:imageUri}}
                                    style={{width:'100%', height:(imageheight/imagewidth)*screenWidth, alignSelf:'center', borderRadius:15,}}
                                    resizeMode='cover' />
                                
                                <FAB icon={'close'} size={'small'} color='#ff3333' label='' style={{position:'absolute', top:'2%', right:'3%', backgroundColor:'rgba(0,0,0,0.6)', }} onPress={() => setImageUri(null)} />
                            </View>
                        )
                    }
                
                    <TextInput
                        placeholder={"Start Typing..."}
                        placeholderTextColor={'gray'}
                        selectionColor='#ffb52cc5'
                        selectionHandleColor={'#ffb52cc5'}
                        underlineColor={isDark?'#252525':"#fff"}
                        activeUnderlineColor={isDark?'#252525':"#fff"}
                        value={notes}
                        onChangeText={(text) => setNotes(text)}
                        cursorColor={isDark?"#abababff": "#252525"}
                        multiline
                        style={styles.notesEntry}
                        contentStyle={{fontSize:18, backgroundColor: isDark?'#252525':'#fff', fontFamily:'Anaheim-SemiBold', marginLeft:-8,}} />

                    </ScrollView>
                    <View style={{ flexDirection:'row', gap:10, paddingVertical:10}}>
                        {/* <TouchableOpacity style={{marginLeft:'5%'}} onPress={() => setIsPaintModalVisible(true)}>
                            <FontAwesome5 name="paint-brush" size={20} color={'orange'} style={{marginBottom:'3%', marginLeft:'5%'}} />
                        </TouchableOpacity> */}
                        <TouchableOpacity style={{marginLeft:'5%'}} onPress={handleImageSelection}>
                            <FontAwesome name="picture-o" size={20} color={'orange'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginLeft:'5%'}} onPress={handleCameraImageSelection}>
                            <FontAwesome name="camera" size={20} color="orange" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginLeft:'5%'}} onPress={toggleListening}>
                            <FontAwesome name={isListening ? 'microphone' : 'microphone-slash'} size={20} color={isListening ? 'orange' : '#ff3333'} />
                        </TouchableOpacity>
                    </View>      
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>

        {/* EDIT MODAL */}
        <Modal animationType='fade'
        visible={iseditmodalvisible}
        onRequestClose={() =>{
            editNotes();
        }}>
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => {
                                editNotes();
                            }}>
                        <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView style={styles.keyboardAvoidingContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView contentContainerStyle={styles.scrollViewContent}
                        ref={scrollViewRef}
                        keyboardShouldPersistTaps="always">
                    <TextInput
                        placeholder={"Title"}
                        placeholderTextColor={'gray'}
                        selectionColor='#ffb52cc5'
                        selectionHandleColor={'#ffb52cc5'}
                        underlineColor={isDark?'#252525':"#fff"}
                        activeUnderlineColor={isDark?'#252525':"#fff"}
                        value={title}
                        onChangeText={(text) => setTitle(text)}
                        cursorColor={isDark?"#abababff": "#252525"}
                        style={styles.titleEntry}
                        contentStyle={{fontSize:25, backgroundColor: isDark?'#252525':'#fff', fontFamily:'Anaheim-SemiBold'}} />

                    <Text style={styles.dateText}>{added_date}</Text>

                    {imageUri && (
                            <View style={{marginTop:10}}>
                                <Image 
                                    source={{uri:`file://${imageUri}`}}
                                    style={{width:'100%', height:(imageheight/imagewidth)*screenWidth, alignSelf:'center', borderRadius:15,}}
                                    resizeMode='cover' />

                                <FAB icon={'close'} size={'small'} color='#ff3333' label='' style={{position:'absolute', top:'2%', right:'3%', backgroundColor:'rgba(0,0,0,0.6)', }} onPress={() => {setDumImageUri(imageUri); setImageUri(null)}} />

                            </View>
                        )
                    }
                
                    <TextInput
                        placeholder={"Start Typing..."}
                        placeholderTextColor={'gray'}
                        selectionColor='#ffb52cc5'
                        selectionHandleColor={'#ffb52cc5'}
                        underlineColor={isDark?'#252525':"#fff"}
                        activeUnderlineColor={isDark?'#252525':"#fff"}
                        value={notes}
                        onChangeText={(text) => setNotes(text)}
                        cursorColor={isDark?"#abababff": "#252525"}
                        multiline
                        style={styles.notesEntry}
                        contentStyle={{fontSize:18, backgroundColor: isDark?'#252525':'#fff', fontFamily:'Anaheim-SemiBold', marginLeft:-8}} />

                    </ScrollView>
                    <View style={{ flexDirection:'row', gap:10, paddingVertical:10}}>
                        {/* <TouchableOpacity style={{marginLeft:'5%'}} onPress={() => setIsPaintModalVisible(true)}>
                            <FontAwesome5 name="paint-brush" size={20} color={'orange'} style={{marginBottom:'3%', marginLeft:'5%'}} />
                        </TouchableOpacity> */}
                        <TouchableOpacity style={{marginLeft:'5%'}} onPress={handleImageSelection}>
                            <FontAwesome name="picture-o" size={20} color={'orange'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginLeft:'5%'}} onPress={handleCameraImageSelection}>
                            <FontAwesome name="camera" size={20} color="orange" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginLeft:'5%'}} onPress={toggleListening}>
                            <FontAwesome name={isListening ? 'microphone' : 'microphone-slash'} size={20} color={isListening ? 'orange' : '#ff3333'} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>

        {/* OPTION MODAL */}
        <Modal style={{maxHeight:'50%'}}
        animationType='slide'
        transparent={true}
        visible={isoptionmodalvisible}
        onRequestClose={()=> {
            setIsOptionModalVisible(false)
        }}>
            <View style={styles.centeredView}>
                <TouchableOpacity style={{flex:1, paddingHorizontal:1454}} onPress={()=>setIsOptionModalVisible(false)}>
                </TouchableOpacity>
            <View style={styles.modalView}>
                <View style={{flexDirection:'row'}}>
                    <FontAwesome6 style={{margin:13}} name="arrow-left" size={20} color={icontheme} onPress={()=> setIsOptionModalVisible(false) } />
                </View>
                <Divider />
                <View style={styles.Modalbtn}>
                    <TouchableOpacity onPress={handlePin} style={{flexDirection:'row', marginTop: 20, width:175}}>
                        <Entypo style={[styles.ModalIcons, {marginTop:3}]} name="pin" size={20}  />
                        <Text style={{marginLeft:10, fontSize:18, fontFamily:'Anaheim-SemiBold', color:icontheme, marginTop:'-2.5%'}}>Pin/Unpin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={{flexDirection:'row', marginTop: 20, width:175}}>
                        <MaterialIcons style={styles.ModalIcons} name="delete" size={22} />
                        <Text style={{marginLeft:10, fontSize:18, fontFamily:'Anaheim-SemiBold', color:icontheme, marginTop:'-2.5%'}}>Delete</Text>
                    </TouchableOpacity>
                </View>                
            </View>
        </View>
        </Modal>

        {/* SETTINGS MODAL */}
        <Modal visible={issettingsmodalvisible}
        onRequestClose={() => {
            setIsSettingsModalVisible(false);
        }}
        animationType='slide' >
        
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
                        <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <View>
                    <Text style={styles.TabTitle}>MEMO</Text>
                </View>
                <View>
                    <Text style={styles.subtitle}>Delete</Text>
                    <View style={{alignItems:'center'}}>
                        <View style={{backgroundColor:isDark?'#151515':'#E6E6E6', alignItems:'center', marginTop:10, borderRadius:15, width:'90%'}}>
                            <TouchableOpacity onPress={deleteAllData_notes} style={[styles.settingsbtn, {paddingBottom:13}]}>
                                <Text style={styles.settingtext}>All Notes</Text>
                                <Entypo name="chevron-right" size={18} color={isDark?'gray':'#858383'} style={{marginTop:16, marginRight:15}} />
                            </TouchableOpacity>
                            {/*<TouchableOpacity onPress={deleteAllData} style={[styles.settingsbtn,{paddingBottom:10}]}>
                                <Text style={styles.settingtext}>All Data</Text>
                                <Entypo name="chevron-right" size={18} color={isDark?'gray':'#858383'} style={{marginTop:16, marginRight:15}} />
                            </TouchableOpacity>*/}
                        </View>
                    </View>
                </View>

                <View>
                    <Text style={[styles.subtitle, {marginTop:15}]}>Opinion</Text>
                    <View style={{alignItems:'center'}}>
                        <View style={{backgroundColor:isDark?'#151515':'#E6E6E6', alignItems:'center', marginTop:10, borderRadius:15, width:'90%', flexDirection:'row'}}>
                            <View style={{ width:'80%'}}>
                                <TouchableOpacity onPress={()=>setIsFeedbackModalVisible(true)} style={{paddingBottom:13,
                                    backgroundColor: isDark?'#151515':'#E6E6E6',
                                    width:'100%',
                                    flexDirection:'row',
                                    borderRadius:15}}>
                                <MaterialIcons name="feedback" size={23} color={isDark?'gray':'#858383'} style={{marginTop:16, marginLeft:10,}} />
                                <Text style={[styles.settingtext, {marginTop:10}]}>Feedback</Text>
                            </TouchableOpacity>
                            </View>
                            <View style={{width:'20%', alignItems:'flex-end', justifyContent:'center',}}>
                                <TouchableOpacity onPress={()=>setIsFeedbackModalVisible(true)}>
                                    <Entypo name="chevron-right" size={18} color={isDark?'gray':'#858383'} style={{marginRight:15}} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>

        {/* FEEDBACK MODAL */}
        <Modal visible={isfeedbackmodalvisible}
        onRequestClose={() => {
            setIsFeedbackModalVisible(false);
        }}
        animationType='slide' >
        
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff',}}>
                <View style={{padding:12, flexDirection:'row', justifyContent:'space-between'}}>
                    <TouchableOpacity onPress={() => setIsFeedbackModalVisible(false)}>
                        <Feather name="arrow-left" size={24} color={icontheme} />
                    </TouchableOpacity>
                </View>
                <View>
                    <Text style={styles.TabTitle}>Feedback</Text>
                </View>
                <TextInput placeholder={"Enter Feedback..."}
                    placeholderTextColor={'gray'}
                    selectionColor='#ffb52cc5'
                    selectionHandleColor={'#ffb52cc5'}
                    underlineColor={'transparent'}
                    activeUnderlineColor={'transparent'}
                    value={feedback}
                    onChangeText={(text) => {setFeedback(text); console.log(feedback);}}
                    cursorColor={isDark?"#abababff": "#252525"}
                    multiline
                    style={styles.feedbackentry}
                    contentStyle={{ backgroundColor: isDark?'#151515':'#E6E6E6', fontFamily:'Anaheim-SemiBold', borderRadius:12}}
                    />
                <View style={{alignItems:'center'}}>
                    <View style={{backgroundColor:isDark?'#151515':'#E6E6E6', alignItems:'center', marginTop:15, borderRadius:15, width:'92%'}}>
                        <TouchableOpacity onPress={openEmail} style={{paddingBottom:10,
                        backgroundColor: isDark?'#151515':'#E6E6E6',
                        width:'100%',
                        flexDirection:'row',
                        justifyContent:"center",
                        borderRadius:15}}>
                            <Ionicons name="send" size={22} color="orange" style={{marginTop:13, marginLeft:10}} />
                            <Text style={styles.settingtext}>Send Feedback</Text>
                        </TouchableOpacity>
                    </View>   
                </View>
            </SafeAreaView>
        </Modal>

        {/* Paint MODAL (UPDATED) */}
        {/*<Modal animationType='fade'
        visible={ispaintmodalvisible}
        onRequestClose={() =>{
            setIsPaintModalVisible(!ispaintmodalvisible)
        }}>
            <SafeAreaView style={{flex:1, backgroundColor:isDark?'#252525':'#fff'}}>
                <View style={{ flex: 1 }} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                    <Svg style={{flex: 1}}>
                        {paths.map((item, index) => (
                            <Path
                                key={`completed-path-${index}`}
                                d={item.d.join('')}
                                stroke={item.color}
                                fill={'transparent'}
                                strokeWidth={item.width}
                                strokeLinejoin={'round'}
                                strokeLinecap={'round'}
                            />
                        ))}

                        {currentPath.length > 0 && (
                            <Path
                                d={currentPath.join('')}
                                stroke={drawingColor}
                                fill={'transparent'}
                                strokeWidth={strokeWidth}
                                strokeLinejoin={'round'}
                                strokeLinecap={'round'}
                            />
                        )}
                    </Svg>
                </View>
                
                <View style={{flexDirection:'row', marginBottom:15, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'space-between'}}>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        {['#fff', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFA500'].map((color) => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => handleColorChange(color)}
                                style={{
                                    backgroundColor: color,
                                    height: 30,
                                    width: 30,
                                    borderRadius: 15,
                                    marginHorizontal: 8,
                                    // Highlight if selected and NOT in eraser mode
                                    borderWidth: drawingColor === color && !eraseractive ? 3 : 1, 
                                    borderColor: drawingColor === color && !eraseractive ? 'darkred' : '#888',
                                }}
                            />
                        ))}
                    </ScrollView>

                    <TouchableOpacity onPress={handleToggleEraser} style={{marginRight: 10}}>
                        <FontAwesome6 
                            name="eraser" 
                            size={24} 
                            // Highlight the eraser if it's active
                            color={eraseractive ? 'orange' : icontheme} 
                            style={[styles.ModalIcons]} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleclearPaint}>
                        <MaterialIcons 
                            name="delete" 
                            size={30} 
                            color={'red'} 
                            style={[styles.ModalIcons]} />
                    </TouchableOpacity>
                </View>            
            </SafeAreaView>
        </Modal>*/}
        
    </View>
  )
}
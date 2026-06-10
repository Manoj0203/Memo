import { useColorScheme } from "react-native"
export const useTheme = () => {
    const isDark = useColorScheme() === 'dark';

    return {
        Colour:
        {
            bg:{
                backgroundColor:isDark?"#252525":"#fff",
                flex:1,
                alignItems: 'center',
                justifyContent: 'center',
            }
        },
        TEXT:
        {
            heading:{
                color:isDark ? "#fff" : '#000',
                fontFamily:"impact",
                fontSize:30, 
            },
            subheading:{
                color:isDark?"#fff":'#000',
                fontFamily:"Anaheim-SemiBold",
                fontSize:21,
                marginLeft:'2.5%',
                marginBottom:'2%'
            },
            moto:{
                fontFamily:"Anaheim-Bold",
                fontSize:16,
                color:isDark ? "#06ec06ff" : '#00cc00ff',
            },
            usernametxt:{
                fontFamily: "Anaheim-Bold",
                fontSize:22,
                color:isDark ? "#fff" : '#000',
                marginLeft:15
            },
            detailsSideHeading:{
                color:'#b5b5b5dc',
                fontFamily:"Anaheim-Regular",
                fontSize:15
            },
            emptyTextContainer:{
                color:isDark?'#6d6d6dff':'#838383ff',
                fontFamily:'Anaheim-SemiBold',
                fontSize:14
            },
            neonText: {
                fontSize: 18,
                color: isDark?'#00c9c9ff':'#00afafff',
                fontFamily:'Anaheim-Bold',
                textShadowColor: '#0040ffff', 
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 50,
            },
            imageSelectortxt:{
                margin:'2%',
                fontFamily:'Anaheim-Bold',
            }
        },
        TEXTINPUT:
        {
            txtinput:
            {
                backgroundColor:isDark?'#666666dc':'#dadadadc',
                borderRadius:8,
                marginVertical:6,
                minWidth:'80%',
                minHeight:'5%',
                color:isDark?'#fff':'#000',
                fontFamily: 'Anaheim-SemiBold'
            },
            famNameinput:
            {
                backgroundColor:'rgba(0,0,0,0)',
                color:isDark?'#fff':'#000',
                fontSize:25,
                fontFamily: "Anaheim-Bold",
                maxWidth: 350,
                width:'auto',
            },
            personNameinput:
            {
                alignItems:'center',
                justifyContent:'center',
                marginTop:-7,
                fontFamily:'Anaheim-SemiBold',
                color:'#fff'
            },
            generationInput:
            {
                fontFamily: "Anaheim-SemiBold",
                fontSize:20,
                textAlign:'center',
                color:'#fff'
            },
            detailsSideEntry:{
                marginTop:'-2.8%',
                fontFamily:'Anaheim-SemiBold',
                fontSize:15,
                color:'#fff',
                width:'100%',
            }
        },
        BUTTON:
        {
            subbtn:{
                borderWidth:3,
                borderColor:isDark?'#06ec06ff':'#00cc00ff',
                paddingVertical:10,
                width:'55%',
                borderRadius:8,
                alignItems:'center',
                marginTop:'10%'
            },
            subbtntxt:
            {
                color:isDark ? "#fff" : '#000',
                fontSize:16,
                fontFamily: 'Anaheim-Bold'
            },
            settingbtntxt:{
                color:isDark?"#fff":'#000',
                marginLeft:'3%',
                fontFamily: 'Anaheim-SemiBold',
                fontSize: 15,
            }
        },
        PROFILEPIC:
        {
            settinguppic:
            {
                width: 65,
                height: 65,
                borderRadius: 12,
                marginBottom: '6%'
            },
            ProfileScreenpic:{
                marginVertical:'2.5%',
                height:65,
                width:65,
                borderTopRightRadius:15,
                borderTopLeftRadius:20,
                borderBottomRightRadius:20,
                marginLeft:'2.5%'
            },
            editsharebtn:{
                alignItems:'center',
                borderRadius:7,
                backgroundColor:isDark?'#6d6d6dff':'#bebebeff',
                paddingVertical:5,
                flex:1,
                justifyContent:"center",
            },
        },
        isDark,
    };
};
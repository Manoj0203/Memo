import DeviceInfo from 'react-native-device-info';

import { db, } from '../services/firebaseAuth';
import { getDoc, doc } from 'firebase/firestore';

export async function versioncheck() {
    try {
        const currentVersion = parseInt(
            DeviceInfo.getBuildNumber(), 10
        );
        const configRef = doc(db, 'config', 'memoconfig');
        const snapshot = await getDoc(configRef);
        if(snapshot.exists()){
            const firebaseversioncode = snapshot.data().versioncode;
            if(currentVersion < firebaseversioncode){
                return true;
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
        
    } catch(e) {
        console.log(e)
        return false;
    }
}
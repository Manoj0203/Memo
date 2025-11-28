import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';
import onBackgroundEvent from './utils/notifeeBackground';

notifee.onBackgroundEvent(onBackgroundEvent);

AppRegistry.registerComponent(appName, () => App);

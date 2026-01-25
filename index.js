import { AppRegistry } from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import onBackgroundEvent from './utils/notifeeBackground';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    console.log('Notification delivered in killed state');
  }
  return Promise.resolve();
});

notifee.onBackgroundEvent(onBackgroundEvent);

AppRegistry.registerComponent(appName, () => App);

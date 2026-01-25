import notifee, { EventType } from '@notifee/react-native';

export default async function onBackgroundEvent({ type, detail }) {
  const { notification, pressAction } = detail;

  if (type === EventType.ACTION_PRESS && pressAction.id === 'mark-as-read') {
    await fetch(`https://my-api.com/chat/${notification.data.chatId}/read`, {
      method: 'POST',
    });

    await notifee.cancelNotification(notification.id);
  }
}

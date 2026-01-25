import notifee, { TimestampTrigger, TriggerType, RepeatFrequency, AuthorizationStatus, AndroidImportance, AndroidNotificationSetting } from '@notifee/react-native';
import { Alert, Platform } from 'react-native';

    export async function onDisplayNotification(new_id, hr, min, dt, month, yr ,body, tit = 'Memo')
    {
        const settings = await notifee.getNotificationSettings();
        const summa  = notifee.getPowerManagerInfo();

        if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
            const requestedSettings = await notifee.requestPermission();

            //snackbar
            if (requestedSettings.authorizationStatus === AuthorizationStatus.DENIED) {
                console.warn("Notification permission permanently denied. Cannot schedule task.");
                notifee.openNotificationSettings();
            }
        }

        // Create a channel (required for Android)
        const channelId = await notifee.createChannel({
            id: 'notification_channel',
            name: 'Notification Channel',
            sound: 'default_noti',
            importance: AndroidImportance.HIGH,
        });

        // Display a notification
        /*const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: Date.now() + 10 * 1000, // 10 seconds later
        };*/
        const date = new Date();
        date.setHours(hr);
        date.setMinutes(min);
        date.setSeconds(0);
        date.setFullYear(yr); 
        date.setMonth(month-1);//setMonth() use 0 as Jan and 11 as Dec
        date.setDate(dt);

        if(date.getTime() < new Date())
        {
            return 0;
        }

        await notifee.createTriggerNotification(
            {
                id: new_id,
                title: tit,
                body: 'Memo: Reminder for ' + body + '\n',
                alarmManager:
                {
                    allowWhileIdle: true,
                },
                android: {
                    channelId,
                    pressAction: {
                        id: 'default',
                    },
                },
            },
            //trigger
            {
                type: TriggerType.TIMESTAMP,
                timestamp: date.getTime(),
                alarmManager: {
                    allowWhileIdle: true,
                },
            }
        );
    }

    export async function cancelnoti(id)
    {
        await notifee.cancelNotification(id)//set a unique id
    }

    export async function cancelallnoti()
    {
        await notifee.cancelAllNotifications()
    }
export default onDisplayNotification

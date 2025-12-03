import { _decorator, sys, native, cclegacy } from 'cc';
import { config } from './Config';
import { GameConst } from './GameConst';
import { MgrGame } from './MgrGame';
import { default as NotifyPushCfg } from './NotifyPushCfg';
import { Tools } from './Tools';
import { PushNotificationType } from './Const';
import { default as NotifyContentCfg } from './NotifyContentCfg';
import { Language } from './Language';
import { isEmpty } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('NotificationMgr')
export class NotificationMgr {
    private static _ins: NotificationMgr = null;
    private _gameNotificationChannel = {
        channelId: 'GameChannel',
        name: 'Notifications',
        description: 'Generic notifications'
    };
    private _requestPermissionCnt = 0;
    private _typeContentIdx: Record<string, number> = {};
    private _notifyId = 0;
    private _isCreate = false;

    public static get Instance(): NotificationMgr {
        if (!this._ins) {
            this._ins = new NotificationMgr();
            this._ins._deserializedData();
        }
        return this._ins;
    }

    private _serializeData(): void {
        const data = {
            requestPermissionCnt: this._requestPermissionCnt,
            typeContentIdx: this._typeContentIdx,
            notifyId: this._notifyId
        };
        const jsonStr = JSON.stringify(data);
        sys.localStorage.setItem(config.gameName + '-localNotification', jsonStr);
    }

    private _deserializedData(): void {
        let data: any = {};
        const jsonStr = sys.localStorage.getItem(config.gameName + '-localNotification');
        if (!isEmpty(jsonStr)) {
            data = JSON.parse(jsonStr);
            this._requestPermissionCnt = data.requestPermissionCnt;
            this._typeContentIdx = data.typeContentIdx;
            this._notifyId = data.notifyId;
        }
    }

    public init(): void {
        this.cancelAllNotification();
        this.createNotificationChannel();
        this.createNotification();
    }

    public guideNotificationPermission(): void {
        if (MgrGame.Instance.gameData.maxLv < GameConst.NOTIFY_OPEN_LEVEL) return;
        
        if (this._requestPermissionCnt < 1) {
            if (!this.checkNotificationPermission()) {
                this.showNotificationPermissionDialog();
                this._requestPermissionCnt++;
                this._serializeData();
            }
            this.createNotification();
        }
    }

    public createNotification(): void {
        if (MgrGame.Instance.gameData.maxLv < GameConst.NOTIFY_OPEN_LEVEL || this._isCreate) return;

        const notifications = NotifyPushCfg.Instance.notificitaonArray;
        for (let i = 0; i < notifications.length; i++) {
            const cfg = NotifyPushCfg.Instance.get(notifications[i]);
            const hour = cfg.pushTime % 24;
            const pushPool = cfg.pushPool;

            switch (cfg.pushType) {
                case PushNotificationType.DailyTimeNoEnter:
                    this._notifyDailyTimeNoEnter(hour, pushPool);
                    break;
                case PushNotificationType.DailyTime:
                    this._notifyDailyTime(hour, pushPool);
                    break;
            }
        }
        this._isCreate = true;
    }

    private _notifyDailyTimeNoEnter(hour: number, pushPool: number[]): void {
        let idx = 0;
        const typeKey = 'type_' + PushNotificationType.DailyTimeNoEnter;
        
        if (this._typeContentIdx.hasOwnProperty(typeKey)) {
            idx = this._typeContentIdx[typeKey];
            this._typeContentIdx[typeKey]++;
        } else {
            this._typeContentIdx[typeKey] = 1;
        }
        this._serializeData();

        const contentId = pushPool[idx % pushPool.length];
        const contentCfg = NotifyContentCfg.Instance.get(contentId);
        const title = Language.Instance.getLangByID(contentCfg.title);
        const message = Language.Instance.getLangByID(contentCfg.message);

        if (sys.isNative && sys.platform === sys.Platform.ANDROID) {
            const nowTime = Tools.GetNowTime();
            const fireTime = new Date(nowTime).setHours(hour, 0, 0, 0) + 86400000;
            this.scheduleAndroidLocalNotification(title, message, fireTime, 86400000);
        }
    }

    private _notifyDailyTime(hour: number, pushPool: number[]): void {
        let idx = 0;
        const typeKey = 'type_' + PushNotificationType.DailyTime;
        
        if (this._typeContentIdx.hasOwnProperty(typeKey)) {
            idx = this._typeContentIdx[typeKey];
            this._typeContentIdx[typeKey]++;
        } else {
            this._typeContentIdx[typeKey] = 1;
        }
        this._serializeData();

        const contentId = pushPool[idx % pushPool.length];
        const contentCfg = NotifyContentCfg.Instance.get(contentId);
        const title = Language.Instance.getLangByID(contentCfg.title);
        const message = Language.Instance.getLangByID(contentCfg.message);

        if (sys.isNative && sys.platform === sys.Platform.ANDROID) {
            const nowTime = Tools.GetNowTime();
            const targetTime = new Date(nowTime).setHours(hour, 0, 0, 0);
            const fireTime = nowTime >= targetTime ? targetTime + 86400000 : targetTime;
            this.scheduleAndroidLocalNotification(title, message, fireTime, 86400000);
        }
    }

    public checkNotificationPermission(): boolean {
        let hasPermission = false;
        if (sys.isNative) {
            if (sys.platform === sys.Platform.ANDROID) {
                hasPermission = native.reflection.callStaticMethod(
                    'com/cocos/game/SdkBrigde', 
                    'checkNotificationPermission', 
                    '()Z'
                );
            } else if (sys.platform === sys.Platform.IOS) {
                hasPermission = native.reflection.callStaticMethod(
                    'SdkBrigde', 
                    'checkNotificationPermission'
                );
            }
        }
        console.log('CccNotifications checkNotificationPermission. permission:', hasPermission);
        return hasPermission;
    }

    public showNotificationPermissionDialog(): void {
        if (!sys.isNative) {
            console.log('platform not support Notification!');
            return;
        }

        const title = Language.Instance.getLangByID('notify_permission_title');
        const content = Language.Instance.getLangByID('notify_permission_content');
        const okText = Language.Instance.getLangByID('ui_ok');
        const cancelText = Language.Instance.getLangByID('ui_cancel');
        
        const dialogData = JSON.stringify({
            title: title,
            message: content,
            okText: okText,
            cancelText: cancelText
        });

        if (sys.platform === sys.Platform.ANDROID) {
            native.reflection.callStaticMethod(
                'com/cocos/game/SdkBrigde', 
                'showNotificationPermissionDialog', 
                '(Ljava/lang/String;)V', 
                dialogData
            );
        } else if (sys.platform === sys.Platform.IOS) {
            native.reflection.callStaticMethod(
                'SdkBrigde', 
                'showNotificationPermissionDialog:', 
                dialogData
            );
        }
    }

    public createNotificationChannel(): void {
        if (!sys.isNative) {
            console.log('platform not support Notification!');
            return;
        }

        const channelData = JSON.stringify(this._gameNotificationChannel);
        
        if (sys.platform === sys.Platform.ANDROID) {
            console.log('CccNotifications createNotificationChannel.');
            native.reflection.callStaticMethod(
                'com/cocos/game/SdkBrigde', 
                'createNotificationChannel', 
                '(Ljava/lang/String;)V', 
                channelData
            );
        } else if (sys.platform === sys.Platform.IOS) {
            native.reflection.callStaticMethod(
                'SdkBrigde', 
                'createNotificationChannel:', 
                channelData
            );
        }
    }

    public scheduleAndroidLocalNotification(title: string, content: string, fireTime: number, interval: number): number {
        const channelId = this._gameNotificationChannel.channelId;
        const notificationData = JSON.stringify({
            title: title,
            content: content,
            fire: fireTime,
            interval: interval,
            channelId: channelId
        });

        const notificationId = native.reflection.callStaticMethod(
            'com/cocos/game/SdkBrigde', 
            'scheduleLocalNotification', 
            '(Ljava/lang/String;)I', 
            notificationData
        );

        console.log(`CccNotifications CreateNotify. title:${title}, content:${content}, fire: ${fireTime}, interval:${interval}, notificationId: ${notificationId}`);
        return notificationId;
    }

    public cancelNotificationById(notificationId: number): void {
        if (!sys.isNative) {
            console.log('platform not support Notification!');
            return;
        }

        if (sys.platform === sys.Platform.ANDROID) {
            console.log('CccNotifications CancelNotify.');
            native.reflection.callStaticMethod(
                'com/cocos/game/SdkBrigde', 
                'cancelNotification', 
                '(I)V', 
                notificationId
            );
        }
    }

    public cancelAllNotification(): void {
        if (!sys.isNative) {
            console.log('platform not support Notification!');
            return;
        }

        if (sys.platform === sys.Platform.ANDROID) {
            console.log('CccNotifications cancelAllNotification.');
            native.reflection.callStaticMethod(
                'com/cocos/game/SdkBrigde', 
                'cancelAllNotification', 
                '()V'
            );
        } else if (sys.platform === sys.Platform.IOS) {
            native.reflection.callStaticMethod(
                'SdkBrigde', 
                'cancelAllNotification'
            );
        }
    }
}
import { sys, native } from 'cc';

export class AppsFlyerNative {
    public appsFlyerAPI: string = 'com/cocos/game/AppsFlyerActivity';

    public logEvent(eventName: string, eventValue: string): void {
        if (sys.isNative) {
            native.reflection.callStaticMethod(
                this.appsFlyerAPI,
                'logEvent',
                '(Ljava/lang/String;Ljava/lang/String;)V',
                eventName,
                eventValue
            );
        }
    }
}
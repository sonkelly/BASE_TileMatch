import { _decorator, sys } from 'cc';
import { appsFMgr } from './AppsFlyerMgr';

export class AFDot {
    public static sendEvent(eventName: string, eventValues?: any): void {
        if (sys.isNative) {
            let valuesString = '';
            if (eventValues) {
                valuesString = JSON.stringify(eventValues);
            }
            appsFMgr.getAppsFlyer().logEvent(eventName, valuesString);
        }
    }
}
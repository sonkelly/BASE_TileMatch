import { _decorator, Component, Node } from 'cc';
import { AppsFlyerNative } from './AppsFlyerNative';

const { ccclass } = _decorator;

@ccclass('AppsFlyerMgr')
export class AppsFlyerMgr extends Component {
    private static _instance: AppsFlyerMgr | null = null;
    private appsFlyer: AppsFlyerNative | null = null;

    public static instance(): AppsFlyerMgr {
        if (!AppsFlyerMgr._instance) {
            AppsFlyerMgr._instance = new AppsFlyerMgr();
        }
        return AppsFlyerMgr._instance;
    }

    public getAppsFlyer(): AppsFlyerNative {
        if (!this.appsFlyer) {
            this.appsFlyer = new AppsFlyerNative();
        }
        return this.appsFlyer;
    }
}

export const appsFMgr = AppsFlyerMgr.instance();
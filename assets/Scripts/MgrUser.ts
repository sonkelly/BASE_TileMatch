import { _decorator, cclegacy } from 'cc';
import { ITEM, GameConst } from './GameConst';
import { UIPrefabs } from './Prefabs';
import {Language} from './Language';
import {MgrBase} from './MgrBase';
import {Tools} from './Tools';
import { UserData } from './UserData';
import { SdkBridge } from './SdkBridge';
import {MgrUi} from './MgrUi';
import {set} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrUser')
export class MgrUser extends MgrBase {
    private _userData: UserData = null;
    
    onLoad() {
        this._userData = new UserData('user-data');
    }
    
    load() {
        this._userData.load();
    }
    
    initLoadData() {}
    
    async checkBack() {
        const entryData = await SdkBridge.getEntryPointData();
        const currentTime = Tools.GetNowTime();
        
        if (entryData?.returnReward) {
            if (currentTime - this._userData.lastLogin >= 86400000) {
                const rewardData = {};
                set(rewardData, ITEM.Coin, GameConst.ReturnRewards);
                
                MgrUi.Instance.openViewAsync(UIPrefabs.CommonRewardView, {
                    priority: 2,
                    data: {
                        rewardData: rewardData,
                        title: Language.Instance.getLangByID('back_rewards'),
                        type: 'ReturnReward'
                    }
                });
            }
        }
        
        this.userData.lastLogin = currentTime;
    }
    
    get userData(): UserData {
        return this._userData;
    }
    
    static get Instance(): MgrUser {
        return MgrUser._instance;
    }
    
    private static _instance: MgrUser;
}
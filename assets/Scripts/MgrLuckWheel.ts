import { _decorator, Component, director, macro } from 'cc';
import { MgrBase } from './MgrBase';
import { DataLuckWheel } from './DataLuckWheel';
import { MgrGame } from './MgrGame';
import { GameConst } from './GameConst';
import { Utils } from './Utils';
import { Tools } from './Tools';
import { TurntableRewardCfg } from './TurntableRewardCfg';
import { MgrUser } from './MgrUser';
import { AnalyticsManager } from './AnalyticsManager';
import { GlobalEvent } from './Events';
import {isNil} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrLuckWheel')
export class MgrLuckWheel extends MgrBase {
    private _data: DataLuckWheel = null!;
    private _isInit: boolean = false;
    private _nextDayTimeStamp: number | null = null;
    private _nextDayOffsetTimeStamp: number | null = null;

    private static _instance: MgrLuckWheel = null!;
    public static get Instance(): MgrLuckWheel {
        return MgrLuckWheel._instance;
    }

    public get data(): DataLuckWheel {
        return this._data;
    }

    protected onLoad(): void {
        this._data = new DataLuckWheel('luckWheel-data');
        MgrLuckWheel._instance = this;
    }

    public load(): void {
        this._data.load();
    }

    public initLoadData(): void {
        this.schedule(this._fixedUpdate.bind(this), 1, macro.REPEAT_FOREVER, Math.random());
    }

    private _fixedUpdate(dt: number): void {
        if (this._isInit) {
            if (isNil(this._nextDayTimeStamp)) {
                this._nextDayTimeStamp = Utils.getNextDayTimeStamp(this._data.getRefreshTime());
            }
            
            const nowTime = Tools.GetNowTime();
            this._nextDayOffsetTimeStamp = this._nextDayTimeStamp! - nowTime;
            
            if (this._nextDayOffsetTimeStamp < 0) {
                this._data._refreshLuckWheelData();
                this._nextDayTimeStamp = Utils.getNextDayTimeStamp(this._data.getRefreshTime());
            }
        }
    }

    public isOpen(): boolean {
        const isLevelEnough = MgrGame.Instance.gameData.maxLv >= GameConst.Turntable_Opem_Level;
        
        if (isLevelEnough && !this._isInit) {
            this._isInit = true;
            this._initLuckWheel();
        }
        
        return isLevelEnough;
    }

    private _initLuckWheel(): void {
        this._data.initLuckWheelData();
    }

    public getRewardIds(): number[] {
        const groupId = this._data?.luckWheelData?.groupId || 1;
        return TurntableRewardCfg.Instance.rewardCfgMap.get(groupId) || [];
    }

    public getGroupUseTime(): number {
        return this._data?.luckWheelData?.useTime || 0;
    }

    public canSpin(): boolean {
        return this.getGroupUseTime() < GameConst.TurntableSpinNum;
    }

    public getOwnReward(): number[] {
        return this._data?.luckWheelData?.ownReward || [];
    }

    public getSpinReward(isFree: boolean): number {
        const rewardIds = this.getRewardIds();
        const ownRewards = this._data?.luckWheelData?.ownReward || [];
        
        const availableRewards = rewardIds.filter(id => !ownRewards.includes(id));
        
        if (availableRewards.length <= 0) {
            console.error('no wait reward!');
            return 0;
        }

        let totalWeight = 0;
        const weightList: {id: number, rate: number}[] = [];

        for (const rewardId of availableRewards) {
            const rewardCfg = TurntableRewardCfg.Instance.get(rewardId);
            
            if (isFree) {
                totalWeight += rewardCfg.freeWeight;
                weightList.push({
                    id: rewardCfg.id,
                    rate: rewardCfg.freeWeight
                });
            } else {
                totalWeight += rewardCfg.adWeight;
                weightList.push({
                    id: rewardCfg.id,
                    rate: rewardCfg.adWeight
                });
            }
        }

        const selectedId = Utils.getElementByWeight(weightList, item => item.rate, totalWeight).id;

        this._data.addLuckWheelDataUseTime();
        this._data.addLuckWheelDataOwnReward(selectedId);
        
        director.emit(GlobalEvent.luckWheelGetReward);

        const rewardInfo = TurntableRewardCfg.Instance.get(selectedId);
        MgrUser.Instance.userData.addMemItem(
            rewardInfo.rewardInfo.id,
            rewardInfo.rewardInfo.count,
            'SpinReward'
        );

        AnalyticsManager.getInstance().reportSpinGet({
            Spin_Num: this.getGroupUseTime(),
            Reward: rewardInfo.reward
        });

        return selectedId;
    }
}
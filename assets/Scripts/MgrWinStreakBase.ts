import { _decorator, cclegacy } from 'cc';
import {MgrBase} from './MgrBase';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {includes, cloneDeep, each, set, get} from 'lodash-es';
import { MgrGame } from './MgrGame';
import {Tools} from './Tools';
import { MgrTask } from './MgrTask';
import { TASK_TYPE, ACTIVE_STATUS } from './Const';

const { ccclass, property } = _decorator;

@ccclass('MgrWinStreakBase')
export class MgrWinStreakBase extends MgrBase {
    protected static _instance: MgrWinStreakBase;
    public static get Instance(): MgrWinStreakBase {
        return MgrWinStreakBase._instance;
    }

    private _isShowClear: boolean = false;
    private _lastLv: number = 0;
    private _winTime: number = 0;
    private startTime = moment('2024-01-01 00:00');

    public get isShowClear(): boolean {
        return this._isShowClear;
    }
    public set isShowClear(value: boolean) {
        this._isShowClear = value;
    }

    public get lastLv(): number {
        return this._lastLv;
    }

    public get winTime(): number {
        return this._winTime;
    }
    public set winTime(value: number) {
        if (value > this.getMaxNum()) {
            value = this.getMaxNum();
        }
        this._winTime = value;
    }

    constructor(...args: any[]) {
        super(...args);
    }

    public load(): void {}
    public initLoadData(): void {}
    public onLoad(): void {}
    public getData(): any {}
    public getRepeatDay(): number { return 0; }
    public getOpenDay(): number[] { return []; }
    public getMaxNum(): number { return 0; }
    public getOpenLevel(): number { return 0; }
    public getCfgList(): any[] { return []; }
    public getCfgMaxId(): number { return 0; }
    public getItemAddType(): string { return ''; }
    public reportStreakEarn(data: any): void {}

    public isMaxStage(): boolean {
        return this.getData().curTime >= this.getMaxNum();
    }

    public isCompleteAll(): boolean {
        return this.getData().maxTime >= this.getMaxNum();
    }

    public isShowClearView(): boolean {
        return MgrGame.Instance.gameData.maxLv >= this.getOpenLevel() && 
               this.checkInWinStreak() && 
               this.isShowClear && 
               this.winTime > 0;
    }

    public isShowClearAnim(): boolean {
        return MgrGame.Instance.gameData.maxLv >= this.getOpenLevel() && 
               this.checkInWinStreak() && 
               this.isShowClear && 
               this.getStreakTime() > 0;
    }

    public addStreakTime(count: number = 1): void {
        if (MgrGame.Instance.gameData.maxLv >= this.getOpenLevel() && this.checkInWinStreak()) {
            this.getData().curTime += count;
            this._isShowClear = false;
            this._lastLv = 0;
            this.winTime = this.getData().curTime;

            if (this.getData().curTime >= this.getData().maxTime) {
                this.getData().maxTime = this.getData().curTime;
            }

            if (MgrTask.Instance.data.winStreakTime !== this.getData().time) {
                MgrTask.Instance.data.addTaskData(TASK_TYPE.JOINWINSTREAK, 1);
            }
        }
    }

    public clearStreakTime(): void {
        if (this.getData().curTime > 0) {
            this._isShowClear = true;
            this._lastLv = this.getData().curTime;
            this.winTime = this.getData().curTime;
        } else {
            this._isShowClear = false;
            this._lastLv = 0;
            this.winTime = 0;
        }
        this.getData().curTime = 0;
    }

    public rewriteStreakTime(): void {
        if (this.isShowClear) {
            this.isShowClear = false;
            this.getData().curTime = this.winTime;
        }
    }

    public getMinAwaitId(): number {
        const cfgList = this.getCfgList();
        for (let i = 0; i < cfgList.length; i++) {
            const cfg = cfgList[i];
            if (!this.getIsEarn(cfg.winnum)) {
                return cfg.id;
            }
        }
        return this.getCfgMaxId();
    }

    public getStreakTime(): number {
        return this.isShowClear ? this.winTime : this.getData().curTime;
    }

    public deleteWinTime(): void {
        this.winTime -= 1;
    }

    public getIsUnlock(num: number): boolean {
        return this.getData().maxTime >= num;
    }

    public getIsEarn(num: number): boolean {
        return includes(this.getData().earnList, num);
    }

    public streakEarn(num: number): void {
        this.getData().earnStreak(num);
    }

    public checkResetData(): boolean {
        if (!this.getIsSamePeriod()) {
            this.getData().resetData(Tools.GetNowMoment().valueOf());
            return true;
        }
        return false;
    }

    public checkResetEarn(): void {
        if (this.getData().maxTime <= 0) {
            this.getData().earnList = [];
        }
    }

    public getIsSamePeriod(): boolean {
        const repeatDay = this.getRepeatDay();
        const dataTime = this.getData().time;
        const startTimeClone = cloneDeep(this.startTime);
        const dataDiff = moment(dataTime).diff(startTimeClone, 'day');
        const dataPeriod = Math.floor(dataDiff / repeatDay);
        
        const nowDiff = Tools.GetNowMoment().startOf('day').diff(startTimeClone, 'day');
        return dataPeriod === Math.floor(nowDiff / repeatDay);
    }

    public getRewardList(rewardStr: string): any[] {
        const rewardList: any[] = [];
        const rewards = rewardStr.split(',');
        each(rewards, (reward: string) => {
            const rewardData = reward.split('|');
            rewardList.push(rewardData);
        });
        return rewardList;
    }

    public checkInWinStreak(): boolean {
        return this.getRemainTime() > 0;
    }

    public getMaxStreak(): number {
        const maxTime = this.getData().maxTime;
        const maxNum = this.getMaxNum();
        return Math.min(maxTime, maxNum);
    }

    public getRemainTime(): number {
        let remainTime = 0;
        const repeatDay = this.getRepeatDay();
        const openDay = this.getOpenDay();
        const now = Tools.GetNowMoment();
        const startTimeClone = cloneDeep(this.startTime);
        const diffDays = now.startOf('day').diff(startTimeClone, 'day');

        if (diffDays >= 0) {
            const period = Math.floor(diffDays / repeatDay);
            const periodStart = startTimeClone.add(period * repeatDay, 'day').valueOf();
            
            const startDay = openDay[0] - 1;
            const endDay = openDay[openDay.length - 1] - 1;
            
            const startDate = moment(periodStart).add(startDay, 'day').startOf('day');
            const endDate = moment(periodStart).add(endDay, 'day').endOf('day');
            const current = Tools.GetNowMoment();

            if (current.isAfter(startDate) && current.isBefore(endDate)) {
                remainTime = endDate.diff(current, 'millisecond');
            }
        }
        return remainTime;
    }

    public getActiveStatus(): number {
        if (MgrGame.Instance.gameData.maxLv < this.getOpenLevel()) {
            return ACTIVE_STATUS.LOCK;
        }

        const repeatDay = this.getRepeatDay();
        const openDay = this.getOpenDay();
        const now = Tools.GetNowMoment();
        const startTimeClone = cloneDeep(this.startTime);
        const diffDays = now.startOf('day').diff(startTimeClone, 'day');

        if (diffDays >= 0) {
            const period = Math.floor(diffDays / repeatDay);
            const periodStart = startTimeClone.add(period * repeatDay, 'day').valueOf();
            
            const startDay = openDay[0] - 1;
            const endDay = openDay[openDay.length - 1] - 1;
            
            const startDate = moment(periodStart).add(startDay, 'day').startOf('day');
            const endDate = moment(periodStart).add(endDay, 'day').endOf('day');
            const current = Tools.GetNowMoment();

            if (current.valueOf() < startDate.valueOf() || current.valueOf() > endDate.valueOf()) {
                return ACTIVE_STATUS.GAP;
            }
        }
        return ACTIVE_STATUS.ACTIVE;
    }

    public getIsActivityEnd(): boolean {
        const repeatDay = this.getRepeatDay();
        const openDay = this.getOpenDay();
        const dataTime = moment(this.getData().time);
        const startTimeClone = cloneDeep(this.startTime);
        const diffDays = dataTime.startOf('day').diff(startTimeClone, 'day');

        if (diffDays >= 0) {
            const period = Math.floor(diffDays / repeatDay);
            const periodStart = startTimeClone.add(period * repeatDay, 'day').valueOf();
            
            const endDay = openDay[openDay.length - 1] - 1;
            const endDate = moment(periodStart).add(endDay, 'day').endOf('day');

            if (!Tools.GetNowMoment().isBefore(endDate)) {
                return true;
            }
        }
        return false;
    }

    public getAutoReward(autoEarn: boolean = true): any {
        const rewards: any = {};
        const cfgList = this.getCfgList();
        const maxTime = this.getData().maxTime;

        for (let i = 0; i < cfgList.length; i++) {
            const cfg = cfgList[i];
            if (maxTime < cfg.winnum) {
                return rewards;
            }

            if (!this.getIsEarn(cfg.winnum)) {
                const rewardList = this.getRewardList(cfg.rewards);
                
                each(rewardList, (reward: any[]) => {
                    const type = Number(reward[0]);
                    const count = Number(reward[1]);
                    const current = get(rewards, type, 0);
                    set(rewards, type, current + count);
                });

                if (autoEarn) {
                    this.streakEarn(cfg.winnum);
                    this.reportStreakEarn({
                        WinStreak_Num: cfg.winnum,
                        WinStreak_Max: this.getMaxStreak(),
                        Reward: cfg.rewards
                    });
                }
            }
        }
        return rewards;
    }

    public getRdEnable(): boolean {
        const cfgList = this.getCfgList();
        const maxTime = this.getData().maxTime;

        for (let i = 0; i < cfgList.length; i++) {
            const cfg = cfgList[i];
            if (maxTime < cfg.winnum) {
                return false;
            }
            if (!this.getIsEarn(cfg.winnum)) {
                return true;
            }
        }
        return false;
    }

    public getShowGuideTip(): boolean {
        return !this.getData().tip && this.getRemainTime() > 0;
    }
}
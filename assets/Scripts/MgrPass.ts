import { _decorator, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import { PassData } from './PassData';
import PassCfg from './PassCfg';
import { GameConst } from './GameConst';
import { AnalyticsManager } from './AnalyticsManager';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { MgrGame } from './MgrGame';
import {Tools} from './Tools';
import { MgrTask } from './MgrTask';
import { TASK_TYPE, ACTIVE_STATUS } from './Const';
import {Language} from './Language';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { GuidePos } from './WeakGuide';
import { AppGame } from './AppGame';
import { MgrWeakGuide } from './MgrWeakGuide';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {get, set, cloneDeep, keys} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrPass')
export class MgrPass extends MgrBase {
    private _data: PassData = null;
    private startTime: any = null;

    public static get Instance(): MgrPass {
        return MgrPass._instance;
    }

    protected onLoad(): void {
        this._data = new PassData(this.name);
    }

    public load(): void {
        this._data.load();
        this.startTime = moment('2024-01-01 00:00');
    }

    public initLoadData(): void {}

    public checkInPass(): boolean {
        return this.getRemainTime() > 0;
    }

    public hasGuide(): boolean {
        return this.data.passTip;
    }

    public addPassLevel(): void {
        const canOpen = MgrGame.Instance.gameData.maxLv >= GameConst.PASS_OPEN_LEVEL;
        if (this.checkInPass() && canOpen) {
            this.data.passLevel += 1;
            if (MgrTask.Instance.data.passTime !== this._data.passTime) {
                MgrTask.Instance.data.addTaskData(TASK_TYPE.JOIN_PASS, 1);
            }

            const cfgId = MgrPass.Instance.getPassCfgId();
            const passLevel = MgrPass.Instance.data.passLevel;
            const passList = PassCfg.Instance.getPassList(cfgId);

            if (passLevel <= passList[passList.length - 1].totalLv) {
                let stageCfg = null;
                for (let i = 0; i < passList.length; i++) {
                    stageCfg = passList[i];
                    if (passLevel < stageCfg.totalLv) {
                        break;
                    }
                }

                const stageLevel = stageCfg.level;
                const stageProgress = passLevel - (stageCfg.totalLv - stageCfg.stage);
                const stageMax = stageCfg.stage;
                const period = MgrPass.Instance.getRepeatId();

                AnalyticsManager.getInstance().reportPassProgress({
                    Pass_Level: stageLevel,
                    Pass_Progress: stageProgress,
                    Pass_ProgressMax: stageMax,
                    Pass_Period: period
                });
            }
        }
    }

    public resetPassData(time: number): void {
        this.data.clearPassData(time);
    }

    public getPassAwaitData(): any {
        const cfgId = MgrPass.Instance.getPassCfgId();
        const passList = PassCfg.Instance.getPassList(cfgId);
        const passLevel = MgrPass.Instance.data.passLevel;
        let result = null;

        for (let i = 0; i < passList.length; i++) {
            const cfg = passList[i];
            const passData = MgrPass.Instance.data.getPassData(cfg.level);
            if (passLevel >= cfg.totalLv && (!passData.free || !passData.ad)) {
                result = cfg;
                break;
            }
        }

        return result;
    }

    public getPassEndData(): any {
        const cfgId = MgrPass.Instance.getPassCfgId();
        const passList = PassCfg.Instance.getPassList(cfgId);
        const passLevel = MgrPass.Instance.data.passLevel;
        let result = null;

        for (let i = 0; i < passList.length; i++) {
            const cfg = passList[i];
            if (passLevel < cfg.totalLv) {
                break;
            }
            result = cfg;
        }

        return result;
    }

    public getPassTaskData(): any {
        const cfgId = MgrPass.Instance.getPassCfgId();
        const passList = PassCfg.Instance.getPassList(cfgId);
        const passLevel = MgrPass.Instance.data.passLevel;
        let result = null;

        for (let i = 0; i < passList.length; i++) {
            const cfg = passList[i];
            result = cfg;
            if (passLevel < cfg.totalLv) {
                break;
            }
        }

        return result;
    }

    public checkCompleteAll(): boolean {
        const cfgId = MgrPass.Instance.getPassCfgId();
        const passList = PassCfg.Instance.getPassList(cfgId);
        return MgrPass.Instance.data.passLevel >= passList[passList.length - 1].totalLv;
    }

    public checkResetData(): boolean {
        return !MgrPass.Instance.getIsSamePeriod() && (this.resetPassData(Tools.GetNowMoment().valueOf()), true);
    }

    public getIsSamePeriod(): boolean {
        const timeType = GameConst.PASS_OPEN_TIME_TYPE;
        const passTime = this.data.passTime;
        const startTime = cloneDeep(this.startTime);
        const daysDiff = moment(passTime).diff(startTime, 'day');
        const periodIndex = Math.floor(daysDiff / timeType);
        const currentDays = Tools.GetNowMoment().startOf('day').diff(startTime, 'day');
        return periodIndex === Math.floor(currentDays / timeType);
    }

    public tryAutoReward(callback: Function): void {
        const isPassOver = this.getIsPassOver();
        const canOpen = MgrGame.Instance.gameData.maxLv >= GameConst.PASS_OPEN_LEVEL;
        const hasLevel = this.data.passLevel >= 1;

        if (isPassOver && canOpen && hasLevel) {
            const rewards = this.getAutoReward(true);
            if (keys(rewards).length > 0) {
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.CommonRewardView, {
                    priority: 2,
                    data: {
                        rewardData: rewards,
                        sourceType: 'PassReward',
                        title: Language.Instance.getLangByID('pass_title')
                    },
                    callback: (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, () => {
                            AppGame.topUI.passBtn.hide();
                            callback && callback();
                        });
                    }
                });
                return;
            }
        }
        callback && callback();
    }

    public getAutoReward(autoCollect: boolean = false): any {
        const rewards = {};
        const cfgId = MgrPass.Instance.getPassCfgId();
        const passList = PassCfg.Instance.getPassList(cfgId);
        const passLevel = MgrPass.Instance.data.passLevel;

        for (let i = 0; i < passList.length; i++) {
            const cfg = passList[i];
            if (!(passLevel >= cfg.totalLv)) {
                return rewards;
            }

            if (!MgrPass.Instance.data.getPassData(cfg.level).free) {
                const currentCount = get(rewards, cfg.itemId1, 0);
                set(rewards, cfg.itemId1, currentCount + cfg.count1);

                if (autoCollect) {
                    MgrPass.Instance.data.earnPassFree(cfg.level, false);
                    MgrPass.Instance.reportPassEarn({
                        Pass_Level: cfg.level,
                        Reward: `${cfg.itemId1}|${cfg.count1}`,
                        RewardType: 0,
                        Pass_Period: MgrPass.Instance.getLocalRepeatId()
                    });
                }
            }
        }

        return rewards;
    }

    public getRdEnable(): boolean {
        const cfgId = MgrPass.Instance.getPassCfgId();
        const passList = PassCfg.Instance.getPassList(cfgId);
        const passLevel = MgrPass.Instance.data.passLevel;

        for (let i = 0; i < passList.length; i++) {
            const cfg = passList[i];
            if (passLevel >= cfg.totalLv) {
                if (!MgrPass.Instance.data.getPassData(cfg.level).free) {
                    return true;
                }
            }
        }

        return false;
    }

    public getRemainTime(): number {
        let remainTime = 0;
        const timeType = GameConst.PASS_OPEN_TIME_TYPE;
        const openTime = GameConst.PASS_OPEN_TIME;
        const now = Tools.GetNowMoment();
        const startTime = cloneDeep(this.startTime);
        const daysDiff = now.startOf('day').diff(startTime, 'day');

        if (daysDiff >= 0) {
            const periodIndex = Math.floor(daysDiff / timeType);
            const periodStart = startTime.add(periodIndex * timeType, 'day').valueOf();
            const startDay = openTime[0] - 1;
            const endDay = openTime[openTime.length - 1] - 1;
            const periodStartTime = moment(periodStart).add(startDay, 'day').startOf('day');
            const periodEndTime = moment(periodStart).add(endDay, 'day').endOf('day');
            const currentTime = Tools.GetNowMoment();

            if (currentTime.isAfter(periodStartTime) && currentTime.isBefore(periodEndTime)) {
                remainTime = periodEndTime.diff(currentTime, 'millisecond');
            }
        }

        return remainTime;
    }

    public getIsPassOver(): boolean {
        const timeType = GameConst.PASS_OPEN_TIME_TYPE;
        const openTime = GameConst.PASS_OPEN_TIME;
        const passTime = moment(MgrPass.Instance.data.passTime);
        const startTime = cloneDeep(this.startTime);
        const daysDiff = passTime.startOf('day').diff(startTime, 'day');

        if (daysDiff >= 0) {
            const periodIndex = Math.floor(daysDiff / timeType);
            const periodStart = startTime.add(periodIndex * timeType, 'day').valueOf();
            const endDay = openTime[openTime.length - 1] - 1;
            const periodEndTime = moment(periodStart).add(endDay, 'day').endOf('day');

            if (!Tools.GetNowMoment().isBefore(periodEndTime)) {
                return true;
            }
        }

        return false;
    }

    public getRepeatId(): number {
        const timeType = GameConst.PASS_OPEN_TIME_TYPE;
        const daysDiff = Tools.GetNowMoment().startOf('day').diff(this.startTime, 'day');
        let period = 1;

        if (daysDiff >= 0) {
            period += Math.floor(daysDiff / timeType);
        }

        return period;
    }

    public getLocalRepeatId(): number {
        const timeType = GameConst.PASS_OPEN_TIME_TYPE;
        const daysDiff = moment(MgrPass.Instance.data.passTime).startOf('day').diff(this.startTime, 'day');
        let period = 1;

        if (daysDiff >= 0) {
            period += Math.floor(daysDiff / timeType);
        }

        return period;
    }

    public getPassCfgId(): number {
        const cfgKeys = keys(PassCfg.Instance.getAll());
        let cfgId = 0;
        const timeType = GameConst.PASS_OPEN_TIME_TYPE;
        const daysDiff = Tools.GetNowMoment().startOf('day').diff(this.startTime, 'day');

        if (daysDiff >= 0) {
            const periodIndex = Math.floor(daysDiff / timeType) % cfgKeys.length;
            cfgId = Number(cfgKeys[periodIndex]);
        }

        return cfgId;
    }

    public checkNeedGuide(): boolean {
        return MgrGame.Instance.gameData.maxLv >= GameConst.PASS_OPEN_LEVEL && 
               MgrPass.Instance.checkInPass() && 
               !MgrPass.Instance.data.passTip;
    }

    public guide(callback: Function): void {
        let clicked = false;
        const period = MgrPass.Instance.getRepeatId();

        AnalyticsManager.getInstance().reportPassOpen({
            Pass_Period: period
        });

        MgrWeakGuide.Instance.openWeakGuide({
            node: AppGame.topUI.passBtn.node,
            click: () => {
                clicked = true;
                const view = MgrUi.Instance.getView(UIPrefabs.UIPassView.url);
                if (view) {
                    view.once(VIEW_ANIM_EVENT.Remove, callback);
                } else if (MgrUi.Instance.hasViewQueus(UIPrefabs.UIPassView.url)) {
                    MgrUi.Instance.addViewAsyncQueueCallback(UIPrefabs.UIPassView, (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, callback);
                    });
                } else {
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.UIPassView, {
                        root: MgrUi.root(1),
                        callback: (view: any) => {
                            view.once(VIEW_ANIM_EVENT.Remove, callback);
                        }
                    });
                }
            },
            close: () => {
                MgrPass.Instance.data.passTip = true;
                if (!clicked && callback) {
                    callback();
                }
            },
            pos: GuidePos.Right,
            lang: 'pass_guide_tip'
        });
    }

    public reportPassEarn(data: any): void {
        AnalyticsManager.getInstance().reportPassReward(data);
    }

    public onEnter(): void {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.UIPassView, {
            root: MgrUi.root(1)
        });
    }

    public getActiveStatus(): number {
        if (MgrGame.Instance.gameData.maxLv < GameConst.PASS_OPEN_LEVEL) {
            return ACTIVE_STATUS.LOCK;
        }

        const timeType = GameConst.PASS_OPEN_TIME_TYPE;
        const openTime = GameConst.PASS_OPEN_TIME;
        const now = Tools.GetNowMoment();
        const startTime = cloneDeep(this.startTime);
        const daysDiff = now.startOf('day').diff(startTime, 'day');

        if (daysDiff >= 0) {
            const periodIndex = Math.floor(daysDiff / timeType);
            const periodStart = startTime.add(periodIndex * timeType, 'day').valueOf();
            const startDay = openTime[0] - 1;
            const endDay = openTime[openTime.length - 1] - 1;
            const periodStartTime = moment(periodStart).add(startDay, 'day').startOf('day');
            const periodEndTime = moment(periodStart).add(endDay, 'day').endOf('day');
            const currentTime = Tools.GetNowMoment();

            if (currentTime.valueOf() < periodStartTime.valueOf() || currentTime.valueOf() > periodEndTime.valueOf()) {
                return ACTIVE_STATUS.GAP;
            }
        }

        return ACTIVE_STATUS.ACTIVE;
    }

    public getUnlockInfo(): string {
        return Language.Instance.getLangByID('event_level_unlock').replace('{0}', GameConst.PASS_OPEN_LEVEL.toString());
    }

    public getOpenTimeInfo(): string {
        return Language.Instance.getLangByID('PassOpenTime');
    }

    public get data(): PassData {
        return this._data;
    }
}
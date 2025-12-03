import { _decorator, cclegacy } from 'cc';
import { WinStreakData } from './WinStreakData';
import { GameConst } from './GameConst';
import {WinStreakCfg} from './WinStreakCfg';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrWinStreakBase } from './MgrWinStreakBase';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { GuidePos } from './WeakGuide';
import { AppGame } from './AppGame';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrGame } from './MgrGame';
import {Language} from './Language';
import { MgrWeakGuide } from './MgrWeakGuide';
import {keys} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrWinStreak')
export class MgrWinStreak extends MgrWinStreakBase {
    private _data: WinStreakData | null = null;

    public onLoad(): void {
        this._data = new WinStreakData(this.name);
    }

    public load(): void {
        this.data.load();
    }

    public initLoadData(): void {}

    public get data(): WinStreakData {
        return this._data;
    }

    public getData(): WinStreakData {
        return this._data;
    }

    public getRepeatDay(): number {
        return GameConst.WINSTREAK_OPEN_TIME_TYPE;
    }

    public getOpenDay(): number[] {
        return GameConst.WINSTREAK_OPEN_TIME;
    }

    public getMaxNum(): number {
        return WinStreakCfg.Instance.getMaxNum();
    }

    public getOpenLevel(): number {
        return GameConst.WINSTREAK_OPEN_LEVEL;
    }

    public getCfgList(): any[] {
        return WinStreakCfg.Instance.getStreakList();
    }

    public getCfgMaxId(): number {
        return WinStreakCfg.Instance.getMaxId();
    }

    public getItemAddType(): string {
        return 'WinStreak';
    }

    public reportStreakEarn(reward: any): void {
        AnalyticsManager.getInstance().reportStreakReward(reward);
    }

    public tryAutoReward(callback?: Function): void {
        const isActivityEnd = this.getIsActivityEnd();
        const isLevelValid = MgrGame.Instance.gameData.maxLv >= GameConst.WINSTREAK_OPEN_LEVEL;

        if (isActivityEnd && isLevelValid) {
            const rewards = this.getAutoReward(true);
            if (keys(rewards).length > 0) {
                AppGame.topUI.streakBtn.hide();
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.CommonRewardView, {
                    priority: 2,
                    data: {
                        rewardData: rewards,
                        sourceType: 'WinStreak',
                        title: Language.Instance.getLangByID('win_title')
                    },
                    callback: (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, () => {
                            callback && callback();
                        });
                    }
                });
                return;
            }
        }
        callback && callback();
    }

    public checkNeedGuide(): boolean {
        return MgrGame.Instance.gameData.maxLv >= GameConst.WINSTREAK_OPEN_LEVEL 
            && this.checkInWinStreak() 
            && !MgrWinStreak.Instance.data.tip;
    }

    public guide(callback: Function): void {
        let clicked = false;
        
        AnalyticsManager.getInstance().reportWinStreakOpen({
            WinStreak_Type: 1
        });

        MgrWeakGuide.Instance.openWeakGuide({
            node: AppGame.topUI.streakBtn.node,
            click: () => {
                clicked = true;
                const view = MgrUi.Instance.getView(UIPrefabs.WinStreakView.url);
                if (view) {
                    view.once(VIEW_ANIM_EVENT.Remove, callback);
                } else if (MgrUi.Instance.hasViewQueus(UIPrefabs.WinStreakView.url)) {
                    MgrUi.Instance.addViewAsyncQueueCallback(UIPrefabs.WinStreakView, (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, callback);
                    });
                } else {
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakView, {
                        root: MgrUi.root(1),
                        callback: (view: any) => {
                            view.once(VIEW_ANIM_EVENT.Remove, callback);
                        }
                    });
                }
            },
            close: () => {
                this.data.tip = true;
                if (!clicked) {
                    callback && callback();
                }
            },
            pos: GuidePos.Left,
            lang: 'win_summer_night_tip'
        });
    }

    public addStreakTime(count: number = 1): void {
        super.addStreakTime(count);
        
        if (MgrGame.Instance.gameData.maxLv >= this.getOpenLevel() 
            && this.checkInWinStreak() 
            && this._data!.maxTime <= this.getMaxNum()) {
            
            const currentTime = this._data!.curTime;
            const maxTime = this._data!.maxTime;
            
            AnalyticsManager.getInstance().reportWinStreakProgress({
                WinStreak_Type: 1,
                WinStreak_Count: currentTime,
                WinStreak_Max: maxTime
            });
        }
    }

    public onEnter(): void {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakView, {
            root: MgrUi.root(1)
        });
    }

    public getUnlockInfo(): string {
        return Language.Instance.getLangByID('event_level_unlock')
            .replace('{0}', GameConst.WINSTREAK_OPEN_LEVEL.toString());
    }

    public getOpenTimeInfo(): string {
        return Language.Instance.getLangByID('WinStreakOpenTime');
    }

    public hasGuide(): boolean {
        return this._data!.tip;
    }

    protected static _instance: MgrWinStreak;
    public static get Instance(): MgrWinStreak {
        return MgrWinStreak._instance;
    }
}
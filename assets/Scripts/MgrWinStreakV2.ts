import { _decorator, cclegacy } from 'cc';
import { MgrWinStreakBase } from './MgrWinStreakBase';
import { WinStreakData } from './WinStreakData';
import { GameConst } from './GameConst';
import WinStreakV2Cfg from './WinStreakV2Cfg';
import { AnalyticsManager } from './AnalyticsManager';
import { UIPrefabs } from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { GuidePos } from './WeakGuide';
import {MgrUi} from './MgrUi';
import { MgrGame } from './MgrGame';
import {Language} from './Language';
import { MgrWeakGuide } from './MgrWeakGuide';
import {keys} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrWinStreakV2')
export class MgrWinStreakV2 extends MgrWinStreakBase {
    private _data: WinStreakData | null = null;

    protected onLoad(): void {
        this._data = new WinStreakData(this.name);
    }

    public load(): void {
        this.data.load();
    }

    public initLoadData(): void {}

    public hasGuide(): boolean {
        return this._data!.tip;
    }

    public getData(): WinStreakData {
        return this._data!;
    }

    public getRepeatDay(): number {
        return GameConst.WINSTREAK_V2_OPEN_TIME_TYPE;
    }

    public getOpenDay(): number {
        return GameConst.WINSTREAK_V2_OPEN_TIME;
    }

    public getMaxNum(): number {
        return WinStreakV2Cfg.Instance.getMaxNum();
    }

    public getOpenLevel(): number {
        return GameConst.WINSTREAK_V2_OPEN_LEVEL;
    }

    public getCfgList(): any[] {
        return WinStreakV2Cfg.Instance.getStreakList();
    }

    public getCfgMaxId(): number {
        return WinStreakV2Cfg.Instance.getMaxId();
    }

    public getItemAddType(): string {
        return 'WinStreak2';
    }

    public reportStreakEarn(data: any): void {
        AnalyticsManager.getInstance().reportStreakReward(data);
    }

    public tryAutoReward(callback?: Function): void {
        const isActivityEnd = this.getIsActivityEnd();
        const isLevelValid = MgrGame.Instance.gameData.maxLv >= GameConst.WINSTREAK_V2_OPEN_LEVEL;
        
        if (isActivityEnd && isLevelValid) {
            const rewardData = this.getAutoReward(true);
            if (keys(rewardData).length > 0) {
                AppGame.topUI.streakBtnV2.hide();
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.CommonRewardView, {
                    priority: 2,
                    data: {
                        rewardData: rewardData,
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
        return MgrGame.Instance.gameData.maxLv >= GameConst.WINSTREAK_V2_OPEN_LEVEL 
            && this.checkInWinStreak() 
            && !this.data.tip;
    }

    public guide(callback?: Function): void {
        let clicked = false;
        
        AnalyticsManager.getInstance().reportWinStreakOpen({
            WinStreak_Type: 2
        });

        MgrWeakGuide.Instance.openWeakGuide({
            node: AppGame.topUI.streakBtnV2.node,
            click: () => {
                clicked = true;
                const view = MgrUi.Instance.getView(UIPrefabs.WinStreakViewV2.url);
                if (view) {
                    view.once(VIEW_ANIM_EVENT.Remove, callback);
                } else if (MgrUi.Instance.hasViewQueus(UIPrefabs.WinStreakViewV2.url)) {
                    MgrUi.Instance.addViewAsyncQueueCallback(UIPrefabs.WinStreakViewV2, (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, callback);
                    });
                } else {
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakViewV2, {
                        root: MgrUi.root(1),
                        callback: (view: any) => {
                            view.once(VIEW_ANIM_EVENT.Remove, callback);
                        }
                    });
                }
            },
            close: () => {
                this.data.tip = true;
                if (!clicked && callback) {
                    callback();
                }
            },
            pos: GuidePos.Left,
            lang: 'win_summer_day_tip'
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
                WinStreak_Type: 2,
                WinStreak_Count: currentTime,
                WinStreak_Max: maxTime
            });
        }
    }

    public onEnter(): void {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakViewV2, {
            root: MgrUi.root(1)
        });
    }

    public getUnlockInfo(): string {
        return Language.Instance.getLangByID('event_level_unlock')
            .replace('{0}', GameConst.WINSTREAK_V2_OPEN_LEVEL.toString());
    }

    public getOpenTimeInfo(): string {
        return Language.Instance.getLangByID('WinStreakV2OpenTime');
    }

    get data(): WinStreakData {
        return this._data!;
    }

    private static _instance: MgrWinStreakV2;
    static get Instance(): MgrWinStreakV2 {
        return MgrWinStreakV2._instance;
    }
}
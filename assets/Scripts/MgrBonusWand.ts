import { _decorator, cclegacy, director } from 'cc';
import {MgrBase} from './MgrBase';
import { BonusWandData, BonusWandStatus } from './BonusWandData';
import { MgrGame } from './MgrGame';
import { GlobalEvent } from './Events';
import { GameConst, ITEM } from './GameConst';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { AnalyticsManager } from './AnalyticsManager';
import { GameMode } from './Const';
import { MgrWeakGuide } from './MgrWeakGuide';
import { GuidePos } from './WeakGuide';

const { ccclass, property } = _decorator;

@ccclass('MgrBonusWand')
export class MgrBonusWand extends MgrBase {
    private _data: BonusWandData;
    private _cacheActiveBonus: boolean = false;

    constructor() {
        super();
        this._data = new BonusWandData('bonus-data');
    }

    syncCacheWinCnt(): void {
        this._data.cacheWinCount = this._data.winCount;
    }

    onLoad(): void {
        this._data = new BonusWandData('bonus-data');
    }

    load(): void {
        this._data.load();
        this._cacheActiveBonus = this._data.winCount >= GameConst.BONUS_WAND_WINCOUNT;
    }

    initLoadData(): void {
        director.on(GlobalEvent.GameVictory, this.onGameVictory, this);
        director.on(GlobalEvent.GameFailed, this.onGameFailed, this);
        director.on(GlobalEvent.GameRevive, this.onGameRevive, this);
        director.on(GlobalEvent.GameGiveup, this.onGameGiveup, this);
        director.on(GlobalEvent.GameUsePropShuffle, this.onGameUseShuffle, this);
        director.on(GlobalEvent.GameUsePropTip, this.onGameUseTip, this);
        director.on(GlobalEvent.GameUsePropUndo, this.onGameUseUndo, this);
        director.on(GlobalEvent.GameUsePropLight, this.onGameUseLight, this);
    }

    onGameVictory(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const gameData = MgrGame.Instance.gameData;
            if (gameData.curLv == gameData.maxLv && this.status == BonusWandStatus.Idle) {
                this._data.winCount = Math.min(this.winCount + 1, GameConst.BONUS_WAND_WINCOUNT);
                this.reportProgress();
            }
        }
    }

    handleStatus(): void {
        switch (this._data.status) {
            case BonusWandStatus.Idle:
                if (this.activeBonus) {
                    this._data.status = BonusWandStatus.Active;
                }
                break;
            case BonusWandStatus.Active:
                if (!this.activeBonus) {
                    this._data.status = BonusWandStatus.Idle;
                }
                break;
        }
    }

    checkNeedGuide(): boolean {
        return MgrGame.Instance.gameData.maxLv >= GameConst.BONUS_WAND_UNLOCK_LEVEL && this.status == BonusWandStatus.None;
    }

    guide(callback?: Function): void {
        const bonusWandBtn = AppGame.topUI.bonusWandBtn;
        const bonusWandView = UIPrefabs.BonusWandView;
        let isClicked = false;

        MgrWeakGuide.Instance.openWeakGuide({
            node: bonusWandBtn.node,
            click: () => {
                if (bonusWandView) {
                    isClicked = true;
                    const view = MgrUi.Instance.getView(bonusWandView.url);
                    if (view) {
                        view.once(VIEW_ANIM_EVENT.Remove, callback);
                    } else if (MgrUi.Instance.hasViewQueus(bonusWandView.url)) {
                        MgrUi.Instance.addViewAsyncQueueCallback(bonusWandView, (view) => {
                            view.once(VIEW_ANIM_EVENT.Remove, callback);
                        });
                    } else {
                        MgrUi.Instance.addViewAsyncQueue(bonusWandView, {
                            root: MgrUi.root(2),
                            callback: (view) => {
                                view.once(VIEW_ANIM_EVENT.Remove, callback);
                            }
                        });
                    }
                }
            },
            close: () => {
                if (!isClicked && callback) {
                    callback();
                }
            },
            pos: GuidePos.Right,
            lang: 'super_hint_tip'
        });

        this._data.status = BonusWandStatus.Idle;
        this.reportOpen();
    }

    onGameFailed(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            this._data.dirtyWinCount = this._data.winCount;
            this._data.winCount = 0;
        }
    }

    onGameRevive(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            this._data.winCount = this._data.dirtyWinCount;
            director.emit(GlobalEvent.BonusWandRevive);
        }
    }

    onGameGiveup(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge && 
            this.status != BonusWandStatus.None && 
            this._data.dirtyWinCount > 0) {
            this._data.dirtyWinCount = 0;
            this.reportProgressReset();
            director.emit(GlobalEvent.BonusWandClear);
        }
    }

    onGameUseShuffle(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge && 
            this.status != BonusWandStatus.None) {
            this.reportUseProp(ITEM.Fresh - 9);
        }
    }

    onGameUseTip(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge && 
            this.status != BonusWandStatus.None) {
            if (this.activeBonus) {
                this._data.useCount++;
            }
            this.reportUseProp(ITEM.Hint - 9);
        }
    }

    onGameUseUndo(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge && 
            this.status != BonusWandStatus.None) {
            this.reportUseProp(ITEM.Back - 9);
        }
    }

    onGameUseLight(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge && 
            this.status != BonusWandStatus.None) {
            this.reportUseProp(ITEM.Light);
        }
    }

    checkOpen(): boolean {
        return MgrGame.Instance.gameData.curLv >= GameConst.BONUS_WAND_UNLOCK_LEVEL;
    }

    tryAutoOpenBonus(callback?: Function): void {
        const winCount = this.winCount;
        if (!this.checkOpen()) {
            callback?.();
            return;
        }

        const isActive = winCount >= GameConst.BONUS_WAND_WINCOUNT;
        if (isActive && this._cacheActiveBonus != isActive) {
            this._cacheActiveBonus = isActive;
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.BonusWandView, {
                root: MgrUi.root(2),
                callback: (view) => {
                    view.once(VIEW_ANIM_EVENT.Remove, () => {
                        callback?.();
                    });
                }
            });
            return;
        }
        callback?.();
    }

    reportOpen(): void {
        AnalyticsManager.getInstance().reportSuperWandOpen({
            Level_Id: MgrGame.Instance.gameData.curLv
        });
    }

    reportProgress(): void {
        AnalyticsManager.getInstance().reportSuperWandProgress({
            SuperProp_Count: this._data.winCount,
            SuperProp_Is: this.activeBonus ? 1 : 0
        });
    }

    reportProgressReset(): void {
        AnalyticsManager.getInstance().reportSuperWandReset({
            SuperProp_UseNum: this._data.useCount
        });
    }

    reportUseProp(propType: number): void {
        AnalyticsManager.getInstance().reportSuperWandUse({
            Prop_Type: propType,
            SuperProp_UseNum: this._data.useCount,
            Level_Id: MgrGame.Instance.gameData.curLv
        });
    }

    get winCount(): number {
        return this._data.winCount;
    }

    get cacheWinCnt(): number {
        return this._data.cacheWinCount;
    }

    get dirtyWinCount(): number {
        return this._data.dirtyWinCount;
    }

    get activeBonus(): boolean {
        return this._data.winCount >= GameConst.BONUS_WAND_WINCOUNT;
    }

    get status(): BonusWandStatus {
        return this._data.status;
    }

    get guided(): boolean {
        return this._data.guide == 1;
    }

    set guided(value: boolean) {
        this._data.guide = value ? 1 : 0;
    }

    get giftProp(): boolean {
        return this._data.giftProp == 1;
    }

    set giftProp(value: boolean) {
        this._data.giftProp = value ? 1 : 0;
    }

    static get Instance(): MgrBonusWand {
        return this._instance;
    }

    private static _instance: MgrBonusWand;
}
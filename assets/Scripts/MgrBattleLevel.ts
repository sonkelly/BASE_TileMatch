import { _decorator, director, assetManager, ImageAsset, SpriteFrame, Texture2D, cclegacy } from 'cc';
import {MgrBase} from './MgrBase';
import { BattleLevelData } from './BattleLevelData';
import { GameConst } from './GameConst';
import { SocialManager } from './SocialManager';
import {MgrUi} from './MgrUi';
import { UIPrefabs, IMAGE_FBHEAD_PATH } from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrGame, TileStatus } from './MgrGame';
import { GlobalEvent } from './Events';
import { GameMode } from './Const';
import { AppGame } from './AppGame';
import { SdkBridge } from './SdkBridge';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { LogicStatus } from './GameLogic';
import { Utils } from './Utils';
import { Tools } from './Tools';

const { ccclass, property } = _decorator;

@ccclass('MgrBattleLevel')
export class MgrBattleLevel extends MgrBase {
    private _data: BattleLevelData = null!;
    private _run: boolean = false;
    private _step: number = 0;
    private _collectTrigger: number = 0;
    private _triggerIdx: number = 0;

    private static _instance: MgrBattleLevel;
    public static get Instance(): MgrBattleLevel {
        return MgrBattleLevel._instance;
    }

    protected onLoad(): void {
        this._data = new BattleLevelData('battle-level-data');
    }

    public load(): void {
        this._data.load();
        director.on(GlobalEvent.CreateComplete, this._onLevelCreateComplete, this);
        director.on(GlobalEvent.RestoreComplete, this._onLevelRestoreComplete, this);
        director.on(GlobalEvent.GameStartup, this._onGameStartup, this);
        director.on(GlobalEvent.EliminateEvent, this._onEliminateEvent, this);
        director.on(GlobalEvent.ChangeGameLogicStatus, this._onChangeGameLogicStatus, this);
    }

    public initLoadData(): void {
        this._checkAiCollect();
    }

    protected lateUpdate(dt: number): void {
        if (this._run) {
            this._step += dt;
            if (this._step >= this._collectTrigger) {
                this._step = 0;
                this._triggerAiCollect();
                this._randomCollectTrigger();
            }
        }
    }

    private _starAiCollect(): void {
        this._run = true;
        this._step = 0;
        this._triggerIdx = 0;
        this._randomCollectTrigger();
    }

    private _stopAiCollect(): void {
        this._run = false;
    }

    private _randomCollectTrigger(): void {
        const timeRange = GameConst.ChanllengeAIAddNeedTime;
        const minTime = timeRange[0];
        const maxTime = timeRange[1];
        
        this._triggerIdx++;
        if (this._triggerIdx % 2 === 1) {
            this._collectTrigger = Utils.randomRangeFloat(minTime, maxTime);
        } else {
            this._collectTrigger = minTime + maxTime - this._collectTrigger;
        }
    }

    private _triggerAiCollect(): void {
        if (this._data.battleLevelAI.collectTileCnt >= this._data.battleLevelInfo.tileCnt) {
            this._stopAiCollect();
        } else {
            this._data.aiCollectTile(3);
            this._refreshOtherProgress();
        }
    }

    private _checkAiCollect(): void {
        if (this._data.battleLevelInfo && this._data.battleLevelAI && 
            !(this._data.battleLevelAI.collectTileCnt >= this._data.battleLevelInfo.tileCnt)) {
            
            const timeRange = GameConst.ChanllengeAIAddNeedTime;
            const minTime = timeRange[0];
            const maxTime = timeRange[1];
            const elapsedTime = (Tools.GetNowTime() - this._data.battleLevelAI.lastCollectTime) / 1000;
            const collectCount = 3 * (2 * Math.floor(elapsedTime / (minTime + maxTime)));
            
            this._data.aiCollectTile(collectCount);
        }
    }

    private _onLevelCreateComplete(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = MgrGame.Instance.gameData.curLv;
            if (this.checkIsBattleLevel(level)) {
                const tileCount = AppGame.gameCtrl.curLogic.map.tileList.length;
                this._data.setBattleInfoTileCnt(level, tileCount);
                this._refershSelfProgress();
                this._refreshOtherProgress();
            }
        }
    }

    private _onLevelRestoreComplete(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = MgrGame.Instance.gameData.curLv;
            if (this.checkIsBattleLevel(level)) {
                const points = MgrGame.Instance.gameData?.levelData?.points || [];
                this._data.setBattleInfoTileCnt(level, points.length);
                this._refershSelfProgress();
                this._refreshOtherProgress();
            }
        }
    }

    private _onGameStartup(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = MgrGame.Instance.gameData.curLv;
            if (this.checkIsBattleLevel(level)) {
                this._starAiCollect();
            }
        }
    }

    private _onEliminateEvent(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = MgrGame.Instance.gameData.curLv;
            if (this.checkIsBattleLevel(level)) {
                this._refershSelfProgress();
            }
        }
    }

    private _onChangeGameLogicStatus(): void {
        const logicStatus = AppGame?.gameCtrl?.curLogic?.logicStatus || LogicStatus.None;
        
        switch (logicStatus) {
            case LogicStatus.Enter:
                this._onLogicEnter();
                break;
            case LogicStatus.Victory:
                this._onLogicVictory();
                break;
            case LogicStatus.Exit:
                this._onLogicExit();
                break;
        }
    }

    private _onLogicEnter(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = MgrGame.Instance.gameData.curLv;
            if (this.checkIsBattleLevel(level)) {
                this._refershSelfProgress();
                this._refreshOtherProgress();
                
                AppGame.topUI?.battleLevelTop?.battleLevelTopEnter?.();
                AppGame.gameUI?.clearLevelInfo?.();
                AppGame.topUI?.battleLevelTophide?.();
            }
        }
    }

    private _onLogicVictory(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = MgrGame.Instance.gameData.curLv;
            if (this.checkIsBattleLevel(level)) {
                const totalTiles = this._data.battleLevelInfo.tileCnt;
                const progressText = `${totalTiles}/${totalTiles}`;
                
                AppGame.topUI?.battleLevelTop?.refreshSelfProgress?.(progressText, 1);
                this._stopAiCollect();
            }
        }
    }

    private _onLogicExit(): void {
        AppGame.topUI?.battleLevelTop?.battleLevelTopExit?.();
        AppGame.topUI?.goldCubeBtn?.fixGoldCubeShowPosition?.();
        AppGame.topUI?.tileCoinBtn?.fixTileCoinsShowPosition?.();
    }

    private _refershSelfProgress(): void {
        const totalTiles = this._data.battleLevelInfo.tileCnt;
        const removedTiles = this._getRemoveTileCount();
        const progressText = `${removedTiles}/${totalTiles}`;
        const progressRatio = removedTiles / totalTiles;
        
        AppGame.topUI?.battleLevelTop?.refreshSelfProgress?.(progressText, progressRatio);
    }

    private _refreshOtherProgress(): void {
        const totalTiles = this._data.battleLevelInfo.tileCnt;
        const aiCollectedTiles = this._data.battleLevelAI?.collectTileCnt || 0;
        const progressText = `${aiCollectedTiles}/${totalTiles}`;
        const progressRatio = aiCollectedTiles / totalTiles;
        
        AppGame.topUI?.battleLevelTop?.refreshOtherProgress?.(progressText, progressRatio);
    }

    private _getRemoveTileCount(): number {
        const points = MgrGame.Instance.gameData?.levelData?.points || [];
        let count = 0;
        
        for (let i = 0; i < points.length; i++) {
            if (points[i].status === TileStatus.Remove) {
                count++;
            }
        }
        
        return count;
    }

    public checkIsBattleLevel(level: number): boolean {
        return (level - GameConst.ChanllengeStartLevel) % GameConst.ChanllengeIntervalLevel === 0;
    }

    public createBattleLevel(callback?: () => void): void {
        const level = MgrGame.Instance.gameData.curLv;
        this._data.refreshBattleInfo(level);
        
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.BattleLevelStartView, {
            priority: 2,
            callback: (view) => {
                view.once(VIEW_ANIM_EVENT.Remove, () => {
                    callback?.();
                });
            }
        });
    }

    public clearBattleInfo(): void {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            const level = MgrGame.Instance.gameData.curLv;
            if (this.checkIsBattleLevel(level)) {
                this._data.clearBattleInfo();
            }
        }
    }

    public createBattleLevelSocial(callback?: () => void): void {
        const competitorId = this._data.getBattleCompetitorId();
        
        if (competitorId) {
            SocialManager.instance().battleLevelSocialPlayer(() => {
                AppGame.topUI?.battleLevelTop?.initHeadAndNick?.();
                callback?.();
            }, competitorId);
        } else {
            SocialManager.instance().battleLevelSocial((competitor) => {
                this._data.setBattleCompetitor(competitor);
                AppGame.topUI?.battleLevelTop?.initHeadAndNick?.();
                callback?.();
            }, this._data.battleIndex);
        }
    }

    public async initBattleLevelHeads(selfHead: any, otherHead: any): Promise<void> {
        const playerPhotoUrl = SdkBridge.getPlayerPhotoUrl();
        
        assetManager.downloader.downloadDomImage(playerPhotoUrl, { ext: '.jpg' }, (err, image) => {
            if (!err && selfHead?.isValid) {
                const imageAsset = new ImageAsset(image);
                const spriteFrame = new SpriteFrame();
                const texture = new Texture2D();
                
                texture.image = imageAsset;
                spriteFrame.texture = texture;
                selfHead.spriteFrame = spriteFrame;
            }
        });

        const competitor = this._data.battleCompetitor;
        
        if (competitor.id) {
            assetManager.downloader.downloadDomImage(competitor.head, { ext: '.jpg' }, (err, image) => {
                if (!err && otherHead?.isValid) {
                    const imageAsset = new ImageAsset(image);
                    const spriteFrame = new SpriteFrame();
                    const texture = new Texture2D();
                    
                    texture.image = imageAsset;
                    spriteFrame.texture = texture;
                    otherHead.spriteFrame = spriteFrame;
                }
            });
        } else {
            otherHead.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, `${IMAGE_FBHEAD_PATH}/${competitor.head}`);
        }
    }

    public initNick(selfNick: any, otherNick: any): void {
        selfNick.string = SdkBridge.getPlayerName();
        otherNick.string = this._data.battleCompetitor.name || '';
    }

    public addToCreateFlows(callback: () => void): void {
        MgrUi.Instance.openViewAsync(UIPrefabs.BattleLevelPKView, {
            callback: (view) => {
                view.once(VIEW_ANIM_EVENT.Removed, () => {
                    callback();
                });
            }
        });
    }

    public addToPlayVictoryFlows(callback: () => void): void {
        const aiCollectedTiles = this._data.battleLevelAI?.collectTileCnt || 0;
        const totalTiles = this._data.battleLevelInfo?.tileCnt || 0;
        const lastCollectTime = this._data.battleLevelAI?.lastCollectTime || 0;
        
        let shouldShowWinView = true;
        
        if (aiCollectedTiles >= totalTiles && lastCollectTime < Tools.GetNowTime()) {
            shouldShowWinView = false;
        }
        
        if (shouldShowWinView) {
            MgrUi.Instance.openViewAsync(UIPrefabs.BattleLevelWinView, {
                callback: (view) => {
                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                        callback();
                    });
                }
            });
        } else {
            callback();
        }
    }

    public get data(): BattleLevelData {
        return this._data;
    }
}
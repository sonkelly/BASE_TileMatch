import { _decorator, JsonAsset, TextAsset, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import { GameData } from './GameData';
import { shuffle, cloneDeep, reverse, fill, trim } from 'lodash-es';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES, CacheInfo } from './AssetRes';
import { Tools } from './Tools';
import { UIPrefabs } from './Prefabs';
import { AppGame } from './AppGame';
import { MgrUi } from './MgrUi';
import { ITEM, GameConst } from './GameConst';
import { config } from './Config';
import { MgrAnalytics } from './MgrAnalytics';
import { AnalyticsManager } from './AnalyticsManager';
import { AsyncQueue } from './AsyncQueue';
import { MgrChallenge } from './MgrChallenge';
import { Adjust } from './Adjust';
import XXTEA from './xxtea';
import { MgrWinStreak } from './MgrWinStreak';
import { MgrPig } from './MgrPig';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { MgrRace } from './MgrRace';
import { MgrShop } from './MgrShop';
import { GUIDE_PROP_UNDO, GUIDE_PROP_WAND, GUIDE_PROP_SHUFFLE, GameMode } from './Const';
import { HardLevelCfg } from './HardLevelCfg';
import { MgrMine } from './MgrMine';
import { MgrUser } from './MgrUser';
import { MgrBonusWand } from './MgrBonusWand';
import { MineMenu } from './MineMenu';
import { MgrBattleLevel } from './MgrBattleLevel';

const { ccclass, property } = _decorator;

// Constants
const ENCRYPT_KEY = 'fu03f6ck-bfbd-4d';
const ENCRYPT_PREFIX = 'fuck!!';

// Enums
export enum GameStatus {
    None = 0,
    Enter = 1,
    Playing = 2,
    Ended = 3
}

export enum GiveupType {
    Retry = 0,
    Home = 1
}

export enum TileStatus {
    Init = 0,
    Gray = 1,
    Light = 2,
    Collect = 3,
    Remove = 4
}

// Constants
export const MAX_COLLECTED = 7;
export const MAX_ROW = 8;
export const MIN_ROW = 6;

// Prop guide configuration
const PROP_GUIDES = {
    [ITEM.Back]: {
        lv: GameConst.PropUndoLockLv,
        guideId: GUIDE_PROP_UNDO,
        desc: 'Item_guide1'
    },
    [ITEM.Hint]: {
        lv: GameConst.PropWandLockLv,
        guideId: GUIDE_PROP_WAND,
        desc: 'Item_guide2'
    },
    [ITEM.Fresh]: {
        lv: GameConst.PropShuffleLockLv,
        guideId: GUIDE_PROP_SHUFFLE,
        desc: 'Item_guide3'
    }
};

@ccclass('MgrGame')
export class MgrGame extends MgrBase {
    private static _instance: MgrGame;
    
    private _gameData: GameData | null = null;
    private _minMaxTypes: { [key: number]: { min: number, max: number } } = {};
    private _wisdom: number = 0;
    private _orientation: number = 0;
    private _victoryGold: boolean = false;
    private _goldLighting: boolean = false;
    
    public algorithmFuncs: Function[] = [];
    public enterQuery: AsyncQueue = new AsyncQueue();
    public levelConfigs: { [key: string]: any } = {};

    public static get Instance(): MgrGame {
        return MgrGame._instance;
    }

    onLoad(): void {
        this._gameData = new GameData('game-data');
        MgrGame._instance = this;
    }

    public load(): Promise<void> {
        return (async () => {
            this._gameData!.load();
            this._minMaxTypes = await this.loadMinMaxTypeCfg();
        })();
    }

    public initLoadData(): void {
        this.algorithmFuncs.push(this.mixElement0.bind(this));
        this.algorithmFuncs.push(this.mixElement1.bind(this));
        this.algorithmFuncs.push(this.mixElement2.bind(this));
        this.algorithmFuncs.push(this.fillElement.bind(this));
    }

    public getMinMaxType(level: number): { min: number, max: number } {
        const key = 1 + (level - 1) % 10000;
        return this._minMaxTypes[key];
    }

    public pause(): void {
        // Implementation for pausing the game
    }

    public resume(): void {
        // Implementation for resuming the game
    }

    public loadMinMaxTypeCfg(): Promise<{ [key: number]: { min: number, max: number } }> {
        return new Promise((resolve, reject) => {
            AssetMgr.Instance.load(BUNDLE_NAMES.Game, 'Cfgs/MinMaxTileTypes', JsonAsset, null, (asset: CacheInfo) => {
                const jsonData = asset.assets.json;
                const result: { [key: number]: { min: number, max: number } } = {};
                
                jsonData.forEach((item: any, index: number) => {
                    const min = item[0];
                    const max = item[1];
                    result[index + 1] = { min, max };
                });
                
                resolve(result);
            });
        });
    }

    public convertLevelCfg(levelData: any[]): any[] {
        const result: any[] = [];
        
        for (let i = 0; i < levelData.length; i++) {
            const level = levelData[i];
            const positions: any[] = [];
            
            if (level && level.length > 0) {
                const parts = level.split(',');
                
                for (let j = 0; j < parts.length; j++) {
                    const coords = parts[j].split('|');
                    
                    if (coords.length === 2) {
                        positions.push({
                            x: Number(coords[0]),
                            y: Number(coords[1])
                        });
                    } else {
                        console.error('转换关卡数据失败：', levelData);
                    }
                }
            }
            
            result[i] = positions;
        }
        
        return result;
    }

    public loadLevelCfg(levelId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const levelKey = '' + levelId;
            const cachedConfig = this.levelConfigs[levelKey];
            
            if (cachedConfig) {
                resolve(cachedConfig);
                return;
            }
            
            AssetMgr.Instance.load(BUNDLE_NAMES.GameLevels, levelKey, TextAsset, null, (asset: CacheInfo) => {
                const text = asset.assets.text;
                const decryptedText = XXTEA.decryptFromBase64(text.substring(ENCRYPT_PREFIX.length), ENCRYPT_KEY);
                const parsedData = JSON.parse(trim(decryptedText));
                const convertedData = this.convertLevelCfg(parsedData);
                
                this.levelConfigs[levelKey] = convertedData;
                resolve(convertedData);
            });
        });
    }

    public mixElement0(layers: any[], ratio: number): any[] {
        let allElements: any[] = [];
        layers.forEach(layer => {
            allElements = allElements.concat(layer);
        });
        
        const lastLayerLength = layers[layers.length - 1].length;
        const keepCount = Math.ceil(lastLayerLength * (1 - ratio / 100));
        let result = allElements.splice(0, keepCount);
        
        shuffle(result);
        
        for (let i = layers.length - 2; i >= 0; i--) {
            const layerLength = layers[i].length;
            const takeCount = layerLength - Math.floor(layerLength * (ratio / 100));
            const takenElements = allElements.splice(0, Math.min(takeCount, allElements.length));
            
            shuffle(takenElements);
            result = result.concat(takenElements);
        }
        
        if (allElements.length > 0) {
            shuffle(allElements);
            result = result.concat(allElements);
        }
        
        return reverse(result);
    }

    public mixElement1(layers: any[], ratio: number): any[] {
        let allElements: any[] = [];
        layers.forEach(layer => {
            allElements = allElements.concat(layer);
        });
        
        const lastLayerLength = layers[layers.length - 1].length;
        const keepCount = Math.ceil(lastLayerLength * (1 - ratio / 100));
        let result = allElements.splice(0, keepCount);
        
        shuffle(result);
        
        for (let i = layers.length - 2; i >= 0; i--) {
            const layerLength = layers[i].length;
            const takeCount = layerLength + Math.floor(layerLength * (ratio / 100));
            const takenElements = allElements.splice(0, Math.min(takeCount, allElements.length));
            
            shuffle(takenElements);
            result = result.concat(takenElements);
        }
        
        if (allElements.length > 0) {
            shuffle(allElements);
            result = result.concat(allElements);
        }
        
        return reverse(result);
    }

    public mixElement2(layers: any[], ratio: number): any[] {
        for (let i = layers.length - 1; i > 0; i--) {
            const currentLayer = layers[i];
            const previousLayer = layers[i - 1];
            
            if (currentLayer && currentLayer.length > 0) {
                const swapResult = this._swopElementFromArray(
                    currentLayer, 
                    previousLayer, 
                    Math.floor(currentLayer.length * (ratio / 100))
                );
                
                layers[i] = swapResult.preShuffle;
                layers[i - 1] = swapResult.nextShuffle;
            }
        }
        
        let result: any[] = [];
        layers.forEach(layer => {
            result = result.concat(layer);
        });
        
        return result;
    }

    public fillElement(count: number, value: any): any[] {
        const result = new Array(count);
        return fill(result, value);
    }

    private _swopElementFromArray(sourceArray: any[], targetArray: any[], count: number): { preShuffle: any[], nextShuffle: any[] } {
        const takenElements = sourceArray.splice(sourceArray.length - count, count);
        targetArray = targetArray.concat(takenElements);
        
        const shuffledTarget = shuffle(targetArray);
        sourceArray = sourceArray.concat(shuffledTarget.splice(0, count));
        
        return {
            preShuffle: shuffle(sourceArray),
            nextShuffle: shuffledTarget
        };
    }

    public calcAlgorithmIcons(layers: any[], algorithmIndex: number, ratio: number): any[] {
        return this.algorithmFuncs[algorithmIndex].call(this, layers, ratio);
    }

    public async loadConfigLevel(levelId: string): Promise<any> {
        const levelData = await this.loadLevelCfg(levelId);
        return config.debug ? this.resolveRotate(cloneDeep(levelData)) : levelData;
    }

    public resolveRotate(levelData: any): any {
        const orientation = MgrGame.Instance.orientation % 360;
        
        if (config.debug && orientation) {
            levelData.forEach((layer: any[], layerIndex: number) => {
                layer.forEach((position: any, positionIndex: number) => {
                    const x = position.x;
                    const y = position.y;
                    
                    switch (orientation) {
                        case 90:
                            levelData[layerIndex][positionIndex] = { x: -y, y: x };
                            break;
                        case 180:
                            levelData[layerIndex][positionIndex] = { x: -x, y: -y };
                            break;
                        case 270:
                            levelData[layerIndex][positionIndex] = { x: y, y: -x };
                            break;
                        default:
                            levelData[layerIndex][positionIndex] = position;
                    }
                });
            });
        }
        
        return levelData;
    }

    public getGameMode(level: number): GameMode {
        return HardLevelCfg.Instance.get(level) ? GameMode.Hard : GameMode.Level;
    }

    public enterLevel(callback?: Function): void {
        this.enterQuery.clear();
        
        this.enterQuery.push((next: Function) => {
            if (MgrBattleLevel.Instance.checkIsBattleLevel(MgrGame.Instance.gameData.curLv)) {
                MgrBattleLevel.Instance.createBattleLevel(next);
            } else {
                next();
            }
        });
        
        this.enterQuery.complete = () => {
            const gameMode = this.getGameMode(this.gameData.curLv);
            
            AppGame.Ins.switchToGame(gameMode, () => {
                AppGame.gameBg.tryChange(() => {});
                AppGame.gameCtrl.createGame();
                MgrShop.Instance.checkShopRemoveTip();
                
                const level = this.gameData.curLv;
                MgrAnalytics.Instance.data.addPlayTime(level);
                this.reportLevelStart(level);
                MgrAnalytics.Instance.startGameTime();
                
                callback && callback();
            });
        };
        
        this.enterQuery.play();
    }

    public enterNextLevel(): void {
        this.enterQuery.clear();
        
        this.enterQuery.push((next: Function) => {
            if (MgrBattleLevel.Instance.checkIsBattleLevel(MgrGame.Instance.gameData.curLv)) {
                MgrBattleLevel.Instance.createBattleLevel(next);
            } else {
                next();
            }
        });
        
        this.enterQuery.push((next: Function) => {
            AppGame.topUI.show();
            AppGame.gameBg.tryChange(next);
        });
        
        this.enterQuery.push((next: Function) => {
            AppGame.gameUI.enter(this.getGameMode(this.gameData.curLv), next);
        });
        
        this.enterQuery.complete = () => {
            const level = MgrGame.Instance.gameData.curLv;
            AppGame.gameCtrl.createGame();
            MgrAnalytics.Instance.data.addPlayTime(level);
            this.reportLevelStart(level);
            MgrAnalytics.Instance.startGameTime();
            MgrGame.Instance.gameData.lossTime = 0;
            AppGame.Ins.closeBlack();
            MgrShop.Instance.checkShopRemoveTip();
        };
        
        this.enterQuery.play();
    }

    public saveMap(collected: any, collectPoolCnt: number, goldCube: any, points: any, attachs: any = {}): void {
        const clonedCollected = cloneDeep(collected);
        const clonedPoints = cloneDeep(points);
        
        const levelData = {
            level: this.gameData.curLv,
            collected: clonedCollected,
            points: clonedPoints,
            attachs: attachs,
            collectPoolCnt: collectPoolCnt,
            goldCube: goldCube
        };
        
        this.gameData.levelData = levelData;
    }

    public clearMap(): void {
        this.gameData.levelData = null;
    }

    public getPropGuide(itemType: string): any {
        if (AppGame.gameCtrl.currMode === GameMode.Challenge) {
            return null;
        }
        
        const guideConfig = PROP_GUIDES[itemType];
        return this.gameData.curLv === guideConfig.lv && !this.gameData.getGuided(guideConfig.guideId) ? guideConfig : undefined;
    }

    public victory(rewards: any, items: any): void {
        if (this.gameData.curLv === this.gameData.maxLv) {
            Adjust.sendEventLevelSuccess(this.gameData.maxLv);
        }
        
        console.log('关卡结算');
        MgrGame.Instance.clearMap();
        
        if (MgrGame.Instance.gameData.curLv === MgrGame.Instance.gameData.maxLv) {
            MgrGame.Instance.victoryGold = true;
            MgrGame.Instance.goldLighting = true;
            MgrPig.Instance.addPigCoin();
            MgrPig.Instance.addPassLevelCnt();
        }
        
        MgrRace.Instance.addSelfProgress(this.gameData.curLv);
        
        const pickaxeCount = items[ITEM.PickAxe] || 0;
        const mineOpen = MgrMine.Instance.isOpen();
        const mineFinished = MgrMine.Instance.isFinish();
        
        if (pickaxeCount > 0 && mineOpen && !mineFinished) {
            MgrUser.Instance.userData.addItem(ITEM.PickAxe, pickaxeCount, { type: 'Mining' });
            
            const mineMenu = AppGame.topUI.mineBtn.getComponent(MineMenu);
            if (mineMenu) {
                mineMenu.addPickAxe(pickaxeCount);
            }
            
            MgrMine.Instance.reportMiningPickaxeGet(pickaxeCount, 1);
        }
        
        MgrAnalytics.Instance.data.addWinTime(this.gameData.curLv);
        this.reportLevelVictory(this.gameData.curLv);
        this.gameData.addGameLevel();
    }

    public failed(): void {
        MgrGame.Instance.clearMap();
        MgrAnalytics.Instance.data.addLossTime(this.gameData.curLv);
        this.reportLevelFail(this.gameData.curLv);
        this.gameData.addGameFail();
        this.preDealLevelFailed();
    }

    public preDealLevelFailed(): void {
        if (!MgrWinStreak.Instance.isMaxStage()) {
            MgrWinStreak.Instance.clearStreakTime();
        }
        
        if (!MgrWinStreakV2.Instance.isMaxStage()) {
            MgrWinStreakV2.Instance.clearStreakTime();
        }
        
        this.gameData.dirtyWinStreak = this.gameData.winStreak;
        this.gameData.winStreak = 0;
        
        MgrRace.Instance.checkRaceFailedMustLevel(MgrGame.Instance.gameData.curLv);
    }

    public reviveLevel(reviveType: string): void {
        if (MgrWinStreak.Instance.checkInWinStreak()) {
            MgrWinStreak.Instance.rewriteStreakTime();
        } else {
            MgrWinStreakV2.Instance.rewriteStreakTime();
        }
        
        this.gameData.winStreak = MgrGame.Instance.gameData.dirtyWinStreak;
        MgrRace.Instance.clearRaceFailedMustLevel();
        this.reportLevelRevive(reviveType);
    }

    public giveUpReviveCall(giveupType: GiveupType): void {
        this.gameData.dirtyWinStreak = 0;
        this.gameData.winStreak = 0;
        
        if (giveupType === GiveupType.Retry) {
            const isMustFailLevel = MgrRace.Instance.data.mustFailLevel === this.gameData.curLv;
            const isRaceMust = MgrRace.Instance.isRaceMust(this.gameData.curLv);
            
            if (isMustFailLevel && isRaceMust) {
                MgrRace.Instance.checkCanEndRace();
                MgrUi.Instance.openViewAsync(UIPrefabs.RaceView);
            }
        }
    }

    public getReviveCnt(): number {
        return AppGame.gameCtrl.currMode === GameMode.Challenge ? 
            MgrChallenge.Instance.getReviveTime() : 
            this.gameData.reviveCnt;
    }

    public trySalvage(callback: Function): void {
        const reviveCount = MgrGame.Instance.getReviveCnt();
        const hasWinStreak1 = MgrWinStreak.Instance.isShowClearView() && !MgrWinStreak.Instance.isMaxStage();
        const hasWinStreak2 = MgrWinStreakV2.Instance.isShowClearView() && !MgrWinStreakV2.Instance.isMaxStage();
        const isRaceMust = MgrRace.Instance.isRaceMust(MgrGame.Instance.gameData.curLv) && MgrRace.Instance.checkRaceOpen();
        const hasGoldCube = AppGame.gameCtrl.curLogic.collectGoldCube > 0;
        const hasMine = (AppGame.gameCtrl.curLogic.collectedAttachs[ITEM.PickAxe] || 0) > 0;
        const activeBonusWand = MgrBonusWand.Instance.dirtyWinCount > 0;
        
        if ((hasWinStreak1 || hasWinStreak2 || isRaceMust || hasGoldCube || hasMine || activeBonusWand) && reviveCount === 0) {
            MgrUi.Instance.openViewAsync(UIPrefabs.GameClearView, {
                priority: 2,
                data: {
                    hasWinStreak1: hasWinStreak1,
                    hasWinStreak2: hasWinStreak2,
                    isRaceMust: isRaceMust,
                    hasGoldCube: hasGoldCube,
                    hasMine: hasMine,
                    activeBonusWand: activeBonusWand,
                    confirmCall: () => {
                        this.reportWinStreakFail();
                        callback(false);
                    },
                    continueCall: (data: any) => {
                        callback(true, data);
                    }
                }
            });
        } else {
            callback(false);
        }
    }

    public async onGmRotateSave(): Promise<void> {
        let levelId = '';
        
        if (AppGame.gameCtrl.currMode === GameMode.Challenge) {
            levelId = 'ChallengeLevel_' + MgrChallenge.Instance.curLv;
        } else {
            levelId = 'Level_' + MgrGame.Instance.gameData.curLv;
        }
        
        const levelConfig = await this.loadLevelCfg(levelId);
        const rotatedConfig = this.resolveRotate(cloneDeep(levelConfig));
        
        const saveData: string[] = [];
        
        for (let i = 0; i < rotatedConfig.length; i++) {
            const layerData: string[] = [];
            const layer = rotatedConfig[i];
            
            for (let j = 0; j < layer.length; j++) {
                const position = layer[j];
                layerData.push(position.x + '|' + position.y);
            }
            
            saveData[i] = layerData.join(',');
        }
        
        console.warn('saveObj', saveData);
        const jsonData = JSON.stringify(saveData);
        let resultMessage = '';
        
        try {
            const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: levelId,
                types: [{
                    description: '保存文件',
                    accept: {
                        'text/plain': ['.txt']
                    }
                }]
            });
            
            const writable = await fileHandle.createWritable();
            const encryptedData = ENCRYPT_PREFIX + XXTEA.encryptToBase64(jsonData, ENCRYPT_KEY);
            await writable.write(encryptedData);
            await writable.close();
            
            resultMessage = '保存成功: ' + fileHandle.name;
            alert(resultMessage);
        } catch (error) {
            console.log(error);
            resultMessage = '保存失败: ' + (error as Error).message;
            alert(resultMessage);
        }
    }

    public reportLevelStart(level: number): void {
        const playTime = MgrAnalytics.Instance.data.getPlayTime(level);
        const levelType = playTime === 1 ? 'New' : 'Continue';
        let levelMode = 'Normal';
        const failTimes = MgrAnalytics.Instance.data.getLossTime(level);
        
        if (HardLevelCfg.Instance.get(level)) {
            levelMode = 'Hard';
        } else if (HardLevelCfg.Instance.get(level - 1)) {
            levelMode = 'Reward';
        }
        
        const data = {
            Level_Id: level,
            Level_Type: levelType,
            Level_Mode: levelMode,
            In_Times: playTime,
            FailTimes: failTimes
        };
        
        AnalyticsManager.getInstance().reportLevelStart(data);
    }

    public reportLevelVictory(level: number): void {
        const winTime = MgrAnalytics.Instance.data.getWinTime(level);
        const gameDuration = Math.floor(MgrAnalytics.Instance.gameTime);
        let levelMode = 'Normal';
        
        if (HardLevelCfg.Instance.get(level)) {
            levelMode = 'Hard';
        } else if (HardLevelCfg.Instance.get(level - 1)) {
            levelMode = 'Reward';
        }
        
        const data = {
            Level_Id: level,
            Level_Mode: levelMode,
            Game_Duration: gameDuration,
            Duration: gameDuration,
            WinStreak_Num: MgrGame.Instance.gameData.winStreak,
            Wintimes: winTime
        };
        
        AnalyticsManager.getInstance().reportLevelVictory(data);
    }

    public reportLevelFail(level: number): void {
        let levelMode = 'Normal';
        
        if (HardLevelCfg.Instance.get(level)) {
            levelMode = 'Hard';
        } else if (HardLevelCfg.Instance.get(level - 1)) {
            levelMode = 'Reward';
        }
        
        const data = {
            Level_Id: level,
            Level_Mode: levelMode,
            Game_Duration: Math.floor(MgrAnalytics.Instance.gameTime)
        };
        
        AnalyticsManager.getInstance().reportLevelFail(data);
    }

    public reportLevelRevive(reviveType: string): void {
        const level = MgrGame.Instance.gameData.curLv;
        let levelMode = 'Normal';
        
        if (HardLevelCfg.Instance.get(level)) {
            levelMode = 'Hard';
        } else if (HardLevelCfg.Instance.get(level - 1)) {
            levelMode = 'Reward';
        }
        
        const data = {
            Level_Id: level,
            Level_Mode: levelMode,
            ReviveType: reviveType,
            FailTimes: MgrAnalytics.Instance.data.getLossTime(level)
        };
        
        AnalyticsManager.getInstance().reportLevelRevive(data);
    }

    public reportWinStreakFail(): void {
        const hasWinStreak1 = MgrWinStreak.Instance.isShowClearView() && !MgrWinStreak.Instance.isMaxStage();
        const hasWinStreak2 = MgrWinStreakV2.Instance.isShowClearView() && !MgrWinStreakV2.Instance.isMaxStage();
        
        if (hasWinStreak1) {
            const beforeNum = MgrWinStreak.Instance.lastLv;
            const maxNum = MgrWinStreak.Instance.data.maxTime;
            
            AnalyticsManager.getInstance().reportWinStreakFail({
                WinStreak_BeforeNum: beforeNum,
                WinStreak_Max: maxNum,
                WinStreak_Type: 1
            });
        } else if (hasWinStreak2) {
            const beforeNum = MgrWinStreakV2.Instance.lastLv;
            const maxNum = MgrWinStreakV2.Instance.data.maxTime;
            
            AnalyticsManager.getInstance().reportWinStreakFail({
                WinStreak_BeforeNum: beforeNum,
                WinStreak_Max: maxNum,
                WinStreak_Type: 2
            });
        }
    }

    // Getters and setters
    get gameData(): GameData {
        return this._gameData!;
    }

    get wisdom(): number {
        return this._wisdom;
    }

    set wisdom(value: number) {
        this._wisdom = value;
    }

    get orientation(): number {
        return config.debug ? this._orientation : 0;
    }

    set orientation(value: number) {
        this._orientation = value;
    }

    get victoryGold(): boolean {
        return this._victoryGold;
    }

    set victoryGold(value: boolean) {
        this._victoryGold = value;
    }

    get goldLighting(): boolean {
        return this._goldLighting;
    }

    set goldLighting(value: boolean) {
        this._goldLighting = value;
    }
}
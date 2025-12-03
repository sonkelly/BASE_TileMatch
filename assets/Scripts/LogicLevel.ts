import { _decorator, cclegacy, director } from 'cc';
import { LogicStatus, GameLogic } from './GameLogic';
import { MgrGame } from './MgrGame';
import { ITEM, GameConst } from './GameConst';
import {LevelCfg} from './LevelCfg';
import LevelAlgorithmCfg from './LevelAlgorithmCfg';
import { MgrAnalytics } from './MgrAnalytics';
import { GlobalEvent } from './Events';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { AppGame } from './AppGame';
import { MgrMine } from './MgrMine';

const { ccclass, property } = _decorator;

@ccclass('LogicLevel')
export class LogicLevel extends GameLogic {
    getCurrLevel(): number {
        return MgrGame.Instance.gameData.curLv;
    }

    getStorageData(level: number): any {
        const levelData = MgrGame.Instance.gameData.levelData;
        return levelData && levelData.level == level ? levelData : null;
    }

    async loadLevelCfg(level: number){
        const levelName = 'Level_' + (1 + (level - 1) % GameConst.MAX_LEVEL_CFG);
        return await MgrGame.Instance.loadConfigLevel(levelName);
    }

    getElementCnt(type: number): number {
        const minMax = MgrGame.Instance.getMinMaxType(type);
        const min = minMax.min;
        const max = minMax.max;
        const failCnt = MgrGame.Instance.gameData.failCnt;
        const result = min + MgrGame.Instance.gameData.difficulty - Math.max(0, failCnt - 2);
        return Math.max(min, Math.min(max, result));
    }

    getAlgorithm(level: number): { algorithm: string, algorithmParam: any } {
        let cfg = LevelCfg.Instance.getCfg(level);
        let algorithm = cfg.algorithm;
        let param = cfg.param;
        
        const algorithmCfg = LevelAlgorithmCfg.Instance.get(level);
        if (algorithmCfg) {
            algorithm = algorithmCfg.algorithm;
            param = algorithmCfg.param;
        }
        
        return {
            algorithm: algorithm,
            algorithmParam: param
        };
    }

    restoreExtraToFlows(flows: Function[]): void {
        flows.push((next: Function) => {
            if (this.delegate.isGoldTourOpen) {
                const tileList = AppGame?.gameCtrl?.gameMap?.tileList || [];
                let hasGoldTile = false;
                
                for (let i = 0; i < tileList.length; i++) {
                    if (tileList[i].tIdx == ITEM.GoldenTile) {
                        hasGoldTile = true;
                        break;
                    }
                }
                
                const collectGoldCube = AppGame?.gameCtrl?.curLogic?.collectGoldCube || 0;
                
                if (hasGoldTile || collectGoldCube) {
                    AppGame.topUI.goldCubeBtn.showGoldCube(this.collectGoldCube);
                }
            }
            next();
        });
    }

    createExtraToFlows(flows: Function[]): void {
        const hasGoldCube = this.createDefaultGoldCubeToFlow(flows);
        this.createLightGoldCubeToFlow(hasGoldCube, flows);
    }

    createDefaultGoldCubeToFlow(flows: Function[]): boolean {
        const gameData = MgrGame.Instance.gameData;
        const isGoldTourOpen = this.delegate.isGoldTourOpen;
        const shouldCreate = this.getCurrLevel() == gameData.maxLv && gameData.failCnt == 0 && isGoldTourOpen;
        
        if (shouldCreate) {
            flows.push((next: Function) => {
                this.map.createGoldCube(GameConst.GOLDTOURNAMENT_GOLDTILE_NUM);
                next();
            });
        }
        
        return shouldCreate;
    }

    createLightGoldCubeToFlow(hasGoldCube: boolean, flows: Function[]): void {
        // Implementation would go here
    }

    getAttachInfo(): Record<number, number> {
        const level = this.getCurrLevel();
        const result: Record<number, number> = {};
        
        const isMineOpen = MgrMine.Instance.isOpen();
        const isMineFinish = MgrMine.Instance.isFinish();
        const isMaxLevel = level >= MgrGame.Instance.gameData.maxLv;
        
        if (isMineOpen && !isMineFinish && isMaxLevel) {
            const pickAxeCnt = MgrMine.Instance.getAttachPickAxeCnt();
            result[ITEM.PickAxe] = pickAxeCnt;
        }
        
        return result;
    }

    onAfterRestore(): void {
        const propTypes = [ITEM.Hint, ITEM.Fresh];
        
        for (let i = 0; i < propTypes.length; i++) {
            const propType = propTypes[i];
            const guideData = MgrGame.Instance.getPropGuide(propType);
            
            if (guideData) {
                this.logicStatus = LogicStatus.Guide;
                this.delegate.option.guide(propType, guideData);
                break;
            }
        }
        
        if (this.collector.Collected.length > 0) {
            const backGuide = MgrGame.Instance.getPropGuide(ITEM.Back);
            if (backGuide) {
                this.logicStatus = LogicStatus.Guide;
                this.scheduleOnce(() => {
                    this.delegate.option.guide(ITEM.Back, backGuide);
                }, 0.25);
            }
        }
        
        const collectedPickAxe = this._collectedAttachs[ITEM.PickAxe] || 0;
        const isMineOpen = MgrMine.Instance.isOpen();
        const isMaxLevel = MgrGame.Instance.gameData.curLv >= MgrGame.Instance.gameData.maxLv;
        const isMineFinish = MgrMine.Instance.isFinish();
        const tileList = AppGame?.gameCtrl?.gameMap?.tileList || [];
        
        let pickAxeOnMap = 0;
        for (let i = 0; i < tileList.length; i++) {
            if (tileList[i].attachId == ITEM.PickAxe) {
                pickAxeOnMap++;
            }
        }
        
        if (isMineOpen && isMaxLevel && !isMineFinish && (collectedPickAxe > 0 || pickAxeOnMap > 0)) {
            AppGame.topUI.normalMine.playShow(collectedPickAxe);
        }
    }

    onAfterCreate(): void {
        const propTypes = [ITEM.Hint, ITEM.Fresh];
        
        for (let i = 0; i < propTypes.length; i++) {
            const propType = propTypes[i];
            const guideData = MgrGame.Instance.getPropGuide(propType);
            
            if (guideData) {
                this.delegate.option.guide(propType, guideData);
                break;
            }
        }
        
        const collectedPickAxe = this._collectedAttachs[ITEM.PickAxe] || 0;
        const isMineOpen = MgrMine.Instance.isOpen();
        const isMaxLevel = MgrGame.Instance.gameData.curLv >= MgrGame.Instance.gameData.maxLv;
        const isMineFinish = MgrMine.Instance.isFinish();
        const tileList = AppGame?.gameCtrl?.gameMap?.tileList || [];
        
        let pickAxeOnMap = 0;
        for (let i = 0; i < tileList.length; i++) {
            if (tileList[i].attachId == ITEM.PickAxe) {
                pickAxeOnMap++;
            }
        }
        
        if (isMineOpen && isMaxLevel && !isMineFinish && pickAxeOnMap > 0) {
            AppGame.topUI.normalMine.playShow(collectedPickAxe);
        }
        
        MgrGame.Instance.gameData.levelData = null;
        MgrGame.Instance.gameData.lossTime = 0;
        MgrGame.Instance.gameData.reviveCnt = 0;
    }

    onExit(): void {
        // Empty implementation
    }

    onVictory(data: any): void {
        MgrGame.Instance.clearMap();
        MgrGame.Instance.victory(data.goldCube, data.attachs);
    }

    onAfterVictory(data: any): void {
        MgrUi.Instance.openViewAsync(UIPrefabs.GameVictory, {
            data: data,
            root: MgrUi.root(1)
        });
    }

    onFailed(data: any): void {
        MgrGame.Instance.failed();
    }

    onReplay(): void {
        MgrGame.Instance.clearMap();
        MgrGame.Instance.gameData.reviveCnt = 0;
        
        const level = this.getCurrLevel();
        MgrAnalytics.Instance.data.addPlayTime(level);
        MgrGame.Instance.reportLevelStart(level);
        MgrAnalytics.Instance.startGameTime();
        director.emit(GlobalEvent.GameReplay);
    }

    onRevive(data: any): void {
        MgrGame.Instance.gameData.reviveCnt++;
        MgrGame.Instance.gameData.lossTime += 1;
        MgrGame.Instance.reviveLevel(data);
    }

    onGiveup(data: any): void {
        this.collectGoldCube = 0;
        AppGame.topUI.goldCubeBtn.hideGoldCube();
        MgrGame.Instance.giveUpReviveCall(data);
        director.emit(GlobalEvent.GameGiveup);
    }

    saveMap(mapData: any, level: number, isWin: boolean): void {
        MgrGame.Instance.saveMap(mapData, level, this.collectGoldCube, isWin, this.collectedAttachs);
    }
}
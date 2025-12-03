import { _decorator, cclegacy } from 'cc';
import { GameLogic } from './GameLogic';
import { MgrChallenge } from './MgrChallenge';
import { MgrGame } from './MgrGame';
import { ITEM, GameConst } from './GameConst';
import { AppGame } from './AppGame';
import {Utils} from './Utils';
import { MgrAnalytics } from './MgrAnalytics';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass, property } = _decorator;

@ccclass('LogicChallenge')
export class LogicChallenge extends GameLogic {
    restoreExtraToFlows(flows: any[]) {
        flows.push((next: Function) => {
            if (this.delegate.isGoldTourOpen) {
                const tileList = AppGame.gameCtrl?.gameMap?.tileList || [];
                let hasGoldTile = false;
                
                for (let i = 0; i < tileList.length; i++) {
                    if (tileList[i].tIdx === ITEM.GoldenTile) {
                        hasGoldTile = true;
                        break;
                    }
                }
                
                const collectGoldCube = AppGame.gameCtrl?.curLogic?.collectGoldCube || 0;
                if (hasGoldTile || collectGoldCube > 0) {
                    AppGame.topUI.goldCubeBtn.showGoldCube(this.collectGoldCube);
                }
            }
            next();
        });
    }

    createExtraToFlows(flows: any[]) {
        this.createLightGoldCubeToFlow(true, flows);
    }

    isSupportWand(): boolean {
        return false;
    }

    getCurrLevel(): number {
        return MgrChallenge.Instance.curLv;
    }

    getStorageData(level: number): any {
        const curDay = moment(MgrChallenge.Instance.curTime).startOf('day').valueOf();
        const levelData = MgrChallenge.Instance.getLevelData(curDay);
        return levelData && levelData.level === level ? levelData : null;
    }

    async loadLevelCfg(level: number){
        const levelName = 'ChallengeLevel_' + level;
        return await MgrGame.Instance.loadConfigLevel(levelName);
    }

    getElementCnt(difficulty: number): number {
        return GameConst.CHALLENGE_DIFFICULTY;
    }

    getAlgorithm(difficulty: number): { algorithm: number, algorithmParam: number } {
        return {
            algorithm: GameConst.CHALLENGE_ALGORUTHM,
            algorithmParam: GameConst.CHALLENGE_PARAM
        };
    }

    getAttachInfo(): any {
        const starRange = GameConst.CHALLENGE_STAR_NUM;
        const minStars = starRange[0];
        const maxStars = starRange[1];
        const randomStars = Utils.randomRange(minStars, maxStars);
        
        return {
            [ITEM.Star]: randomStars
        };
    }

    onAfterRestore(): void {
        const starCount = this.collectedAttachs[ITEM.Star] || 0;
        AppGame.topUI.challengeStar.playShow(starCount);
    }

    onAfterCreate(): void {
        const starCount = this.collectedAttachs[ITEM.Star] || 0;
        AppGame.topUI.challengeStar.playShow(starCount);
        MgrChallenge.Instance.clearReviveTime();
    }

    onExit(): void {
        AppGame.topUI.challengeStar.hide();
    }

    onRevive(reason: number): void {
        MgrChallenge.Instance.addReviveTime();
        MgrChallenge.Instance.reportChallengeRevive(reason);
    }

    onGiveup(reason: number): void {
        this.collectGoldCube = 0;
        AppGame.topUI.goldCubeBtn.hideGoldCube();
    }

    onVictory(result: any): void {
        MgrChallenge.Instance.victory(result.goldCube, result.attachs);
    }

    onAfterVictory(result: any): void {
        MgrUi.Instance.openViewAsync(UIPrefabs.ChallengeVictory, {
            data: result,
            root: MgrUi.root(1)
        });
    }

    onFailed(reason: number): void {
        MgrChallenge.Instance.failed();
    }

    onReplay(): void {
        MgrChallenge.Instance.clearMap();
        MgrChallenge.Instance.clearReviveTime();
        MgrChallenge.Instance.addPlayTime();
        MgrChallenge.Instance.reportChallengeStart();
        MgrAnalytics.Instance.startGameTime();
    }

    saveMap(level: number, step: number, originalTiles: any[]): void {
        const completionRate = Number((1 - this.map.tileList.length / originalTiles.length).toFixed(2));
        MgrChallenge.Instance.saveMap(level, step, this.collectGoldCube, originalTiles, completionRate, this.collectedAttachs);
    }
}
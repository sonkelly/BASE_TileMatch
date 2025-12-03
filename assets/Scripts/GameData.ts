import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import {get, each, parseInt} from 'lodash-es';
import { AnalyticsManager } from './AnalyticsManager';
import { LevelCfg } from './LevelCfg';
import { MgrTask } from './MgrTask';
import { TASK_TYPE } from './Const';
import { GameConst } from './GameConst';
import { AppsFlyer } from './AppsFlyer';
import { Firebase } from './Firebase';
import { Facebook } from './Facebook';
import { MgrPass } from './MgrPass';
import { MgrWinStreak } from './MgrWinStreak';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { MAX_COLLECTED } from './MgrGame';
import { MgrFBAnalytics } from './MgrFBAnalytics';

const { ccclass, property } = _decorator;

@ccclass('GameData')
export class GameData extends IDataObject {
    private _maxLv: number = 1;
    private _curLv: number = 1;
    private _winStreak: number = 0;
    private _dirtyWinStreak: number = 0;
    private _failCnt: number = 0;
    private _difficulty: number = 1;
    private _levelData: any = null;
    private _lossTime: number = 0;
    private _reviveCnt: number = 0;
    private _guideBits: number = 0;

    public getGuided(bit: number): boolean {
        return (this._guideBits & bit) > 0;
    }

    public setGuided(bit: number): void {
        this._guideBits = this._guideBits | bit;
        this.doDrity();
    }

    public addGameLevel(): void {
        this._reviveCnt = 0;
        this._failCnt = 0;
        this._curLv++;
        
        if (this._curLv > this._maxLv) {
            MgrTask.Instance.data.addTaskData(TASK_TYPE.LEVEL, 1);
            AppsFlyer.reportLevelEnd(this._curLv - 1);
            Firebase.reportLevelEnd(this._curLv - 1);
            Facebook.reportLevelEnd(this._curLv - 1);
            MgrPass.Instance.addPassLevel();
            MgrWinStreak.Instance.addStreakTime();
            MgrWinStreakV2.Instance.addStreakTime();
            this._winStreak++;
        }
        
        this._maxLv = Math.max(this._maxLv, this._curLv);
        this.difficulty = Math.floor((this._maxLv - 1) / GameConst.MAX_LEVEL_CFG) + 1;
        
        const levelCfg = LevelCfg.Instance.getCfg(this._maxLv);
        if (this._maxLv > levelCfg.end) {
            MgrTask.Instance.data.setTaskData(TASK_TYPE.GROUP_LEVEL, levelCfg.id);
        } else {
            MgrTask.Instance.data.setTaskData(TASK_TYPE.GROUP_LEVEL, levelCfg.id - 1);
        }
        
        AnalyticsManager.getInstance().setUserProperty({ CK_Level: this._curLv });
        AnalyticsManager.getInstance().setUserProperty({ CK_LevelMax: this._maxLv });
        this.doDrity();
        MgrFBAnalytics.Instance.addLevelCount(1);
    }

    public addGameFail(): void {
        this._failCnt++;
        this.doDrity();
    }

    public setGameLevel(level: number): void {
        this._curLv = level;
        this._maxLv = Math.max(this._maxLv, this._curLv);
        this.doDrity();
    }

    public deserialized(data: any): void {
        this._levelData = null;
        this._failCnt = get(data, 0) || 0;
        this._maxLv = get(data, 1) || 1;
        this._curLv = get(data, 2) || 1;
        this._difficulty = get(data, 3) || 1;
        this._lossTime = get(data, 5) || 0;
        this._reviveCnt = get(data, 6) || 0;
        this._winStreak = get(data, 7) || 0;
        this._guideBits = get(data, 8) || 0;
        this._levelData = this.parseLevelData(get(data, 4));
        this._dirtyWinStreak = this._winStreak;
        this.doDrity();
    }

    public serializeInfo(): any[] {
        const data: any[] = [];
        data[0] = this._failCnt;
        data[2] = this._curLv;
        data[1] = this.maxLv;
        data[3] = this._difficulty;
        data[4] = this.stringifyLevelData(this._levelData);
        data[5] = this._lossTime;
        data[6] = this._reviveCnt;
        data[7] = this._winStreak;
        data[8] = this._guideBits;
        return data;
    }

    private parseLevelData(data: any): any {
        if (!data) return null;

        if (Array.isArray(data)) {
            const level = data[0];
            const goldCube = data[1];
            const collected = data[2];
            const collectPoolCnt = data[3];
            const pointsData = data[4];
            const attachs = data[5];

            const points: any[] = [];
            each(pointsData, (pointData: any, index: string) => {
                const idx = parseInt(index);
                points.push({
                    index: idx,
                    x: pointData[0],
                    y: pointData[1],
                    tile: pointData[2],
                    attach: pointData[3],
                    layer: pointData[4],
                    status: pointData[5]
                });
            });

            return {
                level,
                goldCube,
                collected,
                collectPoolCnt,
                points,
                attachs
            };
        }

        return data;
    }

    private stringifyLevelData(levelData: any): any {
        if (!levelData) return null;

        const level = levelData.level;
        const goldCube = levelData.goldCube || 0;
        const collected = levelData.collected;
        const collectPoolCnt = levelData.collectPoolCnt || MAX_COLLECTED;
        const points = levelData.points;
        const attachs = levelData.attachs || {};

        const pointsData: any = {};
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            pointsData[point.index] = [
                point.x,
                point.y,
                point.tile,
                point.attach,
                point.layer,
                point.status
            ];
        }

        return [level, goldCube, collected, collectPoolCnt, pointsData, attachs];
    }

    public get maxLv(): number {
        return this._maxLv;
    }

    public set maxLv(value: number) {
        this._maxLv = value;
        AnalyticsManager.getInstance().setUserProperty({ CK_LevelMax: this._maxLv });
        this.doDrity();
    }

    public get curLv(): number {
        return this._curLv;
    }

    public set curLv(value: number) {
        this._curLv = value;
        AnalyticsManager.getInstance().setUserProperty({ CK_Level: this._curLv });
        this.doDrity();
    }

    public get winStreak(): number {
        return this._winStreak;
    }

    public set winStreak(value: number) {
        this._winStreak = value;
        this.doDrity();
    }

    public get dirtyWinStreak(): number {
        return this._dirtyWinStreak;
    }

    public set dirtyWinStreak(value: number) {
        this._dirtyWinStreak = value;
    }

    public get failCnt(): number {
        return this._failCnt;
    }

    public set failCnt(value: number) {
        this._failCnt = value;
        this.doDrity();
    }

    public get difficulty(): number {
        return this._difficulty;
    }

    public set difficulty(value: number) {
        if (this._difficulty !== value) {
            this._difficulty = value;
            this.doDrity();
        }
    }

    public get levelData(): any {
        return this._levelData;
    }

    public set levelData(value: any) {
        this._levelData = value;
        this.doDrity();
    }

    public get lossTime(): number {
        return this._lossTime;
    }

    public set lossTime(value: number) {
        this._lossTime = value;
        this.doDrity();
    }

    public get reviveCnt(): number {
        return this._reviveCnt;
    }

    public set reviveCnt(value: number) {
        this._reviveCnt = value;
        this.doDrity();
    }
}
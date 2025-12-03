import { _decorator, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import { MonthTileCfg } from './MonthTileCfg';
import { DataMonthTile } from './DataMonthTile';
import { MgrGame } from './MgrGame';
import { MgrChallenge } from './MgrChallenge';
import { AppGame } from './AppGame';
import { GameMode } from './Const';

const { ccclass, property } = _decorator;

@ccclass('MgrMonthTile')
export class MgrMonthTile extends MgrBase {
    private _data: DataMonthTile = null;

    protected onLoad(): void {
        this._data = new DataMonthTile('month-tile-data');
    }

    public load(): void {
        this._data.load();
    }

    public initLoadData(): void {}

    private _isNowMonthActiveTileOpen(): boolean {
        const cfg = MonthTileCfg.Instance?.getNowMonthCfg();
        return cfg?.ifOpen === 1;
    }

    private _isHitChange(): boolean {
        const cfg = MonthTileCfg.Instance?.getNowMonthCfg();
        const exchangeRate = cfg?.exchangeRate || 0;
        return 100 * Math.random() <= exchangeRate;
    }

    public checkMonthTile(level: number, tiles: any[]): void {
        if (this._isNowMonthActiveTileOpen() && this._isHitChange()) {
            const tileCfg = MonthTileCfg.Instance.getNowMonthCfg().tile;
            const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
            
            if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
                this._data.refreshNormalActive(level, randomTile, tileCfg);
            } else {
                this._data.refreshChallengeActive(level, randomTile, tileCfg);
            }
        }
    }

    public triggerMonthTile(): { sTile: any, tTile: any } | null {
        if (!this._isNowMonthActiveTileOpen()) {
            return null;
        }

        if (AppGame.gameCtrl.currMode === GameMode.Challenge) {
            const level = MgrChallenge.Instance.curLv;
            const activeData = this._data.challengeActive;
            
            return activeData && activeData.level === level ? {
                sTile: activeData.sTile,
                tTile: activeData.tTile
            } : null;
        }

        if (AppGame.gameCtrl.currMode !== GameMode.Bonus) {
            const level = MgrGame.Instance.gameData.curLv;
            const activeData = this._data.normalActive;
            
            return activeData && activeData.level === level ? {
                sTile: activeData.sTile,
                tTile: activeData.tTile
            } : null;
        }

        return null;
    }

    public get data(): DataMonthTile {
        return this._data;
    }

    private static _instance: MgrMonthTile;
    public static get Instance(): MgrMonthTile {
        return MgrMonthTile._instance;
    }
}
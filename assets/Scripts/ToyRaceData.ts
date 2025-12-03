import { _decorator, cclegacy } from 'cc';
import { get, set } from 'lodash-es';
import {IDataObject} from './IDataObject';

const { ccclass, property } = _decorator;

@ccclass('ToyRaceData')
export class ToyRaceData extends IDataObject {
    private _tip: boolean = true;
    private _status: number = 0;
    private _lastTime: number = 0;
    private _players: any[] = [];
    private _aiCfgId: number = 0;
    private _matchCount: number = 0;
    private _openCount: number = 0;

    public deserialized(data: any): void {
        this._status = get(data, 'status', 0);
        this._lastTime = get(data, 'last_time', 0);
        this._players = get(data, 'toy_players', []);
        this._aiCfgId = get(data, 'ai_cfg_id', 0);
        this._matchCount = get(data, 'match_count', 0);
        this._openCount = get(data, 'open_count', 0);
        this._tip = get(data, 'toy-tip', true);
    }

    public serializeInfo(): any {
        const data: any = {};
        set(data, 'status', this._status);
        set(data, 'last_time', this._lastTime);
        set(data, 'toy_players', this._players);
        set(data, 'ai_cfg_id', this._aiCfgId);
        set(data, 'match_count', this._matchCount);
        set(data, 'open_count', this._openCount);
        set(data, 'toy-tip', this._tip);
        return data;
    }

    public addOpenCount(): void {
        this.openCount = this._openCount + 1;
    }

    public saveData(): void {
        this.doDrity();
    }

    get tip(): boolean {
        return this._tip;
    }

    set tip(value: boolean) {
        if (this._tip !== value) {
            this._tip = value;
            this.doDrity();
        }
    }

    get status(): number {
        return this._status;
    }

    set status(value: number) {
        this._status = value;
        this.doDrity();
    }

    get lastTime(): number {
        return this._lastTime;
    }

    set lastTime(value: number) {
        this._lastTime = value;
        this.doDrity();
    }

    get players(): any[] {
        return this._players;
    }

    set players(value: any[]) {
        this._players = value;
        this.doDrity();
    }

    get aiCfgId(): number {
        return this._aiCfgId;
    }

    set aiCfgId(value: number) {
        this._aiCfgId = value;
        this.doDrity();
    }

    get matchCount(): number {
        return this._matchCount;
    }

    set matchCount(value: number) {
        this._matchCount = value;
        this.doDrity();
    }

    get openCount(): number {
        return this._openCount;
    }

    set openCount(value: number) {
        this._openCount = value;
        this.doDrity();
    }
}
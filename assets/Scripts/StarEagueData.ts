import { _decorator, cclegacy } from 'cc';
import { get, set } from 'lodash-es';
import { IDataObject } from './IDataObject';

const { ccclass } = _decorator;

@ccclass('StarEagueData')
export class StarEagueData extends IDataObject {
    private _tip: boolean = false;
    private _tipPeriod: number = 0;
    private _showHelp: number = 0;
    private _period: number = 0;
    private _firstPeriod: number = 0;
    private _settlePersiod: number[] = [];
    private _popPeriod: number = 0;
    private _level: number = 1;
    private _star: number = 0;
    private _aiCfgId: number = 0;
    private _aiRank: any[] = [];

    deserialized(data: any): void {
        this._showHelp = get(data, 'showHelp', 0);
        this._period = get(data, 'period', 0);
        this._firstPeriod = get(data, 'firstPeriod', 0);
        this._settlePersiod = get(data, 'settlePersiod', []);
        this._popPeriod = get(data, 'popPeriod', 0);
        this._level = get(data, 'level', 1);
        this._star = get(data, 'star', 0);
        this._aiCfgId = get(data, 'aiCfgId', 0);
        this._aiRank = get(data, 'aiRank', []);
        this._tip = get(data, 'star-tip', true);
        this._tipPeriod = get(data, 'tip-period', 0);
    }

    serializeInfo(): any {
        const data: any = {};
        set(data, 'showHelp', this._showHelp);
        set(data, 'period', this._period);
        set(data, 'firstPeriod', this._firstPeriod);
        set(data, 'settlePersiod', this._settlePersiod);
        set(data, 'popPeriod', this._popPeriod);
        set(data, 'level', this._level);
        set(data, 'star', this._star);
        set(data, 'aiCfgId', this._aiCfgId);
        set(data, 'aiRank', this._aiRank);
        set(data, 'star-tip', this._tip);
        set(data, 'tip-period', this._tipPeriod);
        return data;
    }

    addRankData(data: any): void {
        this._aiRank.push(data);
        this.doDrity();
    }

    saveData(): void {
        this.doDrity();
    }

    addShowHelp(): void {
        this.showHelp = this._showHelp + 1;
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

    get tipPeriod(): number {
        return this._tipPeriod;
    }

    set tipPeriod(value: number) {
        if (this._tipPeriod !== value) {
            this._tipPeriod = value;
            this.doDrity();
        }
    }

    get showHelp(): number {
        return this._showHelp;
    }

    set showHelp(value: number) {
        this._showHelp = value;
        this.doDrity();
    }

    get period(): number {
        return this._period;
    }

    set period(value: number) {
        this._period = value;
        this.doDrity();
    }

    get firstPeriod(): number {
        return this._firstPeriod;
    }

    set firstPeriod(value: number) {
        this._firstPeriod = value;
        this.doDrity();
    }

    get settlePersiod(): number[] {
        return this._settlePersiod;
    }

    set settlePersiod(value: number[]) {
        this._settlePersiod = value;
        this.doDrity();
    }

    get popPeriod(): number {
        return this._popPeriod;
    }

    set popPeriod(value: number) {
        this._popPeriod = value;
        this.doDrity();
    }

    get level(): number {
        return this._level;
    }

    set level(value: number) {
        this._level = value;
        this.doDrity();
    }

    get star(): number {
        return this._star;
    }

    set star(value: number) {
        this._star = value;
        this.doDrity();
    }

    get aiCfgId(): number {
        return this._aiCfgId;
    }

    set aiCfgId(value: number) {
        this._aiCfgId = value;
        this.doDrity();
    }

    get aiRank(): any[] {
        return this._aiRank;
    }

    set aiRank(value: any[]) {
        this._aiRank = value;
        this.doDrity();
    }
}
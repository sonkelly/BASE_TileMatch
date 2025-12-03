import { _decorator, cclegacy } from 'cc';
import {IDataObject} from './IDataObject';
import { GameConst } from './GameConst';
import {Tools} from './Tools';
import { EStageBoxState, EBrickState, EGemState } from './MgrMine';
import {MineCfg} from './MineCfg';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {each, set, get} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MineData')
export class MineData extends IDataObject {
    private _guideStep: number = 1;
    private _tip: boolean = false;
    private _inPeriod: number = 0;
    private _stage: number = 1;
    private _stageBoxs: any = {};
    private _birckMap: any = {};
    private _gemMap: any = {};
    private _gemMapId: number = 0;
    private _recentPeriod: number = 0;
    private _recentStartTime: number = 0;
    private _recentEndTime: number = 0;

    public refreshMineInfo(): void {
        const openTimeType = GameConst.MINE_OPEN_TIME_TYPE;
        const openTime = GameConst.MINE_OPEN_TIME;
        const now = Tools.GetNowMoment();
        const baseDate = moment('2024-01-01 00:00');
        const diffDays = now.startOf('day').diff(baseDate, 'day');
        
        if (diffDays >= 0) {
            const period = Math.floor(diffDays / openTimeType) + 1;
            const periodStart = baseDate.add((period - 1) * openTimeType, 'day').valueOf();
            const startDay = openTime[0] - 1;
            const endDay = openTime[openTime.length - 1] - 1;
            const startTime = moment(periodStart).add(startDay, 'day').startOf('day').valueOf();
            const endTime = moment(periodStart).add(endDay, 'day').endOf('day').valueOf();
            
            this._recentPeriod = period;
            this._recentStartTime = startTime;
            this._recentEndTime = endTime;
        } else {
            this._recentPeriod = 0;
            this._recentStartTime = 0;
            this._recentEndTime = 0;
        }
    }

    public setStageBox(): void {
        this._stageBoxs = {};
        const allStageBoxs = MineCfg.Instance.getAll();
        each(allStageBoxs, (box: any, id: string) => {
            set(this._stageBoxs, box.id, {
                id: box.id,
                state: EStageBoxState.Idle
            });
        });
    }

    public getStageBoxInfo(id: number): any {
        return get(this._stageBoxs, id, null);
    }

    public setBrickMap(): void {
        this._birckMap = {};
        const rowcol = MineCfg.Instance.get(this._stage).rowcol;
        const total = rowcol * rowcol;
        
        for (let i = 1; i <= total; i++) {
            set(this._birckMap, i, {
                id: i,
                state: EBrickState.Idle
            });
        }
        this.doDrity();
    }

    public getMapBrickInfo(id: number): any {
        return get(this._birckMap, id, null);
    }

    public setGemMap(data: any): void {
        this._gemMap = {};
        const gems = data.gems;
        
        for (let i = 0; i < gems.length; i++) {
            const gem = gems[i];
            set(this._gemMap, gem.id, {
                id: gem.id,
                gemId: gem.gemId,
                state: EGemState.Idle
            });
        }
        this.doDrity();
    }

    public getMapGemInfo(id: number): any {
        return get(this._gemMap, id, null);
    }

    public deserialized(data: any): void {
        this._guideStep = get(data, 'guideStep', 1);
        this._tip = get(data, 'tip', true);
        this._inPeriod = get(data, 'period', 0);
        this._stage = get(data, 'stage', 1);
        this._stageBoxs = get(data, 'stageBox', {});
        this._birckMap = get(data, 'mapBrick', {});
        this._gemMap = get(data, 'mapGem', {});
        this._gemMapId = get(data, 'mapId', 0);
    }

    public serializeInfo(): any {
        const data: any = {};
        set(data, 'guideStep', this._guideStep);
        set(data, 'tip', this._tip);
        set(data, 'period', this._inPeriod);
        set(data, 'stage', this._stage);
        set(data, 'stageBox', this._stageBoxs);
        set(data, 'mapBrick', this._birckMap);
        set(data, 'mapGem', this._gemMap);
        set(data, 'mapId', this._gemMapId);
        return data;
    }

    public get guideStep(): number {
        return this._guideStep;
    }

    public set guideStep(value: number) {
        if (this._guideStep !== value) {
            this._guideStep = value;
            this.doDrity();
        }
    }

    public get tip(): boolean {
        return this._tip;
    }

    public set tip(value: boolean) {
        if (this._tip !== value) {
            this._tip = value;
            this.doDrity();
        }
    }

    public get inPeriod(): number {
        return this._inPeriod;
    }

    public set inPeriod(value: number) {
        if (this._inPeriod !== value) {
            this._inPeriod = value;
            this.doDrity();
        }
    }

    public get stage(): number {
        return this._stage;
    }

    public set stage(value: number) {
        if (this._stage !== value) {
            this._stage = value;
            this.doDrity();
        }
    }

    public get stageBoxs(): any {
        return this._stageBoxs;
    }

    public get birckMap(): any {
        return this._birckMap;
    }

    public get gemMap(): any {
        return this._gemMap;
    }

    public get gemMapId(): number {
        return this._gemMapId;
    }

    public set gemMapId(value: number) {
        if (this._gemMapId !== value) {
            this._gemMapId = value;
            this.doDrity();
        }
    }

    public get recentPeriod(): number {
        return this._recentPeriod;
    }

    public get recentStartTime(): number {
        return this._recentStartTime;
    }

    public get recentEndTime(): number {
        return this._recentEndTime;
    }
}
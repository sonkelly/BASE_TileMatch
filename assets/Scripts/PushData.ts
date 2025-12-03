import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import {get, set, each, cloneDeep, parseInt} from 'lodash-es';
import { GiftPushCfg } from './GiftPushCfg';

const { ccclass, property } = _decorator;

const TRIGGER_DATAS_KEY = 0;
const PRE_TRIGGER_DATAS_KEY = 1;
const GIFT_DATAS_KEY = 2;
const LAST_TRIGGER_TIME_KEY = 3;
const LAST_TRIGGER_WEEK_KEY = 4;
const LAST_TRIGGER_MONTH_KEY = 5;
const LOOP_ID_KEY = 6;
const DAILY_PUSH_CNT_KEY = 7;

@ccclass('PushData')
export class PushData extends IDataObject {
    private _triggerDatas: Record<string, number> = {};
    private _preTriggerDatas: Record<string, number> = {};
    private _lastTriggerTime: number = 0;
    private _lastTriggerWeek: number = 0;
    private _lastTriggerMonth: number = 0;
    private _loopId: number = 0;
    private _dailyPushCnt: number = 0;
    private _giftDatas: Record<string, {
        triggerTime: number;
        triggerCount: number;
        lastPopTime: number;
        popCount: number;
        state: number;
    }> = {};

    // constructor giống behavior của build (forward arguments -> super)
    constructor(args : any) {
        super(args);
        this._triggerDatas = {};
        this._preTriggerDatas = {};
        this._lastTriggerTime = 0;
        this._lastTriggerWeek = 0;
        this._lastTriggerMonth = 0;
        this._loopId = 0;
        this._dailyPushCnt = 0;
        this._giftDatas = {};
    }


    public deserialized(data: any): void {
        this._triggerDatas = get(data, TRIGGER_DATAS_KEY) || {};
        this._preTriggerDatas = get(data, PRE_TRIGGER_DATAS_KEY) || {};
        this._lastTriggerTime = get(data, LAST_TRIGGER_TIME_KEY) || 0;
        this._lastTriggerWeek = get(data, LAST_TRIGGER_WEEK_KEY) || 0;
        this._lastTriggerMonth = get(data, LAST_TRIGGER_MONTH_KEY) || 0;
        this._loopId = get(data, LOOP_ID_KEY) || 0;
        this._dailyPushCnt = get(data, DAILY_PUSH_CNT_KEY) || 0;

        const giftDataArray = get(data, GIFT_DATAS_KEY) || [];
        this._giftDatas = {};

        for (const item of giftDataArray) {
            const [id, triggerTime, triggerCount, lastPopTime, popCount, state] = item;
            if (GiftPushCfg.Instance.get(id)) {
                this._giftDatas[id] = {
                    triggerTime,
                    triggerCount,
                    lastPopTime,
                    popCount,
                    state
                };
            }
        }
    }

    public serializeInfo(): any {
        const giftDataArray: any[] = [];
        each(this._giftDatas, (data, id) => {
            giftDataArray.push([
                parseInt(id),
                data.triggerTime,
                data.triggerCount,
                data.lastPopTime,
                data.popCount,
                data.state
            ]);
        });

        return {
            [GIFT_DATAS_KEY]: giftDataArray,
            [TRIGGER_DATAS_KEY]: cloneDeep(this._triggerDatas),
            [PRE_TRIGGER_DATAS_KEY]: cloneDeep(this._preTriggerDatas),
            [LAST_TRIGGER_TIME_KEY]: this._lastTriggerTime,
            [LAST_TRIGGER_WEEK_KEY]: this._lastTriggerWeek,
            [LAST_TRIGGER_MONTH_KEY]: this._lastTriggerMonth,
            [LOOP_ID_KEY]: this._loopId,
            [DAILY_PUSH_CNT_KEY]: this._dailyPushCnt
        };
    }

    public getStatusGifts(status: string | number, result: number[]): void {
        each(this._giftDatas, (data, id) => {
            const giftId = parseInt(id);
            if (data.state === status) {
                result.push(giftId);
            }
        });
    }

    public setTriggerCount(key: string | number, count: number): void {
        if (this._triggerDatas[key] !== count) {
            this._triggerDatas[key] = count;
            this.doDrity();
        }
    }

    public getTriggerCount(key: string | number): number {
        return this._triggerDatas[key] || 0;
    }

    public setPreTriggerCount(key: string | number, count: number = 1): void {
        if (this._preTriggerDatas[key] !== count) {
            this._preTriggerDatas[key] = count;
            this.doDrity();
        }
    }

    public getPreTriggerCount(key: string | number): number {
        return this._preTriggerDatas[key] || 0;
    }

    public getPushData(id: string | number): any {
        if (!this._giftDatas[id]) {
            this._giftDatas[id] = {
                triggerTime: 0,
                triggerCount: 0,
                lastPopTime: 0,
                popCount: 0,
                state: 0
            };
        }
        return this._giftDatas[id];
    }

    public addPopCount(id: string | number, time: number): void {
        const data = this.getPushData(id);
        data.popCount++;
        data.lastPopTime = time;
        this.doDrity();
    }

    public clearActiveInfo(id: string | number): void {
        const data = this.getPushData(id);
        data.triggerCount = 0;
        data.popCount = 0;
        this.doDrity();
    }

    public setPushState(id: string | number, state: number): void {
        this.getPushData(id).state = state;
        this.doDrity();
    }

    public setTriggerTime(id: string | number, time: number): void {
        this.getPushData(id).triggerTime = time;
        this.doDrity();
    }

    public addTriggerCount(id: string | number): void {
        this.getPushData(id).triggerCount++;
        this.doDrity();
    }

    get lastTriggerTime(): number {
        return this._lastTriggerTime;
    }

    set lastTriggerTime(value: number) {
        this._lastTriggerTime = value;
        this.doDrity();
    }

    get lastTriggerWeek(): number {
        return this._lastTriggerWeek;
    }

    set lastTriggerWeek(value: number) {
        this._lastTriggerWeek = value;
        this.doDrity();
    }

    get lastTriggerMonth(): number {
        return this._lastTriggerMonth;
    }

    set lastTriggerMonth(value: number) {
        this._lastTriggerMonth = value;
        this.doDrity();
    }

    get loopId(): number {
        return this._loopId;
    }

    set loopId(value: number) {
        this._loopId = value;
        this.doDrity();
    }

    get dailyPushCnt(): number {
        return this._dailyPushCnt;
    }

    set dailyPushCnt(value: number) {
        this._dailyPushCnt = value;
        this.doDrity();
    }
}
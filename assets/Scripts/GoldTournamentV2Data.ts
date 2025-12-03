import { _decorator, cclegacy, director } from 'cc';
import {IDataObject} from './IDataObject';
import { TournamentStatus } from './GoldTournamentData';
import { GlobalEvent } from './Events';
import { GameConst } from './GameConst';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {get, set} from 'lodash-es';
import {Tools} from './Tools';
import { MgrTask } from './MgrTask';
import { TASK_TYPE } from './Const';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentV2Data')
export class GoldTournamentV2Data extends IDataObject {
    private _tip: boolean = false;
    private _goldCube: number = 0;
    private _firstPeriod: number = 0;
    private _settlePersiod: number[] = [];
    private _tourPeriod: number = 0;
    private _tourStatus: TournamentStatus = TournamentStatus.Wait;
    private _recentPeriod: number = 0;
    private _recentStartTime: number = 0;
    private _recentEndTime: number = 0;

    checkPeriodIsSettle(period: number): boolean {
        return this._settlePersiod.includes(period);
    }

    settlePeriod(period: number, result: number): void {
        if (this.checkPeriodIsSettle(period)) {
            console.error(`期数:${period}，已结算过。`);
            return;
        }

        if (result === 1) {
            MgrTask.Instance.data.addTaskData(TASK_TYPE.GOLDTOUR_FIRST, 1);
        }

        this._settlePersiod.push(period);
        this.doDrity();
    }

    refreshTournamentInfo(): void {
        const openTimeType = GameConst.GOLDTOURNAMENT_V2_OPEN_TIME_TYPE;
        const now = Tools.GetNowMoment();
        const baseDate = moment('2024-01-01 00:00');
        const daysDiff = now.startOf('day').diff(baseDate, 'day');

        if (daysDiff >= 0) {
            const period = Math.floor(daysDiff / openTimeType) + 1;
            const timeInfo = this._calcTournamentTime(period);
            
            this._recentPeriod = period;
            this._recentStartTime = timeInfo.recentStartTime;
            this._recentEndTime = timeInfo.recentEndTime;
        } else {
            this._recentPeriod = 0;
            this._recentStartTime = 0;
            this._recentEndTime = 0;
        }
    }

    private _calcTournamentTime(period: number): { recentStartTime: number, recentEndTime: number } {
        const openTimeType = GameConst.GOLDTOURNAMENT_V2_OPEN_TIME_TYPE;
        const openTime = GameConst.GOLDTOURNAMENT_V2_OPEN_TIME;
        const baseTime = moment('2024-01-01 00:00').add((period - 1) * openTimeType, 'day').valueOf();
        const startDay = openTime[0] - 1;
        const endDay = openTime[openTime.length - 1] - 1;

        return {
            recentStartTime: moment(baseTime).add(startDay, 'day').startOf('day').valueOf(),
            recentEndTime: moment(baseTime).add(endDay, 'day').endOf('day').valueOf()
        };
    }

    deserialized(data: any): void {
        this._tip = get(data, 'showTip', false);
        this._goldCube = get(data, 'goldCube', 0);
        this._tourPeriod = get(data, 'inPeriod', 0);
        this._firstPeriod = get(data, 'firstPeriod', 0);
        this._settlePersiod = get(data, 'settlePersiod', []);
    }

    serializeInfo(): any {
        const data: any = {};
        set(data, 'showTip', this._tip);
        set(data, 'goldCube', this._goldCube);
        set(data, 'inPeriod', this._tourPeriod);
        set(data, 'firstPeriod', this._firstPeriod);
        set(data, 'settlePersiod', this._settlePersiod);
        return data;
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

    get goldCube(): number {
        return this._goldCube;
    }

    set goldCube(value: number) {
        this._goldCube = value;
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

    get tourPeriod(): number {
        return this._tourPeriod;
    }

    set tourPeriod(value: number) {
        this._tourPeriod = value;
        if (!this._firstPeriod) {
            this._firstPeriod = value;
        }
        this.doDrity();
    }

    get tourStatus(): TournamentStatus {
        return this._tourStatus;
    }

    set tourStatus(value: TournamentStatus) {
        if (value !== this._tourStatus) {
            this._tourStatus = value;
            director.emit(GlobalEvent.refreshGoldTourStatusV2);
        }
    }

    get recentPeriod(): number {
        return this._recentPeriod;
    }

    get recentStartTime(): number {
        return this._recentStartTime;
    }

    get recentEndTime(): number {
        return this._recentEndTime;
    }
}
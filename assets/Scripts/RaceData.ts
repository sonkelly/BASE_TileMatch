import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import { GameConst } from './GameConst';
import { Tools } from './Tools';
import { AvatarCfg } from './AvatarCfg';
import { RaceAiCfg } from './RaceAiCfg';
import { MgrUser } from './MgrUser';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import { get, set } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('RaceData')
export class RaceData extends IDataObject {
    private _tip: boolean = false;
    private _match: boolean = false;
    private _help: boolean = false;
    private _raceDayTime: number = 0;
    private _raceDayCount: number = 0;
    private _raceDaySettle: number = 0;
    private _realStep: number = 0;
    private _showStep: number = 0;
    private _refreshTime: number = 0;
    private _startLevel: number = 0;
    private _mustFailLevel: number = 0;
    private _firstPeriod: number = 0;
    private _inPeriod: number = 0;
    private _timeFailPeriod: number[] = [];
    private _raceAis: any[] = [];
    private _raceAiCfgId: number = 0;
    private _period: number = 0;
    private _startTime: number = 0;
    private _endTime: number = 0;

    constructor() {
        super();
    }

    public checkPeriodTime(): void {
        const RACE_OPEN_TIME_TYPE = GameConst.RACE_OPEN_TIME_TYPE;
        const nowMoment = Tools.GetNowMoment();
        const baseDate = moment('2024-01-01 00:00');
        const daysDiff = nowMoment.startOf('day').diff(baseDate, 'day');
        
        if (daysDiff >= 0) {
            const period = Math.floor(daysDiff / RACE_OPEN_TIME_TYPE) + 1;
            const periodTime = this._calcPeriodTime(period);
            this._period = period;
            this._startTime = periodTime.startTime;
            this._endTime = periodTime.endTime;
        } else {
            this._period = 0;
            this._startTime = 0;
            this._endTime = 0;
        }
    }

    private _calcPeriodTime(period: number): { startTime: number, endTime: number } {
        const RACE_OPEN_TIME_TYPE = GameConst.RACE_OPEN_TIME_TYPE;
        const RACE_OPEN_TIME = GameConst.RACE_OPEN_TIME;
        const baseTime = moment('2024-01-01 00:00').add((period - 1) * RACE_OPEN_TIME_TYPE, 'day').valueOf();
        const startDay = RACE_OPEN_TIME[0] - 1;
        const endDay = RACE_OPEN_TIME[RACE_OPEN_TIME.length - 1] - 1;

        return {
            startTime: moment(baseTime).add(startDay, 'day').startOf('day').valueOf(),
            endTime: moment(baseTime).add(endDay, 'day').endOf('day').valueOf()
        };
    }

    public initAiData(): void {
        this._raceAiCfgId = RaceAiCfg.Instance.getRandomId();
        const randomHeads = AvatarCfg.Instance.getRandomCntExceptAndNotRepeat(
            MgrUser.Instance.userData.userHead,
            GameConst.RACE_AI_CNT
        );

        if (randomHeads.length < GameConst.RACE_AI_CNT) {
            console.error('randomHeads not enough!');
        } else {
            this._raceAis.length = 0;
            const nowTime = Tools.GetNowTime();
            
            for (let i = 0; i < GameConst.RACE_AI_CNT; i++) {
                this._raceAis.push({
                    id: randomHeads[i],
                    realStep: 0,
                    showStep: 0,
                    refreshTime: nowTime,
                    rank: i + 1
                });
            }
            this.doDrity();
        }
    }

    public addTimeFailPeriod(period: number): void {
        if (!this._timeFailPeriod.includes(period)) {
            this._timeFailPeriod.push(period);
        }
    }

    public deserialized(data: any): void {
        this._tip = get(data, 'tip', true);
        this._match = get(data, 'match', true);
        this._help = get(data, 'help', true);
        this._raceDayTime = get(data, 'dayTime', 0);
        this._raceDayCount = get(data, 'dayCount', 0);
        this._raceDaySettle = get(data, 'daySettle', 0);
        this._realStep = get(data, 'realStep', 0);
        this._showStep = get(data, 'showStep', 0);
        this._refreshTime = get(data, 'refreshTime', 0);
        this._startLevel = get(data, 'startLevel', 0);
        this._mustFailLevel = get(data, 'mustfaillevel', 0);
        this._firstPeriod = get(data, 'firstPeriod', 0);
        this._inPeriod = get(data, 'inPeriod', 0);
        this._timeFailPeriod = get(data, 'failPeriod', []);
        this._raceAis = get(data, 'raceAi', []);
        this._raceAiCfgId = get(data, 'raceAiCfgId', 0);
    }

    public serializeInfo(): any {
        const data: any = {};
        set(data, 'tip', this._tip);
        set(data, 'match', this._match);
        set(data, 'help', this._help);
        set(data, 'dayTime', this._raceDayTime);
        set(data, 'dayCount', this._raceDayCount);
        set(data, 'daySettle', this._raceDaySettle);
        set(data, 'realStep', this._realStep);
        set(data, 'showStep', this._showStep);
        set(data, 'refreshTime', this._refreshTime);
        set(data, 'startLevel', this._startLevel);
        set(data, 'mustfaillevel', this._mustFailLevel);
        set(data, 'firstPeriod', this._firstPeriod);
        set(data, 'inPeriod', this._inPeriod);
        set(data, 'failPeriod', this._timeFailPeriod);
        set(data, 'raceAi', this._raceAis);
        set(data, 'raceAiCfgId', this._raceAiCfgId);
        return data;
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

    public get match(): boolean {
        return this._match;
    }

    public set match(value: boolean) {
        if (this._match !== value) {
            this._match = value;
            this.doDrity();
        }
    }

    public get help(): boolean {
        return this._help;
    }

    public set help(value: boolean) {
        if (this._help !== value) {
            this._help = value;
            this.doDrity();
        }
    }

    public get raceDayTime(): number {
        return this._raceDayTime;
    }

    public set raceDayTime(value: number) {
        if (this._raceDayTime !== value) {
            this._raceDayTime = value;
            this.doDrity();
        }
    }

    public get raceDayCount(): number {
        return this._raceDayCount;
    }

    public set raceDayCount(value: number) {
        if (this._raceDayCount !== value) {
            this._raceDayCount = value;
            this.doDrity();
        }
    }

    public get raceDaySettle(): number {
        return this._raceDaySettle;
    }

    public set raceDaySettle(value: number) {
        if (this._raceDaySettle !== value) {
            this._raceDaySettle = value;
            this.doDrity();
        }
    }

    public get realStep(): number {
        return this._realStep;
    }

    public set realStep(value: number) {
        if (this._realStep !== value) {
            this._realStep = value;
            this.doDrity();
        }
    }

    public get showStep(): number {
        return this._showStep;
    }

    public set showStep(value: number) {
        if (this._showStep !== value) {
            this._showStep = value;
            this.doDrity();
        }
    }

    public get refreshTime(): number {
        return this._refreshTime;
    }

    public set refreshTime(value: number) {
        if (this._refreshTime !== value) {
            this._refreshTime = value;
            this.doDrity();
        }
    }

    public get startLevel(): number {
        return this._startLevel;
    }

    public set startLevel(value: number) {
        if (this._startLevel !== value) {
            this._startLevel = value;
            this.doDrity();
        }
    }

    public get mustFailLevel(): number {
        return this._mustFailLevel;
    }

    public set mustFailLevel(value: number) {
        if (this._mustFailLevel !== value) {
            this._mustFailLevel = value;
            this.doDrity();
        }
    }

    public get firstPeriod(): number {
        return this._firstPeriod;
    }

    public get period(): number {
        return this._period;
    }

    public set period(value: number) {
        if (this._firstPeriod !== value) {
            this._firstPeriod = value;
            this.doDrity();
        }
    }

    public get inPeriod(): number {
        return this._inPeriod;
    }

    public set inPeriod(value: number) {
        if (this._inPeriod !== value) {
            this._inPeriod = value;
            if (!this._firstPeriod) {
                this._firstPeriod = value;
            }
            this.doDrity();
        }
    }

    public get timeFailPeriod(): number[] {
        return this._timeFailPeriod;
    }

    public get raceAis(): any[] {
        return this._raceAis;
    }

    public get raceAiCfgId(): number {
        return this._raceAiCfgId;
    }

    public set raceAiCfgId(value: number) {
        if (this._raceAiCfgId !== value) {
            this._raceAiCfgId = value;
            this.doDrity();
        }
    }

    public get startTime(): number {
        return this._startTime;
    }

    public get endTime(): number {
        return this._endTime;
    }
}
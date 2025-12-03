import { _decorator, sys, cclegacy } from 'cc';
import {MgrBase} from './MgrBase';
import { GameConst } from './GameConst';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {includes, each} from 'lodash-es';

const { ccclass, property } = _decorator;

const CHALLENGE_LIST_KEY = 'challenge-list';
const CHALLENGE_DATE_PREFIX = 'challenge-date-';
const STAR_DATA_KEY = 'ck-challenge-star-data';

@ccclass('MgrChallengeStorage')
export class MgrChallengeStorage extends MgrBase {
    private _dirtyList: string[] = [];
    private _challengeData: Map<string, any> = new Map();
    private _madelData: moment.Moment[] = [];
    private _starData: Map<string, any> = new Map();
    private _curLv: number | null = null;
    public saveDay: string | null = null;

    private static _instance: MgrChallengeStorage;
    public static get Instance(): MgrChallengeStorage {
        return MgrChallengeStorage._instance;
    }

    public get curLv(): number | null {
        return this._curLv;
    }

    public set curLv(value: number | null) {
        this._curLv = value;
    }

    public load(): void {
        this._dirtyList = [];
        this._challengeData = new Map();
        this._madelData = [];
        this._starData = new Map();
    }

    public initLoadData(): void {
        this.deserialized();
    }

    public saveData(data: any): void {
        this._challengeData.set(data.date, data);
        this._dirtyList.push(data.date);
    }

    public getData(date: number | string): any {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        return this._challengeData.get(formattedDate);
    }

    public getSaveDay(): string | null {
        return this.saveDay;
    }

    public getMadelData(): moment.Moment[] {
        return this._madelData;
    }

    public addMadelData(date: moment.Moment): void {
        this._madelData.push(date);
        this.saveMadelToLocal();
    }

    public getStarData(date: number | string | moment.Moment): any {
        if (typeof date === 'number') {
            date = moment(date).format('YYYY-MM');
        } else if (moment.isMoment(date)) {
            date = moment(date).startOf('month').startOf('day').format('YYYY-MM');
        }
        
        let starData = this._starData.get(date);
        if (!starData) {
            const localData = this.loadStarToLocal(date as string);
            if (localData) {
                starData = JSON.parse(localData);
                this._starData.set(date, starData);
            }
        }
        return starData;
    }

    public addStarCount(date: number, count: number): void {
        const dayKey = moment(date).format('YYYY-MM-DD');
        const monthKey = moment(date).startOf('month').startOf('day').format('YYYY-MM');
        
        let starData = this.getStarData(monthKey);
        
        if (starData) {
            starData.star += count;
            if (!includes(starData.dayList, dayKey)) {
                starData.dayList.push(dayKey);
            }
        } else {
            starData = {
                star: count,
                preStar: 0,
                earnList: [],
                dayList: [dayKey]
            };
        }
        
        this._starData.set(monthKey, starData);
        this.saveStarToLocal(monthKey);
    }

    public addStarProgressComplete(date: number | moment.Moment): void {
        let monthKey: string;
        if (typeof date === 'number') {
            monthKey = moment(date).format('YYYY-MM');
        } else if (moment.isMoment(date)) {
            monthKey = moment(date).startOf('month').startOf('day').format('YYYY-MM');
        } else {
            return;
        }
        
        const starData = this.getStarData(monthKey);
        if (starData) {
            starData.preStar = starData.star;
            this.saveStarToLocal(monthKey);
        }
    }

    public earnStarReward(date: number, rewardId: number): void {
        const dayKey = moment(date).format('YYYY-MM-DD');
        const monthKey = moment(date).startOf('month').startOf('day').format('YYYY-MM');
        
        let starData = this.getStarData(monthKey);
        
        if (starData) {
            if (!includes(starData.earnList, rewardId)) {
                starData.earnList.push(rewardId);
            }
        } else {
            starData = {
                star: 0,
                preStar: 0,
                earnList: [rewardId],
                dayList: [dayKey]
            };
        }
        
        this._starData.set(monthKey, starData);
        this.saveStarToLocal(monthKey);
    }

    public resolveSave(): void {
        if (this._dirtyList && this._dirtyList.length > 0) {
            const date = this._dirtyList.pop();
            this.saveByDate(date!);
        }
    }

    public saveByDate(date: string): void {
        if (date) {
            this.serializeInfo(date);
        }
    }

    public lateUpdate(dt: number): void {
        this.resolveSave();
    }

    private serializeInfo(date: string): void {
        const data = this._challengeData.get(date);
        if (data) {
            sys.localStorage.setItem(CHALLENGE_DATE_PREFIX + date, JSON.stringify(data));
        }
        
        const keys = Array.from(this._challengeData.keys()).join('|');
        sys.localStorage.setItem(CHALLENGE_LIST_KEY, keys);
    }

    private deserialized(): void {
        let challengeDates: string[] = [];
        const savedList = sys.localStorage.getItem(CHALLENGE_LIST_KEY);
        if (savedList) {
            challengeDates = savedList.split('|');
        }

        let needSaveStar = false;
        challengeDates.forEach(date => {
            const savedData = sys.localStorage.getItem(CHALLENGE_DATE_PREFIX + date);
            if (savedData) {
                const data = JSON.parse(savedData);
                this._challengeData.set(date, data);
                
                if (data.isPass) {
                    const monthKey = moment(date).startOf('month').startOf('day').format('YYYY-MM');
                    let starData = this.getStarData(monthKey);
                    
                    if (starData) {
                        if (!includes(starData.dayList, date)) {
                            starData.dayList.push(date);
                            starData.star += GameConst.CHALLENGE_STAR_PASSED;
                            needSaveStar = true;
                        }
                    } else {
                        starData = {
                            star: GameConst.CHALLENGE_STAR_PASSED,
                            preStar: GameConst.CHALLENGE_STAR_PASSED,
                            earnList: [],
                            dayList: [date]
                        };
                        needSaveStar = true;
                    }
                    
                    this._starData.set(monthKey, starData);
                    if (needSaveStar) {
                        this.saveStarToLocal(monthKey);
                    }
                }
            }
        });

        const madelData: string[] = [];
        const savedMadel = sys.localStorage.getItem('challenge-madel-data');
        if (savedMadel) {
            madelData.push(...savedMadel.split('|'));
        }

        each(madelData, dateStr => {
            const dateNum = Number(dateStr);
            this._madelData.push(moment(dateNum).startOf('month'));
        });
    }

    private saveMadelToLocal(): void {
        const timestamps: number[] = [];
        each(this._madelData, date => {
            timestamps.push(date.startOf('month').valueOf());
        });
        
        const dataStr = timestamps.join('|');
        sys.localStorage.setItem(CHALLENGE_LIST_KEY, dataStr);
    }

    private loadStarToLocal(monthKey: string): string | null {
        return sys.localStorage.getItem(STAR_DATA_KEY + '_' + monthKey);
    }

    private saveStarToLocal(monthKey: string): void {
        const starData = this.getStarData(monthKey);
        sys.localStorage.setItem(STAR_DATA_KEY + '_' + monthKey, JSON.stringify(starData));
    }
}
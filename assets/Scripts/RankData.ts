import { _decorator, director, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import {isEmpty, get, set, each} from 'lodash-es';
import { RankAiCfg } from './RankAiCfg';
import { RankCfg } from './RankCfg';
import { RankAiNameCfg } from './RankAiNameCfg';
import { AvatarCfg } from './AvatarCfg';
import { Tools } from './Tools';
import { Utils } from './Utils';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

export enum RankType {
    Month = 1,
    Year = 2,
    Friend = 3
}

export const RankShowSpIndex = 3;
export const RankIndexColorSelf = '#FCFF00';
export const RankIndexColorOther = '#FFFFFF';
export const RankNickColorSelf = '#FCFF00';
export const RankNickColorOther = '#FFFFFF';
export const outlineColor2 = '#000000';
export const outlineColor1 = '#4E0315';
export const RankStarColorSelf = '#FCFF00';
export const RankStarColorOther = '#FFFFFF';

@ccclass('RankData')
export class RankData extends IDataObject {
    private _tip: boolean = false;
    private _monthWisdom: number = 0;
    private _monthRank: any = {};
    private _yearRank: any = {};
    private _used: boolean = true;

    public addMonthWisdom(value: number): void {
        this._monthWisdom += value;
        this.doDrity();
    }

    public checkReInitMonthRank(): void {
        const currentMonth = Tools.GetNowDate().getMonth();
        isEmpty(this._monthRank) ? this._initMonthRank(currentMonth) : 
        this._monthRank.month !== currentMonth && this._initMonthRank(currentMonth);
    }

    private _initMonthRank(month: number): void {
        this._monthWisdom = 0;
        this._monthRank.month = month;
        this._monthRank.rankItems = [];
        
        const playerNum = RankCfg.Instance.getRankPlayerNum(RankType.Month);
        const aiNames = RankAiNameCfg.Instance.radomAiNameIds(playerNum);
        
        for (let i = 0; i < aiNames.length; i++) {
            const time = Tools.GetNowTime();
            const id = aiNames[i];
            const head = AvatarCfg.Instance.getRandomHeadId();
            const wisdom = this._initMonthRankWisdom();
            
            this._monthRank.rankItems.push({
                id: id,
                head: head,
                rTime: time,
                wisdom: wisdom
            });
        }
        
        this._monthRank.rankItems.sort((a: any, b: any) => b.wisdom - a.wisdom);
        this._monthRank.rankItems.forEach((item: any, index: number) => {
            item.rank = index + 1;
        });
        
        this.doDrity();
        director.emit(GlobalEvent.reInitMonthRankAiData);
    }

    private _initMonthRankWisdom(): number {
        const [min, max] = RankCfg.Instance.getRankStartPoint(RankType.Month);
        let wisdom = Tools.randomRange(min, max);
        const dayOfMonth = Tools.GetNowDate().getDate() - 1;
        
        if (dayOfMonth <= 0) return wisdom;
        
        const [dayMin, dayMax] = RankCfg.Instance.getRankStartDayPoint(RankType.Month);
        for (let i = 0; i < dayOfMonth; i++) {
            wisdom += Tools.randomRange(dayMin, dayMax);
        }
        
        return wisdom;
    }

    private _checkInitYearRank(): void {
        isEmpty(this._yearRank) && this._initYearRank();
    }

    private _initYearRank(): void {
        this._yearRank.rankItems = [];
        
        const playerNum = RankCfg.Instance.getRankPlayerNum(RankType.Year);
        const aiNames = RankAiNameCfg.Instance.radomAiNameIds(playerNum);
        
        for (let i = 0; i < aiNames.length; i++) {
            const time = Tools.GetNowTime();
            const id = aiNames[i];
            const head = AvatarCfg.Instance.getRandomHeadId();
            const wisdom = this._initYearRankWisdom();
            
            this._yearRank.rankItems.push({
                id: id,
                head: head,
                rTime: time,
                wisdom: wisdom
            });
        }
        
        this._yearRank.rankItems.sort((a: any, b: any) => b.wisdom - a.wisdom);
        this._yearRank.rankItems.forEach((item: any, index: number) => {
            item.rank = index + 1;
        });
        
        this.doDrity();
    }

    private _initYearRankWisdom(): number {
        const [min, max] = RankCfg.Instance.getRankStartPoint(RankType.Year);
        let wisdom = Tools.randomRange(min, max);
        const dayOfYear = Utils.getDayOfYear() - 1;
        
        if (dayOfYear <= 0) return wisdom;
        
        const [dayMin, dayMax] = RankCfg.Instance.getRankStartDayPoint(RankType.Year);
        for (let i = 0; i < dayOfYear; i++) {
            wisdom += Tools.randomRange(dayMin, dayMax);
        }
        
        return wisdom;
    }

    public checkRefreshMonthRank(): void {
        let changed = false;
        const currentTime = Tools.GetNowTime();
        
        for (let i = 0; i < this._monthRank.rankItems.length - 1; i++) {
            const item = this._monthRank.rankItems[i];
            const aiInfo = RankAiCfg.Instance.getAiRankAddInfo(item.rank, RankType.Month);
            const timeDiff = currentTime - item.rTime;
            const interval = 60000 * aiInfo.aiTime;
            const intervals = Math.floor(timeDiff / interval);
            
            if (intervals > 0) {
                changed = true;
                let addValue = 0;
                const [minAdd, maxAdd] = aiInfo.aiAddRange;
                const percent = aiInfo.aiPercent;
                
                for (let j = 0; j < intervals; j++) {
                    Tools.randomRange(0, 100) <= percent && (addValue += Tools.randomRange(minAdd, maxAdd));
                }
                
                item.rTime = currentTime;
                item.wisdom += addValue;
            }
        }
        
        if (changed) {
            this._monthRank.rankItems.sort((a: any, b: any) => b.wisdom - a.wisdom);
            this._monthRank.rankItems.forEach((item: any, index: number) => {
                item.rank = index + 1;
            });
            
            this.doDrity();
            director.emit(GlobalEvent.refreshRankAiData, RankType.Month);
        }
    }

    public checkRefreshYearRank(): void {
        let changed = false;
        const currentTime = Tools.GetNowTime();
        
        for (let i = 0; i < this._yearRank.rankItems.length - 1; i++) {
            const item = this._yearRank.rankItems[i];
            const aiInfo = RankAiCfg.Instance.getAiRankAddInfo(item.rank, RankType.Year);
            const timeDiff = currentTime - item.rTime;
            const interval = 60000 * aiInfo.aiTime;
            const intervals = Math.floor(timeDiff / interval);
            
            if (intervals > 0) {
                changed = true;
                let addValue = 0;
                const [minAdd, maxAdd] = aiInfo.aiAddRange;
                const percent = aiInfo.aiPercent;
                
                for (let j = 0; j < intervals; j++) {
                    Tools.randomRange(0, 100) <= percent && (addValue += Tools.randomRange(minAdd, maxAdd));
                }
                
                item.rTime = currentTime;
                item.wisdom += addValue;
            }
        }
        
        if (changed) {
            this._yearRank.rankItems.sort((a: any, b: any) => b.wisdom - a.wisdom);
            this._yearRank.rankItems.forEach((item: any, index: number) => {
                item.rank = index + 1;
            });
            
            this.doDrity();
            director.emit(GlobalEvent.refreshRankAiData, RankType.Year);
        }
    }

    public deserialized(data: any): void {
        this._monthWisdom = get(data, 'MonthWisdom', 0);
        this._used = get(data, 'Used', true);
        this._tip = get(data, 'rank-tip', true);
        
        const monthRankTime = get(data, 'MonthRankTime', 0);
        const yearRankTime = get(data, 'YearRankTime', 0);
        
        const monthData = get(data, 'MonthRank', {});
        if (!isEmpty(monthData)) {
            this._monthRank.month = monthData.month;
            this._monthRank.rankItems = [];
            
            each(monthData.rankItems, (itemData: any, index: number) => {
                if (itemData.length === 3) {
                    this._monthRank.rankItems[index] = {
                        rank: index + 1,
                        rTime: monthRankTime,
                        id: itemData[0],
                        head: itemData[1],
                        wisdom: itemData[2]
                    };
                } else {
                    this._monthRank.rankItems[index] = {
                        rank: itemData[0],
                        rTime: itemData[1],
                        id: itemData[2],
                        head: itemData[3],
                        wisdom: itemData[4]
                    };
                }
            });
        }
        
        const yearData = get(data, 'YearRank', {});
        if (!isEmpty(yearData)) {
            this._yearRank.rankItems = [];
            
            each(yearData.rankItems, (itemData: any, index: number) => {
                if (itemData.length === 3) {
                    this._yearRank.rankItems[index] = {
                        rank: index + 1,
                        rTime: yearRankTime,
                        id: itemData[0],
                        head: itemData[1],
                        wisdom: itemData[2]
                    };
                } else {
                    this._yearRank.rankItems[index] = {
                        rank: itemData[0],
                        rTime: itemData[1],
                        id: itemData[2],
                        head: itemData[3],
                        wisdom: itemData[4]
                    };
                }
            });
        }
        
        this.checkReInitMonthRank();
        this._checkInitYearRank();
        this.checkRefreshMonthRank();
        this.checkRefreshYearRank();
    }

    public serializeInfo(): any {
        const data: any = {};
        
        set(data, 'MonthWisdom', this._monthWisdom);
        set(data, 'Used', this._used);
        
        const monthData = {
            month: this._monthRank.month,
            rankItems: [] as any[]
        };
        
        each(this._monthRank.rankItems, (item: any) => {
            monthData.rankItems.push([item.rank, item.rTime, item.id, item.head, item.wisdom]);
        });
        
        set(data, 'MonthRank', monthData);
        
        const yearData = {
            rankItems: [] as any[]
        };
        
        each(this._yearRank.rankItems, (item: any) => {
            yearData.rankItems.push([item.rank, item.rTime, item.id, item.head, item.wisdom]);
        });
        
        set(data, 'YearRank', yearData);
        set(data, 'rank-tip', this._tip);
        
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

    public get monthWisdom(): number {
        return this._monthWisdom;
    }

    public get monthRank(): any {
        return this._monthRank;
    }

    public get yearRank(): any {
        return this._yearRank;
    }

    public get used(): boolean {
        return this._used;
    }

    public set used(value: boolean) {
        this._used = value;
        this.doDrity();
    }
}
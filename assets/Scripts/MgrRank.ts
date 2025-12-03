import { _decorator, Component, director, macro } from 'cc';
import { MgrBase } from './MgrBase';
import { RankData, RankType } from './RankData';
import { MgrGame } from './MgrGame';
import { ITEM, GameConst } from './GameConst';
import {Tools} from './Tools';
import { MgrUser } from './MgrUser';
import RankCfg from './RankCfg';
import { GlobalEvent } from './Events';
import { SdkBridge } from './SdkBridge';
import { LeaderboardManager } from './LeaderboardManager';

const { ccclass, property } = _decorator;

@ccclass('MgrRank')
export class MgrRank extends MgrBase {
    private _rankData: RankData = null!;
    private _rankType: RankType = RankType.Month;
    private _nextMonthTimeStamp: number = 0;
    private _nextMonthTimeStampDiff: number = 0;
    private _timeStep: number = 0;
    
    public friendList: any = null;

    protected onLoad(): void {
        this._rankData = new RankData('rank-data');
    }

    public load(): void {
        this._rankData.load();
    }

    public initLoadData(): void {
        this._getNextMonthTimeStamp();
        this.schedule(this._fixedUpdate, 1, macro.REPEAT_FOREVER, Math.random());
    }

    private _getNextMonthTimeStamp(): void {
        const now = Tools.GetNowDate();
        const year = now.getFullYear();
        const month = now.getMonth();
        const nextMonth = new Date(year, month + 1, 1, 0, 0, 0, 0);
        this._nextMonthTimeStamp = nextMonth.getTime();
    }

    private _fixedUpdate(dt: number): void {
        const now = Tools.GetNowTime();
        this._nextMonthTimeStampDiff = this._nextMonthTimeStamp - now;
        
        if (this._nextMonthTimeStampDiff < 0) {
            this._getNextMonthTimeStamp();
            this._rankData.checkReInitMonthRank();
        }
        
        director.emit(GlobalEvent.refreshMonthRankTimeStamp);
        this._timeStep += dt;
        
        if (this._timeStep >= 60) {
            this._timeStep = 0;
            this._triggerAiRankWisdom();
        }
    }

    public async getRankIndexData(type: RankType): Promise<any> {
        switch (type) {
            case RankType.Month:
                return await this._getRankMonthIndexData();
            case RankType.Year:
                return await this._getRankYearIndexData();
            case RankType.Friend:
                return await this._getFriendIndexData();
            default:
                console.error('typeErr! rankType:', type);
                return null;
        }
    }

    private async _getFriendIndexData(): Promise<any> {
        const userHead = MgrUser.Instance.userData.userHead;
        const wisdom = MgrUser.Instance.userData.getItem(ITEM.Wisdom);
        const playerName = SdkBridge.getPlayerName();
        
        const selfData = {
            head: userHead,
            wisdom: wisdom,
            me: true,
            name: playerName
        };

        const rankList: any[] = [];
        const friendData = await LeaderboardManager.getInstance().getListAsync();
        
        friendData.forEach((item, index) => {
            const isMe = item.getID() === SdkBridge.getPlayerId();
            const score = isMe ? wisdom : item.getScore();
            
            const rankItem = {
                rank: index + 1,
                id: isMe ? SdkBridge.getPlayerId() : item.getID(),
                head: isMe ? SdkBridge.getPlayerPhotoUrl() : item.getPhoto(),
                wisdom: score,
                me: isMe,
                name: item.getName()
            };

            if (isMe) {
                selfData.rank = index + 1;
            }
            
            rankList.push(rankItem);
        });

        rankList.sort((a, b) => b.wisdom - a.wisdom);
        rankList.forEach((item, index) => {
            item.rank = index + 1;
            if (item.id == SdkBridge.getPlayerId()) {
                selfData.rank = index + 1;
            }
        });

        this.friendList = {
            rankData: rankList,
            selfData: selfData
        };

        return this.friendList;
    }

    private _getRankMonthIndexData(): any {
        const rankData: any[] = [];
        
        this._rankData.monthRank.rankItems.forEach((item, index) => {
            rankData[index] = {
                rank: item.rank,
                rTime: item.rTime,
                id: item.id,
                head: item.head,
                wisdom: item.wisdom
            };
        });

        const selfData = {
            head: MgrUser.Instance.userData.userHead,
            wisdom: this._rankData.monthWisdom,
            me: true
        };

        let insertIndex = rankData.length;
        for (let i = rankData.length - 1; i >= 0; i--) {
            const item = rankData[i];
            if (selfData.wisdom < item.wisdom) {
                break;
            }
            insertIndex--;
            item.rank += 1;
        }

        selfData.rank = insertIndex + 1;
        rankData.splice(insertIndex, 0, selfData);

        const showCount = RankCfg.Instance.getRankPlayerShowCnt(RankType.Month);
        return {
            rankData: rankData.slice(0, showCount),
            selfData: selfData
        };
    }

    private _getRankYearIndexData(): any {
        const rankData: any[] = [];
        
        this._rankData.yearRank.rankItems.forEach((item, index) => {
            rankData[index] = {
                rank: item.rank,
                rTime: item.rTime,
                id: item.id,
                head: item.head,
                wisdom: item.wisdom
            };
        });

        const selfData = {
            head: MgrUser.Instance.userData.userHead,
            wisdom: MgrUser.Instance.userData.getItem(ITEM.Wisdom),
            me: true
        };

        let insertIndex = rankData.length;
        for (let i = rankData.length - 1; i >= 0; i--) {
            const item = rankData[i];
            if (selfData.wisdom < item.wisdom) {
                break;
            }
            insertIndex--;
            item.rank += 1;
        }

        selfData.rank = insertIndex + 1;
        rankData.splice(insertIndex, 0, selfData);

        const showCount = RankCfg.Instance.getRankPlayerShowCnt(RankType.Year);
        return {
            rankData: rankData.slice(0, showCount),
            selfData: selfData
        };
    }

    private _triggerAiRankWisdom(): void {
        this._rankData.checkRefreshMonthRank();
        this._rankData.checkRefreshYearRank();
    }

    public canShowRank(): boolean {
        return MgrGame.Instance.gameData.maxLv >= GameConst.RankShowLv;
    }

    public addMonthWisdom(value: number): void {
        if (value < 0) {
            console.error('rangeErr! value:', value);
            return;
        }
        this._rankData.addMonthWisdom(value);
    }

    public get rankData(): RankData {
        return this._rankData;
    }

    public get rankType(): RankType {
        return this._rankType;
    }

    public set rankType(value: RankType) {
        this._rankType = value;
        director.emit(GlobalEvent.refreshRankType);
    }

    public get nextMonthTimeStampDiff(): number {
        return this._nextMonthTimeStampDiff;
    }

    private static _instance: MgrRank = null!;
    public static get Instance(): MgrRank {
        return MgrRank._instance;
    }
}
import { _decorator, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import { ITEM, GameConst } from './GameConst';
import { MgrChallengeStorage } from './MgrChallengeStorage';
import {cloneDeep, get} from 'lodash-es';
import { MgrDetail } from './MgrDetail';
import { GameMode, TASK_TYPE } from './Const';
import { MgrTask } from './MgrTask';
import { Tools } from './Tools';
import { MAX_COLLECTED, MgrGame } from './MgrGame';
import { MgrPig } from './MgrPig';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrAnalytics } from './MgrAnalytics';
import { AppGame } from './AppGame';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('MgrChallenge')
export class MgrChallenge extends MgrBase {
    private _startTime: moment.Moment | null = null;
    private _curLv: number | null = null;
    private _curTime: moment.Moment | null = null;

    public load(): void {
        this._startTime = moment('2023-01-01 00:00');
    }

    public initLoadData(): void {}

    public getLevelByDate(date: moment.Moment): number {
        let level = 1;
        const diffDays = date.diff(this._startTime, 'days');
        if (diffDays >= 0) {
            level = 1 + (diffDays + GameConst.CHALLENGE_START) % (GameConst.CHALLENGE_LEVEL - 1);
        }
        return level;
    }

    public getLevelPassEnable(date: number): boolean {
        const data = MgrChallengeStorage.Instance.getData(date);
        return data?.isPass === true;
    }

    public getLevelProgress(date: number): number {
        let progress = 0;
        const data = MgrChallengeStorage.Instance.getData(date);
        if (data && data.progress) {
            progress = data.progress;
        }
        return progress;
    }

    public getLevelData(date: number): any {
        return MgrChallengeStorage.Instance.getData(date);
    }

    public getRedDotEnable(): boolean {
        const today = Tools.GetNowMoment().startOf('day').valueOf();
        return !MgrChallenge.Instance.getLevelPassEnable(today);
    }

    public addPlayTime(): void {
        const date = moment(this._curTime).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        const playTime = (data?.playTime || 0) + 1;

        const saveData = {
            level: this.curLv,
            collected: data?.collected || [],
            collectPoolCnt: data?.collectPoolCnt || MAX_COLLECTED,
            attachs: data?.attachs || {},
            points: data?.points || [],
            goldCube: data?.goldCube || 0,
            isPass: data?.isPass || false,
            progress: data?.progress || 0,
            date: date.format('YYYY-MM-DD'),
            playTime: playTime,
            winTime: data?.winTime || 0,
            lossTime: data?.lossTime || 0,
            reviveCnt: data?.reviveCnt || 0
        };
        MgrChallengeStorage.Instance.saveData(saveData);
    }

    public addWinTime(time: moment.Moment): void {
        const date = moment(time).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        const winTime = (data?.winTime || 0) + 1;

        const saveData = {
            level: this.curLv,
            collected: data?.collected || [],
            collectPoolCnt: data?.collectPoolCnt || MAX_COLLECTED,
            attachs: data?.attachs || {},
            points: data?.points || [],
            goldCube: data?.goldCube || 0,
            isPass: data?.isPass || false,
            progress: data?.progress || 0,
            date: date.format('YYYY-MM-DD'),
            playTime: data?.playTime || 1,
            winTime: winTime,
            lossTime: data?.lossTime || 0,
            reviveCnt: data?.reviveCnt || 0
        };
        MgrChallengeStorage.Instance.saveData(saveData);
    }

    public addLossTime(): void {
        const date = moment(this._curTime).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        const lossTime = (data?.lossTime || 0) + 1;

        const saveData = {
            level: this.curLv,
            collected: data?.collected || [],
            collectPoolCnt: data?.collectPoolCnt || MAX_COLLECTED,
            points: data?.points || [],
            goldCube: data?.goldCube || 0,
            attachs: data?.attachs || {},
            isPass: data?.isPass || false,
            progress: 0,
            date: date.format('YYYY-MM-DD'),
            playTime: data?.playTime || 1,
            winTime: data?.winTime || 0,
            lossTime: lossTime,
            reviveCnt: data?.reviveCnt || 0
        };
        MgrChallengeStorage.Instance.saveData(saveData);
    }

    public addReviveTime(): void {
        const date = moment(this._curTime).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        const reviveCnt = (data?.reviveCnt || 0) + 1;

        const saveData = {
            level: this.curLv,
            collected: data?.collected || [],
            collectPoolCnt: data?.collectPoolCnt || MAX_COLLECTED,
            points: data?.points || [],
            goldCube: data?.goldCube || 0,
            attachs: data?.attachs || {},
            isPass: data?.isPass || false,
            progress: 0,
            date: date.format('YYYY-MM-DD'),
            playTime: data?.playTime || 1,
            winTime: data?.winTime || 0,
            lossTime: data?.lossTime || 0,
            reviveCnt: reviveCnt
        };
        MgrChallengeStorage.Instance.saveData(saveData);
    }

    public clearReviveTime(): void {
        const date = moment(this._curTime).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());

        const saveData = {
            level: this.curLv,
            collected: data?.collected || [],
            collectPoolCnt: data?.collectPoolCnt || MAX_COLLECTED,
            points: data?.points || [],
            goldCube: data?.goldCube || 0,
            attachs: data?.attachs || {},
            isPass: data?.isPass || false,
            progress: 0,
            date: date.format('YYYY-MM-DD'),
            playTime: data?.playTime || 1,
            winTime: data?.winTime || 0,
            lossTime: data?.lossTime || 0,
            reviveCnt: 0
        };
        MgrChallengeStorage.Instance.saveData(saveData);
    }

    public getReviveTime(): number {
        const date = moment(this._curTime).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        return data?.reviveCnt || 0;
    }

    public saveMap(
        collected: any[], 
        collectPoolCnt: number, 
        goldCube: number, 
        points: any[], 
        progress: number, 
        attachs: any = {}, 
        isPass: boolean = false
    ): void {
        const date = moment(this._curTime).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        const finalIsPass = isPass || (data && data.isPass) || false;

        const saveData = {
            level: this.curLv,
            collected: cloneDeep(collected),
            collectPoolCnt: collectPoolCnt,
            points: cloneDeep(points),
            goldCube: goldCube,
            isPass: finalIsPass,
            progress: progress,
            date: date.format('YYYY-MM-DD'),
            playTime: data?.playTime || 1,
            winTime: data?.winTime || 0,
            lossTime: data?.lossTime || 0,
            reviveCnt: data?.reviveCnt || 0,
            attachs: cloneDeep(attachs)
        };
        MgrChallengeStorage.Instance.saveData(saveData);
    }

    public clearMap(): void {
        const date = moment(this._curTime).startOf('day').valueOf();
        const data = MgrChallengeStorage.Instance.getData(date);

        const saveData = {
            level: this.curLv,
            collected: [],
            collectPoolCnt: MAX_COLLECTED,
            points: [],
            goldCube: 0,
            attachs: {},
            isPass: data?.isPass || false,
            progress: 0,
            date: data?.date,
            playTime: data?.playTime || 1,
            winTime: data?.winTime || 0,
            lossTime: data?.lossTime || 0,
            reviveCnt: data?.reviveCnt || 0
        };
        MgrChallengeStorage.Instance.saveData(saveData);
    }

    public getAttachData(key: string): number {
        const date = moment(this._curTime).startOf('day');
        const attachs = MgrChallengeStorage.Instance.getData(date.valueOf())?.attachs || {};
        return get(attachs, key, 0);
    }

    public enterChallenge(): void {
        const self = this;
        AppGame.Ins.switchToGame(GameMode.Challenge, () => {
            AppGame.gameBg.showChallengeBg(() => {});
            AppGame.gameCtrl.createGame();
            self.reportChallengeStart();
            MgrAnalytics.Instance.startGameTime();
        });
    }

    public victory(rewards: any, stars: any): void {
        this.addWinTime(this._curTime);
        const date = moment(this._curTime).startOf('day').valueOf();
        
        if (!this.getLevelPassEnable(date)) {
            MgrDetail.Instance.data.addChallengeTime();
        }
        
        if (!this.getLevelPassEnable(moment(MgrChallenge.Instance.curTime).startOf('day').valueOf())) {
            MgrGame.Instance.victoryGold = true;
            MgrGame.Instance.goldLighting = true;
            MgrPig.Instance.addPigCoin();
            MgrPig.Instance.addPassLevelCnt();
        }
        
        this.saveMap([], MAX_COLLECTED, 0, [], 0, {}, true);
        this.checkMonthComplete();
        
        const starCount = stars[ITEM.Star] || 0;
        this.reportChallengeVictory(starCount);
    }

    public failed(): void {
        this.clearMap();
        this.addLossTime();
        this.reportChallengeFail();
    }

    public trySalvage(callback: Function): void {
        const reviveCnt = MgrGame.Instance.getReviveCnt();
        const hasGoldCube = AppGame.gameCtrl.curLogic.collectGoldCube > 0;
        
        if (hasGoldCube && reviveCnt === 0) {
            MgrUi.Instance.openViewAsync(UIPrefabs.GameClearView, {
                priority: 2,
                data: {
                    hasGoldCube: hasGoldCube,
                    confirmCall: () => {
                        callback(false);
                    },
                    continueCall: (result: boolean) => {
                        callback(true, result);
                    }
                }
            });
        } else {
            callback(false);
        }
    }

    public checkMonthComplete(): boolean {
        let isComplete = true;
        const days: number[] = [];
        const currentTime = this._curTime;
        const daysInMonth = currentTime.daysInMonth();
        
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        
        const lastDay = days[days.length - 1];
        const lastDate = moment(currentTime).startOf('month').startOf('day').add(lastDay - 1, 'days');
        
        if (Tools.GetNowMoment().isAfter(lastDate)) {
            for (let i = 0; i < days.length; i++) {
                const day = days[i];
                const date = moment(currentTime).startOf('month').startOf('day').add(day - 1, 'days').valueOf();
                if (!this.getLevelPassEnable(date)) {
                    isComplete = false;
                    break;
                }
            }
        } else {
            isComplete = false;
        }
        
        if (!isComplete) {
            return isComplete;
        }
        
        let hasMedal = false;
        const medalData = MgrChallengeStorage.Instance.getMadelData();
        for (let i = 0; i < medalData.length; i++) {
            const medal = medalData[i];
            if (currentTime.startOf('month').isSame(medal, 'month')) {
                hasMedal = true;
                return;
            }
        }
        
        if (!hasMedal) {
            MgrTask.Instance.data.addTaskData(TASK_TYPE.MONTH_CHALLENGE, 1);
            MgrChallengeStorage.Instance.addMadelData(currentTime);
        }
        
        return isComplete;
    }

    public reportChallengeStart(): void {
        const levelName = 'ChallengeLevel_' + MgrChallenge.Instance.curLv;
        const date = moment(MgrChallenge.Instance.curTime).startOf('day');
        const type = date.isSame(Tools.GetNowMoment(), 'day') ? 'New' : 'Continue';
        const dateStr = date.format('YYYY-MM-DD');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        
        const params = {
            ChallegeLevel_Id: date.diff(MgrChallenge.Instance.startTime, 'day'),
            ChallegeLevel_Name: levelName,
            ChallegeLevel_Type: type,
            ChallegeLevel_Time: dateStr,
            In_Times: data.playTime,
            FailTimes: data.lossTime
        };
        AnalyticsManager.getInstance().reportChallengeStart(params);
    }

    public reportChallengeVictory(starCount: number): void {
        const date = moment(MgrChallenge.Instance.curTime).startOf('day');
        const data = MgrChallengeStorage.Instance.getData(date.valueOf());
        const levelId = date.diff(MgrChallenge.Instance.startTime, 'day');
        const gameTime = Math.floor(MgrAnalytics.Instance.gameTime);
        
        const params = {
            ChallegeLevel_Id: levelId,
            Game_Duration: gameTime,
            Duration: gameTime,
            StarNum: starCount,
            Wintimes: data.winTime
        };
        AnalyticsManager.getInstance().reportChallengeVictory(params);
    }

    public reportChallengeFail(): void {
        const params = {
            ChallegeLevel_Id: moment(MgrChallenge.Instance.curTime).startOf('day').diff(MgrChallenge.Instance.startTime, 'day'),
            Game_Duration: Math.floor(MgrAnalytics.Instance.gameTime)
        };
        AnalyticsManager.getInstance().reportChallengeFail(params);
    }

    public reportChallengeRevive(reviveType: any): void {
        const date = moment(MgrChallenge.Instance.curTime).startOf('day');
        const params = {
            ChallegeLevel_Id: date.diff(MgrChallenge.Instance.startTime, 'day'),
            ReviveType: reviveType,
            FailTimes: MgrChallengeStorage.Instance.getData(date.valueOf()).lossTime
        };
        AnalyticsManager.getInstance().reportChallengeRevive(params);
    }

    public get startTime(): moment.Moment {
        return this._startTime;
    }

    public get curLv(): number {
        return this._curLv;
    }

    public set curLv(value: number) {
        this._curLv = value;
    }

    public get curTime(): moment.Moment {
        return cloneDeep(this._curTime);
    }

    public set curTime(value: moment.Moment) {
        this._curTime = value;
    }

    private static _instance: MgrChallenge;
    public static get Instance(): MgrChallenge {
        return MgrChallenge._instance;
    }
}
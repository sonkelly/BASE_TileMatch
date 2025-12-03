import { _decorator, cclegacy, macro, director, sys } from 'cc';
import {Language} from './Language';
import {MgrBase} from './MgrBase';
import { GoldTournamentData, TournamentStatus } from './GoldTournamentData';
import {Tools} from './Tools';
import { GlobalEvent } from './Events';
import { MgrGame } from './MgrGame';
import { GameConst, ITEM } from './GameConst';
import {RankAiNameCfg} from './RankAiNameCfg';
import {AvatarCfg} from './AvatarCfg';
import {GoldRankCfg} from './GoldRankCfg';
import {Utils} from './Utils';
import { config } from './Config';
import { MgrUser } from './MgrUser';
import GoldRankAiCfg from './GoldRankAiCfg';
import { MgrTask } from './MgrTask';
import { TASK_TYPE, ACTIVE_STATUS } from './Const';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { GoldTourBtn } from './GoldTourBtn';
import { GuidePos } from './WeakGuide';
import { MgrWeakGuide } from './MgrWeakGuide';
import { AnalyticsManager } from './AnalyticsManager';
import {GoldRankRewardCfg} from './GoldRankRewardCfg';
import {each, isEmpty} from 'lodash-es';

const { ccclass, property } = _decorator;

export const GtRankShowSpIndex = 3;
const GtRankIndexColorSelf = '#FCFF00';
const GtRankIndexColorOther = '#FFFFFF';
const GtRankNickColorSelf = '#FFD900';
const GtRankNickColorOther = '#FFFFFF';

const STORAGE_KEY = 'goldTour-rank';

@ccclass('MgrGoldTournament')
export class MgrGoldTournament extends MgrBase {
    private _data: GoldTournamentData = null!;
    private _goldTourRank: any = {};
    private _goldTourFinishTimeStampDiff: number = 0;
    private _timeStep: number = 0;

    private static _instance: MgrGoldTournament;
    public static get Instance(): MgrGoldTournament {
        return MgrGoldTournament._instance;
    }

    public get data(): GoldTournamentData {
        return this._data;
    }

    public get goldTourRank(): any {
        return this._goldTourRank;
    }

    public get goldTourFinishTimeStampDiff(): number {
        return this._goldTourFinishTimeStampDiff;
    }

    protected onLoad(): void {
        this._data = new GoldTournamentData('goldTour-data');
    }

    public load(): void {
        this._data.load();
        this._deserializedGoldTourRank();
    }

    public initLoadData(): void {
        this._checkTournament();
        this.schedule(this._fixedUpdate, 1, macro.REPEAT_FOREVER, Math.random());
    }

    private _fixedUpdate(dt: number): void {
        this._checkTournament(dt);
    }

    private _checkTournament(dt: number = 0): void {
        if (MgrGame.Instance.gameData.maxLv < GameConst.GOLDTOURNAMENT_OPEN_LEVEL) {
            this._data.tourStatus = TournamentStatus.Wait;
            return;
        }

        this._data.refreshTournamentInfo();

        if (!this._data.recentPeriod) {
            this._data.tourStatus = TournamentStatus.Wait;
            return;
        }

        if (this._data.recentPeriod && this._data.firstPeriod && this._data.recentPeriod < this._data.firstPeriod) {
            this._data.tourStatus = TournamentStatus.Wait;
            return;
        }

        if (this.data.checkPeriodIsSettle(this._data.recentPeriod)) {
            this._data.tourStatus = TournamentStatus.Wait;
            return;
        }

        if (this._data.tourPeriod && this._data.tourPeriod != this._data.recentPeriod) {
            if (this._data.tourStatus == TournamentStatus.WaitReward) {
                return;
            }
            if (!this.data.checkPeriodIsSettle(this._data.tourPeriod)) {
                this._dealTourInWaitReward();
                return;
            }
        }

        const nowTime = Tools.GetNowTime();
        if (nowTime < this._data.recentStartTime) {
            this._data.tourStatus = TournamentStatus.Wait;
            return;
        }

        if (nowTime >= this._data.recentEndTime) {
            if (this._data.tourStatus >= TournamentStatus.WaitReward) {
                return;
            }
            if (this._data.tourPeriod == this._data.recentPeriod) {
                this._dealTourInWaitReward();
            }
            return;
        }

        if (nowTime >= this._data.recentStartTime) {
            if (this._data.tourStatus == TournamentStatus.Open) {
                this._goldTourFinishTimeStampDiff = this._data.recentEndTime - Tools.GetNowTime();
                director.emit(GlobalEvent.refreshGoldTourTimeStamp);
                this._timeStep += dt;
                if (this._timeStep >= 60) {
                    this._timeStep = 0;
                    this._triggerAiRankCube();
                }
            } else {
                this._goldTourFinishTimeStampDiff = this._data.recentEndTime - Tools.GetNowTime();
                this._dealTourInOpen();
            }
        }
    }

    private _dealTourInWaitReward(): void {
        const rankData = this.getGoldTourRankIndexData();
        const showCnt = GoldRankCfg.Instance.getRankPlayerShowCnt();
        const selfRank = rankData?.selfData?.rank || showCnt + 100;

        if (selfRank > showCnt) {
            this._data.tourStatus = TournamentStatus.Rewarded;
            if (!this.data.checkPeriodIsSettle(this._data.tourPeriod)) {
                this._data.settlePeriod(this._data.tourPeriod, selfRank);
            }

            const goldCube = this._data.goldCube;
            const rank = selfRank;
            const goldFlower = MgrUser.Instance.userData.getItem(ITEM.GoldFlower);
            const rewardStr = GoldRankRewardCfg.Instance.getAllRewardStrById(selfRank);

            AnalyticsManager.getInstance().reportGoldGet({
                Gold_Point: goldCube,
                Gold_Rank: rank,
                Gold_Type: 1,
                Gold_Reward_Progress: goldFlower,
                Reward: rewardStr
            });
        } else {
            this._data.tourStatus = TournamentStatus.WaitReward;
        }
    }

    private _dealTourInOpen(): void {
        if (this._data.tourPeriod != this._data.recentPeriod) {
            this._data.tourPeriod = this._data.recentPeriod;
            this._data.tip = false;
            this._data.goldCube = 0;
            this._initGoldTourRank();
        } else {
            this._triggerAiRankCube();
        }
        this._data.tourStatus = TournamentStatus.Open;
    }

    private _initGoldTourRank(save: boolean = true): void {
        this._goldTourRank.period = this._data.tourPeriod;
        this._goldTourRank.rankItems = [];

        const playerNum = GoldRankCfg.Instance.getRankPlayerNum();
        const aiNames = RankAiNameCfg.Instance.radomAiNameIds(playerNum);

        for (let i = 0; i < aiNames.length; i++) {
            const time = Tools.GetNowTime();
            const id = aiNames[i];
            const headId = AvatarCfg.Instance.getRandomHeadId();
            const cube = this._initGoldRankCube();

            this._goldTourRank.rankItems.push({
                id: id,
                head: headId,
                rTime: time,
                cube: cube
            });
        }

        this._goldTourRank.rankItems.sort((a: any, b: any) => b.cube - a.cube);
        this._goldTourRank.rankItems.forEach((item: any, index: number) => {
            item.rank = index + 1;
        });

        if (save) {
            this._serializeGoldTourRank();
        }
    }

    private _initGoldRankCube(): number {
        const startPoint = GoldRankCfg.Instance.getRankStartPoint();
        let cube = Utils.randomRange(startPoint[0], startPoint[1]);
        const nowTime = Tools.GetNowTime();
        const days = Math.floor((nowTime - this._data.recentStartTime) / 86400000);

        if (days > 0) {
            const dayPoint = GoldRankCfg.Instance.getRankStartDayPoint();
            for (let i = 0; i < days; i++) {
                cube += Utils.randomRange(dayPoint[0], dayPoint[1]);
            }
        }

        cube += 3 - cube % 3;
        return cube;
    }

    private _triggerAiRankCube(): void {
        let needUpdate = false;
        const nowTime = Tools.GetNowTime();

        if (!this._goldTourRank?.rankItems || this._goldTourRank.rankItems.length <= 0) {
            console.warn('no goldTournament rankData! reInit');
            this._initGoldTourRank(false);
            needUpdate = true;
        } else {
            for (let i = 0; i < this._goldTourRank.rankItems.length - 1; i++) {
                const item = this._goldTourRank.rankItems[i];
                const addInfo = GoldRankAiCfg.Instance.getAiRankAddInfo(item.rank);
                const timeDiff = nowTime - item.rTime;
                const interval = 60000 * addInfo.aiTime;
                const times = Math.floor(timeDiff / interval);

                if (times > 0) {
                    needUpdate = true;
                    let addCube = 0;
                    const addRange = addInfo.aiAddRange;
                    const percent = addInfo.aiPercent;

                    for (let j = 0; j < times; j++) {
                        if (Utils.randomRange(0, 100) <= percent) {
                            addCube += Utils.randomRange(addRange[0], addRange[1]);
                        }
                    }

                    addCube += 3 - addCube % 3;
                    item.rTime = nowTime;
                    item.cube += addCube;
                }
            }
        }

        if (needUpdate) {
            this._goldTourRank.rankItems.sort((a: any, b: any) => b.cube - a.cube);
            this._goldTourRank.rankItems.forEach((item: any, index: number) => {
                item.rank = index + 1;
            });
            this._serializeGoldTourRank();
            director.emit(GlobalEvent.refreshGoldTourRankAiData);
        }
    }

    private _serializeGoldTourRank(): void {
        const data = {
            period: this._goldTourRank.period,
            rankItems: []
        };

        each(this._goldTourRank.rankItems, (item: any, index: number) => {
            data.rankItems[index] = [
                item.rank,
                item.rTime,
                item.id,
                item.head,
                item.cube
            ];
        });

        const jsonStr = JSON.stringify(data);
        sys.localStorage.setItem(config.gameName + '-' + STORAGE_KEY, jsonStr);
    }

    private _deserializedGoldTourRank(): void {
        let data: any = {};
        const jsonStr = sys.localStorage.getItem(config.gameName + '-' + STORAGE_KEY);
        
        if (!isEmpty(jsonStr)) {
            data = JSON.parse(jsonStr);
        }

        if (!isEmpty(data)) {
            this._goldTourRank.period = data.period;
            this._goldTourRank.rankItems = [];
            
            each(data.rankItems, (itemData: any[], index: number) => {
                this._goldTourRank.rankItems[index] = {
                    rank: itemData[0],
                    rTime: itemData[1],
                    id: itemData[2],
                    head: itemData[3],
                    cube: itemData[4]
                };
            });
        }
    }

    public getGoldTourRankIndexData(): any {
        const rankList: any[] = [];
        const items = this._goldTourRank?.rankItems || [];

        if (items.length <= 0) {
            return null;
        }

        items.forEach((item: any) => {
            rankList.push({
                rank: item.rank,
                rTime: item.rTime,
                id: item.id,
                head: item.head,
                cube: item.cube
            });
        });

        const selfData = {
            head: MgrUser.Instance.userData.userHead,
            cube: this._data.goldCube,
            me: true
        };

        let insertIndex = rankList.length;
        for (let i = rankList.length - 1; i >= 0; i--) {
            const item = rankList[i];
            if (selfData.cube < item.cube) {
                break;
            }
            insertIndex--;
            item.rank += 1;
        }

        selfData.rank = insertIndex + 1;
        rankList.splice(insertIndex, 0, selfData);

        const showCnt = GoldRankCfg.Instance.getRankPlayerShowCnt();
        return {
            rankData: rankList.slice(0, showCnt),
            selfData: selfData
        };
    }

    private _checkInTourOpen(): boolean {
        return this._data.tourStatus == TournamentStatus.Open;
    }

    public checkGoldTourOpen(): boolean {
        return MgrGame.Instance.gameData.maxLv >= GameConst.GOLDTOURNAMENT_OPEN_LEVEL && this._checkInTourOpen();
    }

    public addGoldCubeCnt(count: number): void {
        if (this.checkGoldTourOpen()) {
            this._data.goldCube += count;
            
            if (MgrTask.Instance.data.goldTourIdx != this._data.tourPeriod) {
                MgrTask.Instance.data.goldTourIdx = this._data.tourPeriod;
                MgrTask.Instance.data.addTaskData(TASK_TYPE.JOIN_GOLDTOUR, 1);
            }

            const rankData = this.getGoldTourRankIndexData();
            if (rankData) {
                const cube = this._data.goldCube;
                const rank = rankData.selfData.rank;
                
                AnalyticsManager.getInstance().reportGoldProgress({
                    Gold_Point: cube,
                    Gold_Rank: rank,
                    Gold_Type: 1
                });
            }
        }
    }

    public checkNeedGuide(): boolean {
        return this.checkGoldTourOpen() && !this._data.tip;
    }

    public guide(callback?: Function): void {
        const btn = AppGame.topUI.goldTourBtn;
        btn.getComponent(GoldTourBtn).refreshTimeLabel();
        let clicked = false;
        const goldFlower = MgrUser.Instance.userData.getItem(ITEM.GoldFlower);

        AnalyticsManager.getInstance().reportGoldOpen({
            Gold_Type: 1,
            Gold_Reward_Progress: goldFlower
        });

        MgrWeakGuide.Instance.openWeakGuide({
            node: btn.node,
            click: () => {
                clicked = true;
                const view = MgrUi.Instance.getView(UIPrefabs.GoldTournamentView.url);
                if (view) {
                    view.once(VIEW_ANIM_EVENT.Remove, callback);
                } else if (MgrUi.Instance.hasViewQueus(UIPrefabs.GoldTournamentView.url)) {
                    MgrUi.Instance.addViewAsyncQueueCallback(UIPrefabs.GoldTournamentView, (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, callback);
                    });
                } else {
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentView, {
                        root: MgrUi.root(1),
                        callback: (view: any) => {
                            view.once(VIEW_ANIM_EVENT.Remove, callback);
                        }
                    });
                }
            },
            close: () => {
                this.data.tip = true;
                if (!clicked && callback) {
                    callback();
                }
            },
            pos: GuidePos.Right,
            lang: 'gold_trophy'
        });
    }

    public tryAutoReward(callback?: Function): void {
        if (this.data.tourStatus == TournamentStatus.WaitReward) {
            AppGame.topUI.goldCubeBtn.hideGoldCube();
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentRewardView, {
                root: MgrUi.root(2),
                callback: (view: any) => {
                    view.once(VIEW_ANIM_EVENT.Remove, () => {
                        callback && callback();
                    });
                }
            });
            return;
        }
        callback && callback();
    }

    public onEnter(): void {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentView, {
            root: MgrUi.root(1)
        });
    }

    public getUnlockInfo(): string {
        return Language.Instance.getLangByID('event_level_unlock').replace('{0}', GameConst.GOLDTOURNAMENT_OPEN_LEVEL.toString());
    }

    public getOpenTimeInfo(): string {
        return Language.Instance.getLangByID('GoldTournamentOpenTime');
    }

    public getActiveStatus(): number {
        if (MgrGame.Instance.gameData.maxLv < GameConst.GOLDTOURNAMENT_OPEN_LEVEL) {
            return ACTIVE_STATUS.LOCK;
        }

        const nowTime = Tools.GetNowTime();
        if (nowTime < this._data.recentStartTime || nowTime > this._data.recentEndTime) {
            return ACTIVE_STATUS.GAP;
        }
        return ACTIVE_STATUS.ACTIVE;
    }

    public getRemainTime(): number {
        return this._goldTourFinishTimeStampDiff;
    }

    public hasGuide(): boolean {
        return this._data.tip;
    }
}
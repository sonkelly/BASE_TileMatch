import { _decorator, director, sys, macro } from 'cc';
import {MgrBase} from './MgrBase';
import {GoldTournamentV2Data} from './GoldTournamentV2Data';
import {MgrGame} from './MgrGame';
import * as GameConstModule from './GameConst';
import { ITEM } from './GameConst';
import { TournamentStatus } from './GoldTournamentData';
import {Tools} from './Tools';
import { GlobalEvent } from './Events';
import {GoldRankV2Cfg} from './GoldRankV2Cfg';
import {RankAiNameCfg} from './RankAiNameCfg';
import {AvatarCfg} from './AvatarCfg';
import {Utils} from './Utils';
import GoldRankAiV2Cfg from './GoldRankAiV2Cfg';
import { config as GameConfig } from './Config';
import {MgrUser} from './MgrUser';
import { TASK_TYPE, ACTIVE_STATUS } from './Const';
import {MgrTask} from './MgrTask';
import {AppGame} from './AppGame';
import {GoldTourV2Btn} from './GoldTourV2Btn';
import {MgrUi} from './MgrUi';
import {UIPrefabs} from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {MgrWeakGuide} from './MgrWeakGuide';
import { GuidePos } from './WeakGuide';
import {AnalyticsManager} from './AnalyticsManager';
import {GoldRankRewardV2Cfg} from './GoldRankRewardV2Cfg';
import {Language} from './Language';
import {each,isEmpty} from 'lodash-es';

const GOLD_TOUR_V2_RANK_KEY = 'goldTourV2-rank';
const { ccclass } = _decorator;
const GameConst: any = GameConstModule; // keep as any to match original behavior

@ccclass('MgrGoldTournamentV2')
export class MgrGoldTournamentV2 extends MgrBase {
    private _data: GoldTournamentV2Data | null = null;
    private _goldTourRank: any = {};
    private _goldTourFinishTimeStampDiff: number = 0;
    private _timeStep: number = 0;

    onLoad() {
        this._data = new GoldTournamentV2Data('goldTourV2-data');
    }

    load() {
        if (this._data) {
            this._data.load();
            this._deserializedGoldTourRank();
        }
    }

    initLoadData() {
        this._checkTournament();
        this.schedule(this._fixedUpdate, 1, macro.REPEAT_FOREVER, Math.random());
    }

    private _fixedUpdate(dt: number) {
        this._checkTournament(dt);
    }

    private _checkTournament(dt: number = 0) {
        if (MgrGame.Instance.gameData.maxLv < GameConst.GOLDTOURNAMENT_V2_OPEN_LEVEL) {
            if (this._data) this._data.tourStatus = TournamentStatus.Wait;
        } else {
            if (!this._data) return;
            this._data.refreshTournamentInfo();
            if (this._data.recentPeriod) {
                if (this._data.recentPeriod && this._data.firstPeriod && this._data.recentPeriod < this._data.firstPeriod) {
                    this._data.tourStatus = TournamentStatus.Wait;
                } else {
                    if (this.data.checkPeriodIsSettle(this._data.recentPeriod)) {
                        this._data.tourStatus = TournamentStatus.Wait;
                    } else {
                        if (this._data.tourPeriod && this._data.tourPeriod != this._data.recentPeriod) {
                            if (this._data.tourStatus == TournamentStatus.WaitReward) {
                                return;
                            }
                            if (!this.data.checkPeriodIsSettle(this._data.tourPeriod)) {
                                this._dealTourInWaitReward();
                                return;
                            }
                        }
                        const now = Tools.GetNowTime();
                        if (now < this._data.recentStartTime) {
                            this._data.tourStatus = TournamentStatus.Wait;
                        } else {
                            if (!(now >= this._data.recentEndTime)) {
                                if (now >= this._data.recentStartTime) {
                                    if (this._data.tourStatus == TournamentStatus.Open) {
                                        this._goldTourFinishTimeStampDiff = this._data.recentEndTime - Tools.GetNowTime();
                                        director.emit(GlobalEvent.refreshGoldTourTimeStampV2);
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
                                return;
                            }
                            if (this._data.tourStatus >= TournamentStatus.WaitReward) {
                                return;
                            }
                            if (this._data.tourPeriod == this._data.recentPeriod) {
                                this._dealTourInWaitReward();
                            }
                        }
                    }
                }
            } else {
                this._data.tourStatus = TournamentStatus.Wait;
            }
        }
    }

    private _dealTourInWaitReward() {
        const rankIdxData = this.getGoldTourRankIndexData();
        const showCnt = GoldRankV2Cfg.Instance.getRankPlayerShowCnt();
        const rankOfSelf = (rankIdxData?.selfData?.rank) ?? (showCnt + 100);
        if (rankOfSelf > showCnt) {
            if (this._data) {
                this._data.tourStatus = TournamentStatus.Rewarded;
                if (!this._data.checkPeriodIsSettle(this._data.tourPeriod)) {
                    this._data.settlePeriod(this._data.tourPeriod, rankOfSelf);
                }
                const goldCube = this._data.goldCube;
                const rank = rankOfSelf;
                const challengeStar = MgrUser.Instance.userData.getItem(ITEM.ChallengeStar);
                const rewardStr = GoldRankRewardV2Cfg.Instance.getAllRewardStrById(rankOfSelf);
                AnalyticsManager.getInstance().reportGoldGet({
                    Gold_Point: goldCube,
                    Gold_Rank: rank,
                    Gold_Type: 2,
                    Gold_Reward_Progress: challengeStar,
                    Reward: rewardStr
                });
            }
        } else {
            if (this._data) this._data.tourStatus = TournamentStatus.WaitReward;
        }
    }

    private _dealTourInOpen() {
        if (!this._data) return;
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

    private _initGoldTourRank(save: boolean = true) {
        this._goldTourRank.period = this._data ? this._data.tourPeriod : undefined;
        this._goldTourRank.rankItems = [];
        const playerNum = GoldRankV2Cfg.Instance.getRankPlayerNum();
        const aiIds = RankAiNameCfg.Instance.radomAiNameIds(playerNum);
        for (let i = 0; i < aiIds.length; i++) {
            const now = Tools.GetNowTime();
            const id = aiIds[i];
            const head = AvatarCfg.Instance.getRandomHeadId();
            const cube = this._initGoldRankCube();
            this._goldTourRank.rankItems.push({
                id,
                head,
                rTime: now,
                cube
            });
        }
        this._goldTourRank.rankItems.sort((a: any, b: any) => b.cube - a.cube);
        this._goldTourRank.rankItems.forEach((item: any, idx: number) => {
            item.rank = idx + 1;
        });
        if (save) this._serializeGoldTourRank();
    }

    private _initGoldRankCube() {
        const startPoint = GoldRankV2Cfg.Instance.getRankStartPoint();
        const min = startPoint[0];
        const max = startPoint[1];
        let val = Utils.randomRange(min, max);
        const now = Tools.GetNowTime();
        const days = Math.floor((now - (this._data ? this._data.recentStartTime : 0)) / 86400000);
        if (days > 0) {
            const startDayPoint = GoldRankV2Cfg.Instance.getRankStartDayPoint();
            const dmin = startDayPoint[0];
            const dmax = startDayPoint[1];
            for (let i = 0; i < days; i++) {
                val += Utils.randomRange(dmin, dmax);
            }
        }
        // adjust to multiple of 3, with minimum +3 adjustment
        val += 3 - (val % 3);
        return val;
    }

    private _triggerAiRankCube() {
        let changed = false;
        const now = Tools.GetNowTime();
        if (!this._goldTourRank?.rankItems || this._goldTourRank.rankItems.length <= 0) {
            console.warn('no goldTournament rankData! reInit');
            this._initGoldTourRank(false);
            changed = true;
        } else {
            for (let i = 0; i < this._goldTourRank.rankItems.length - 1; i++) {
                const it = this._goldTourRank.rankItems[i];
                const addInfo = GoldRankAiV2Cfg.Instance.getAiRankAddInfo(it.rank);
                const diff = now - it.rTime;
                const unit = 60000 * addInfo.aiTime;
                const times = Math.floor(diff / unit);
                if (times > 0) {
                    changed = true;
                    let addTotal = 0;
                    const range = addInfo.aiAddRange;
                    const rmin = range[0];
                    const rmax = range[1];
                    const percent = addInfo.aiPercent;
                    for (let t = 0; t < times; t++) {
                        if (Utils.randomRange(0, 100) <= percent) {
                            addTotal += Utils.randomRange(rmin, rmax);
                        }
                    }
                    addTotal += 3 - (addTotal % 3);
                    it.rTime = now;
                    it.cube += addTotal;
                }
            }
        }
        if (changed) {
            this._goldTourRank.rankItems.sort((a: any, b: any) => b.cube - a.cube);
            this._goldTourRank.rankItems.forEach((item: any, idx: number) => {
                item.rank = idx + 1;
            });
            this._serializeGoldTourRank();
            director.emit(GlobalEvent.refreshGoldTourRankAiDataV2);
        }
    }

    private _serializeGoldTourRank() {
        const out: any = {
            period: this._goldTourRank.period,
            rankItems: []
        };
        each(this._goldTourRank.rankItems, (item: any, idx: number) => {
            const rank = item.rank;
            const rTime = item.rTime;
            const id = item.id;
            const head = item.head;
            const cube = item.cube;
            out.rankItems[idx] = [rank, rTime, id, head, cube];
        });
        const s = JSON.stringify(out);
        sys.localStorage.setItem(GameConfig.gameName + '-' + GOLD_TOUR_V2_RANK_KEY, s);
    }

    private _deserializedGoldTourRank() {
        const self = this;
        let parsed: any = {};
        const raw = sys.localStorage.getItem(GameConfig.gameName + '-' + GOLD_TOUR_V2_RANK_KEY);
        if (!isEmpty(raw)) parsed = JSON.parse(raw);
        const data = parsed;
        if (!isEmpty(data)) {
            this._goldTourRank.period = data.period;
            this._goldTourRank.rankItems = [];
            each(data.rankItems, (arr: any, idx: number) => {
                const rank = arr[0];
                const rTime = arr[1];
                const id = arr[2];
                const head = arr[3];
                const cube = arr[4];
                self._goldTourRank.rankItems[idx] = {
                    rank,
                    rTime,
                    id,
                    head,
                    cube
                };
            });
        }
    }

    getGoldTourRankIndexData() {
        const items = this._goldTourRank?.rankItems ?? [];
        if (items.length <= 0) return null;
        const out: any[] = [];
        items.forEach((it: any, idx: number) => {
            out[idx] = {
                rank: it.rank,
                rTime: it.rTime,
                id: it.id,
                head: it.head,
                cube: it.cube
            };
        });
        const selfData: any = {
            head: MgrUser.Instance.userData.userHead,
            cube: this._data ? this._data.goldCube : 0,
            me: true
        };
        let pos = out.length;
        for (let i = out.length - 1; i >= 0; i--) {
            const cur = out[i];
            if (selfData.cube < cur.cube) break;
            pos--;
            cur.rank += 1;
        }
        selfData.rank = pos + 1;
        out.splice(pos, 0, selfData);
        const showCnt = GoldRankV2Cfg.Instance.getRankPlayerShowCnt();
        return {
            rankData: out.slice(0, showCnt),
            selfData
        };
    }

    private _checkInTourOpen() {
        return this._data ? this._data.tourStatus == TournamentStatus.Open : false;
    }

    checkGoldTourOpen() {
        return MgrGame.Instance.gameData.maxLv >= GameConst.GOLDTOURNAMENT_V2_OPEN_LEVEL && this._checkInTourOpen();
    }

    addGoldCubeCnt(cnt: number) {
        if (this.checkGoldTourOpen()) {
            if (this._data) {
                this._data.goldCube += cnt;
                if (MgrTask.Instance.data.goldTourIdx != this._data.tourPeriod) {
                    MgrTask.Instance.data.goldTourIdx = this._data.tourPeriod;
                    MgrTask.Instance.data.addTaskData(TASK_TYPE.JOIN_GOLDTOUR, 1);
                }
                const idxData = this.getGoldTourRankIndexData();
                if (idxData) {
                    const goldPoints = this._data.goldCube;
                    const rank = idxData.selfData.rank;
                    AnalyticsManager.getInstance().reportGoldProgress({
                        Gold_Point: goldPoints,
                        Gold_Rank: rank,
                        Gold_Type: 2
                    });
                }
            }
        }
    }

    checkNeedGuide() {
        return this.checkGoldTourOpen() && !(this._data ? this._data.tip : true);
    }

    guide(cb?: Function) {
        const self = this;
        const btn = AppGame.topUI.goldTourBtnV2;
        btn.getComponent(GoldTourV2Btn).refreshTimeLabel();
        let clicked = false;
        const progress = MgrUser.Instance.userData.getItem(ITEM.ChallengeStar);
        AnalyticsManager.getInstance().reportGoldOpen({
            Gold_Type: 2,
            Gold_Reward_Progress: progress
        });
        MgrWeakGuide.Instance.openWeakGuide({
            node: btn.node,
            click: () => {
                clicked = true;
                const view = MgrUi.Instance.getView(UIPrefabs.GoldTournamentV2View.url);
                if (view) {
                    view.once(VIEW_ANIM_EVENT.Remove, cb);
                } else if (MgrUi.Instance.hasViewQueus(UIPrefabs.GoldTournamentV2View.url)) {
                    MgrUi.Instance.addViewAsyncQueueCallback(UIPrefabs.GoldTournamentV2View, (v: any) => {
                        v.once(VIEW_ANIM_EVENT.Remove, cb);
                    });
                } else {
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentV2View, {
                        root: MgrUi.root(1),
                        callback: (v: any) => {
                            v.once(VIEW_ANIM_EVENT.Remove, cb);
                        }
                    });
                }
            },
            close: () => {
                if (self._data) self._data.tip = true;
                if (!clicked) {
                    if (cb) cb();
                }
            },
            pos: GuidePos.Right,
            lang: 'gold_gold_medal'
        });
    }

    tryAutoReward(cb?: Function) {
        if (MgrGoldTournamentV2.Instance.data.tourStatus == TournamentStatus.WaitReward) {
            AppGame.topUI.goldCubeBtn.hideGoldCube();
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentV2RewardView, {
                root: MgrUi.root(2),
                callback: (v: any) => {
                    v.once(VIEW_ANIM_EVENT.Remove, () => {
                        if (cb) cb();
                    });
                }
            });
            return;
        }
        if (cb) cb();
    }

    onEnter() {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.GoldTournamentV2View, {
            root: MgrUi.root(1)
        });
    }

    getUnlockInfo() {
        return Language.Instance.getLangByID('event_level_unlock').replace('{0}', GameConst.GOLDTOURNAMENT_V2_OPEN_LEVEL.toString());
    }

    getOpenTimeInfo() {
        return Language.Instance.getLangByID('GoldTournamentV2OpenTime');
    }

    getActiveStatus() {
        if (MgrGame.Instance.gameData.maxLv < GameConst.GOLDTOURNAMENT_V2_OPEN_LEVEL) {
            return ACTIVE_STATUS.LOCK;
        }
        const now = Tools.GetNowTime();
        if (now < (this._data ? this._data.recentStartTime : 0) || now > (this._data ? this._data.recentEndTime : Infinity)) {
            return ACTIVE_STATUS.GAP;
        }
        return ACTIVE_STATUS.ACTIVE;
    }

    getRemainTime() {
        return this._goldTourFinishTimeStampDiff;
    }

    hasGuide() {
        return this._data ? this._data.tip : false;
    }

    get data() {
        return this._data;
    }

    get goldTourRank() {
        return this._goldTourRank;
    }

    get goldTourFinishTimeStampDiff() {
        return this._goldTourFinishTimeStampDiff;
    }

    static get Instance(): MgrGoldTournamentV2 {
        // MgrBase likely holds the singleton instance; preserve access pattern
        return (MgrGoldTournamentV2 as any)['_instance'];
    }
}
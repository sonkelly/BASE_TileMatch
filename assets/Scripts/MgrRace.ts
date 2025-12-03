import { _decorator, cclegacy, macro, director } from 'cc';
import { TASK_TYPE, ACTIVE_STATUS } from './Const';
import { GlobalEvent } from './Events';
import { GameConst } from './GameConst';
import { UIPrefabs } from './Prefabs';
import {RaceAiCfg} from './RaceAiCfg';
import {RaceRewardCfg} from './RaceRewardCfg';
import {Language} from './Language';
import {MgrBase} from './MgrBase';
import {Tools} from './Tools';
import { RaceData } from './RaceData';
import {AppGame} from './AppGame';
import { GuidePos } from './WeakGuide';
import {Utils} from './Utils';
import {AnalyticsManager} from './AnalyticsManager';
import {MgrGame} from './MgrGame';
import {MgrTask} from './MgrTask';
import {MgrUi} from './MgrUi';
import {MgrUser} from './MgrUser';
import {MgrWeakGuide} from './MgrWeakGuide';
import { RaceMatchView } from './RaceMatchView';

export enum RaceState {
    None = 0,
    Open = 1,
    TurnRace = 2,
    TurnOver = 3,
}

export const enum RaceFailedType {
    None = 0,
    Rank = 1,
    Boom = 2,
}

export const RaceMaxProgress = 10;
export const TurnMaxPlayer = 10;
export const RaceRewardIdx = 3;
const MUST_LEVEL_INDEXES = [4, 8];

const { ccclass } = _decorator;

@ccclass('MgrRace')
export class MgrRace extends MgrBase {
    private static _instance: MgrRace | null = null;

    private _data: RaceData | null = null;
    private _raceState: RaceState = RaceState.None;
    private _aiTimeRun: number = 0;
    private _canRunAi: boolean = true;
    private _raceLevel: number[] = [];
    private _autoPopMatch: boolean = false;

    onLoad() {
        this._data = new RaceData('RaceData');
    }

    load() {
        this._data && this._data.load();
        this._initRaceState();
    }

    initLoadData() {
        this.schedule(this._fixedUpdate, 1, macro.REPEAT_FOREVER, Math.random());
    }

    private _initRaceState() {
        if (MgrGame.Instance.gameData.maxLv < GameConst.RACE_OPEN_LEVEL) return;

        this._data && this._data.checkPeriodTime();

        if (!this._data) return;

        if (this._data.period && this._data.firstPeriod && this._data.period < this._data.firstPeriod) {
            // do nothing if before first period
        }

        if (this._data.period) {
            if (this._data.inPeriod != this._data.period) {
                if (!this._checkTime()) {
                    if (this._data.inPeriod !== 0 && !this._data.timeFailPeriod.includes(this._data.inPeriod)) {
                        this._data.addTimeFailPeriod(this._data.inPeriod);
                        const rid = this._data.raceAiCfgId;
                        const matchNum = this._data.raceDayCount;
                        const rank = this.getSelfRankIdx();
                        const progress = this._data.realStep;
                        AnalyticsManager.getInstance().reportRaceFail({
                            Race_Id: rid,
                            Race_Match_Num: matchNum,
                            Race_Rank: rank,
                            Race_Progress: progress,
                            Race_Fail_Type: 3,
                        });
                    }
                    return;
                }
                this._initRace();
            } else {
                if (!this._checkTime()) {
                    if (this._data.inPeriod !== 0 && !this._data.timeFailPeriod.includes(this._data.inPeriod)) {
                        this._data.addTimeFailPeriod(this._data.inPeriod);
                        const rid = this._data.raceAiCfgId;
                        const matchNum = this._data.raceDayCount;
                        const rank = this.getSelfRankIdx();
                        const progress = this._data.realStep;
                        AnalyticsManager.getInstance().reportRaceFail({
                            Race_Id: rid,
                            Race_Match_Num: matchNum,
                            Race_Rank: rank,
                            Race_Progress: progress,
                            Race_Fail_Type: 3,
                        });
                    }
                    return;
                }

                this._raceState = RaceState.Open;
                director.emit(GlobalEvent.changeRaceState);

                if (this._data.raceDaySettle >= this._data.raceDayCount) {
                    if (!Utils.isSameDay(this._data.raceDayTime, Tools.GetNowTime())) {
                        this._data.raceDayTime = Tools.GetNowTime();
                        this._data.raceDayCount = 0;
                        this._data.raceDaySettle = 0;
                    }
                    return;
                }

                this._initRaceLevel();
                this._raceState = RaceState.TurnRace;
                director.emit(GlobalEvent.refreshIconProgress);
                director.emit(GlobalEvent.changeRaceState);
                this._runAIInterval();
                this._limitedShowStep();
            }
        } else {
            // no period
            if (this._raceState !== RaceState.None) {
                this._raceState = RaceState.None;
                director.emit(GlobalEvent.changeRaceState);
            }
        }
    }

    private _checkTime(): boolean {
        const now = Tools.GetNowTime();
        if (!this._data) return false;
        return !(now < this._data.startTime) && !(now >= this._data.endTime);
    }

    private _initRace() {
        if (!this._data) return;
        this._data.inPeriod = this._data.period;
        this._data.raceDayTime = Tools.GetNowTime();
        this._data.raceDayCount = 0;
        this._data.raceDaySettle = 0;
        this._data.tip = false;
        this._data.match = false;
        this._raceState = RaceState.Open;
        director.emit(GlobalEvent.changeRaceState);
    }

    private _initRaceLevel() {
        if (!this._data) return;
        const start = this._data.startLevel;
        this._raceLevel.length = 0;
        for (let i = 0; i < RaceMaxProgress; i++) {
            this._raceLevel.push(start + i);
        }
    }

    private _fixedUpdate(dt: number) {
        if (MgrGame.Instance.gameData.maxLv < GameConst.RACE_OPEN_LEVEL) return;
        this._checkRaceState();
        this._checkAi(dt);
    }

    private _checkRaceState() {
        this._data && this._data.checkPeriodTime();

        if (!this._data) return;

        if (this._data.period) {
            if (this._data.period && this._data.firstPeriod && this._data.period < this._data.firstPeriod) {
                if (this._raceState !== RaceState.None) {
                    this._raceState = RaceState.None;
                    director.emit(GlobalEvent.changeRaceState);
                }
            } else {
                if (this._data.inPeriod != this._data.period) {
                    if (!this._checkTime()) {
                        if (this._raceState !== RaceState.None) {
                            this._raceState = RaceState.None;
                            director.emit(GlobalEvent.changeRaceState);
                            if (this._data.inPeriod !== 0 && !this._data.timeFailPeriod.includes(this._data.inPeriod)) {
                                this._data.addTimeFailPeriod(this._data.inPeriod);
                                const rid = this._data.raceAiCfgId;
                                const matchNum = this._data.raceDayCount;
                                const rank = this.getSelfRankIdx();
                                const progress = this._data.realStep;
                                AnalyticsManager.getInstance().reportRaceFail({
                                    Race_Id: rid,
                                    Race_Match_Num: matchNum,
                                    Race_Rank: rank,
                                    Race_Progress: progress,
                                    Race_Fail_Type: 3,
                                });
                            }
                        }
                        return;
                    }
                    this._initRace();
                } else {
                    if (!this._checkTime()) {
                        if (this._raceState !== RaceState.None) {
                            this._raceState = RaceState.None;
                            director.emit(GlobalEvent.changeRaceState);
                            if (this._data.inPeriod !== 0 && !this._data.timeFailPeriod.includes(this._data.inPeriod)) {
                                this._data.addTimeFailPeriod(this._data.inPeriod);
                                const rid = this._data.raceAiCfgId;
                                const matchNum = this._data.raceDayCount;
                                const rank = this.getSelfRankIdx();
                                const progress = this._data.realStep;
                                AnalyticsManager.getInstance().reportRaceFail({
                                    Race_Id: rid,
                                    Race_Match_Num: matchNum,
                                    Race_Rank: rank,
                                    Race_Progress: progress,
                                    Race_Fail_Type: 3,
                                });
                            }
                        }
                        return;
                    }

                    if (this._raceState === RaceState.None) {
                        this._raceState = RaceState.Open;
                        director.emit(GlobalEvent.changeRaceState);
                    } else {
                        director.emit(GlobalEvent.refreshRaceTime);
                    }

                    if (this._data.raceDaySettle >= this._data.raceDayCount) {
                        if (!Utils.isSameDay(this._data.raceDayTime, Tools.GetNowTime())) {
                            this._data.raceDayTime = Tools.GetNowTime();
                            this._data.raceDayCount = 0;
                            this._data.raceDaySettle = 0;
                        }
                        return;
                    }
                }
            }
        } else {
            if (this._raceState !== RaceState.None) {
                this._raceState = RaceState.None;
                director.emit(GlobalEvent.changeRaceState);
            }
        }
    }

    private _checkAi(dt: number) {
        if (this._raceState === RaceState.TurnRace && this._canRunAi) {
            this._aiTimeRun += dt;
            if (this._aiTimeRun >= 10) {
                this._aiTimeRun = 0;
                this._runAIInterval();
            }
        }
    }

    private _runAIInterval() {
        if (!this._data) return;
        if (this._data.raceAis.length <= 0) {
            console.warn('runAIInterval No ai data!');
            return;
        }

        // count how many AIs have reached max
        let reachCnt = 0;
        for (const ai of this._data.raceAis) {
            if (ai.realStep >= RaceMaxProgress) reachCnt++;
        }

        if (reachCnt >= TurnMaxPlayer) return;

        let changed = false;
        const now = Tools.GetNowTime();

        for (let i = 0; i < this._data.raceAis.length; i++) {
            const ai = this._data.raceAis[i];
            const aiInfo = RaceAiCfg.Instance.getAiRankAddInfo(this._data.raceAiCfgId, ai.rank);
            const minutesPassed = (now - ai.refreshTime) / 1000 / 60;
            let times = Math.floor(minutesPassed / aiInfo.aiTimeMax);
            times = Math.min(times, aiInfo.aiNumMax);
            if (times > 0) {
                let maxRank = aiInfo.aiRankMax === -1 ? RaceMaxProgress : aiInfo.aiRankMax;
                maxRank = Math.min(maxRank, RaceMaxProgress);
                for (let t = 0; t < times; t++) {
                    if (Math.floor(100 * Math.random()) < aiInfo.aiProbability) {
                        changed = true;
                        if (ai.realStep < maxRank) {
                            ai.realStep += 1;
                            ai.refreshTime = now;
                        }
                    }
                }
            }
        }

        if (changed) {
            this._data.raceAis.sort((a: any, b: any) => {
                if (a.realStep !== b.realStep) return b.realStep - a.realStep;
                if (a.refreshTime !== b.refreshTime) return a.refreshTime - b.refreshTime;
                return -1;
            });
            this._data.raceAis.forEach((it: any, idx: number) => {
                it.rank = idx + 1;
            });
            this._data.doDrity();
        }
    }

    private _limitedShowStep() {
        if (!this._data) return;
        this._data.raceAis.forEach((ai: any) => {
            if (ai.showStep < ai.realStep - 1) ai.showStep = ai.realStep - 1;
        });
        if (this._data.showStep < this._data.realStep - 1) {
            this._data.showStep = this._data.realStep - 1;
        }
        this._data.doDrity();
    }

    getReachPlayer() {
        const res: any[] = [];
        const rankData = this.getRankData();
        for (let i = 0; i < rankData.length; i++) {
            const d = rankData[i];
            if (d.realStep >= RaceMaxProgress) res.push(d);
        }
        return res;
    }

    getRankData() {
        const arr: any[] = [];
        if (this._data) {
            for (const ai of this._data.raceAis) {
                arr.push({
                    id: ai.id,
                    realStep: ai.realStep,
                    showStep: ai.showStep,
                    refreshTime: ai.refreshTime,
                    rank: ai.rank,
                });
            }

            const meHead = MgrUser.Instance.userData.userHead;
            const realStep = this._data.realStep;
            const showStep = this._data.showStep;
            const refreshTime = this._data.refreshTime;

            arr.push({
                id: meHead,
                realStep: realStep,
                showStep: showStep,
                refreshTime: refreshTime,
                rank: -1,
                me: true,
            });

            arr.sort((a, b) => {
                if (a.realStep !== b.realStep) return b.realStep - a.realStep;
                if (a.refreshTime !== b.refreshTime) return a.refreshTime - b.refreshTime;
                return -1;
            });

            arr.forEach((it, idx) => {
                it.rank = idx + 1;
            });
        }

        return arr;
    }

    getSelfRankIdx() {
        const arr = this.getRankData();
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].me) return arr[i].rank;
        }
        return -1;
    }

    checkRaceOpen() {
        return this._raceState !== RaceState.None;
    }

    checkNeedGuide() {
        return this.checkRaceOpen() && !!this._data && !this._data.tip;
    }

    getOpenView() {
        if (MgrUi.Instance.raceState === RaceState.Open) return UIPrefabs.RaceMatchView;
        if (MgrUi.Instance.raceState === RaceState.TurnRace || MgrUi.Instance.raceState === RaceState.TurnOver) return UIPrefabs.RaceView;
        return null;
    }

    guide(closeCallback?: Function) {
        if (!this._data) return;
        this._data.tip = true;
        const btn = AppGame.topUI.raceBtn;
        let clicked = false;
        const viewPrefab = UIPrefabs.RaceMatchView;
        const isFirst = this._data.firstPeriod == this._data.inPeriod ? 1 : 0;

        AnalyticsManager.getInstance().reportRaceOpen({ Race_Is_First: isFirst });

        MgrWeakGuide.Instance.openWeakGuide({
            node: btn.node,
            click: () => {
                if (viewPrefab) {
                    clicked = true;
                    const view = MgrUi.Instance.getView(viewPrefab.url);
                    if (view) {
                        view.getComponent(RaceMatchView).setCloseCall(() => {
                            closeCallback && closeCallback();
                        });
                    } else if (MgrUi.Instance.hasViewQueus(viewPrefab.url)) {
                        MgrUi.Instance.addViewAsyncQueueCallback(viewPrefab, (v: any) => {
                            v.getComponent(RaceMatchView).setCloseCall(() => {
                                closeCallback && closeCallback();
                            });
                        });
                    } else {
                        MgrUi.Instance.addViewAsyncQueue(viewPrefab, {
                            root: MgrUi.root(true),
                            data: {
                                closeCall: () => {
                                    closeCallback && closeCallback();
                                },
                            },
                        });
                    }
                }
            },
            close: () => {
                this._data && (this._data.tip = true);
                if (!clicked) {
                    closeCallback && closeCallback();
                }
            },
            pos: GuidePos.Right,
            lang: 'race_join_tip',
        });
    }

    checkDayRaceCountFull() {
        return !!this._data && this._data.raceDaySettle >= GameConst.RACE_DAILY_CNT;
    }

    getRemainTime() {
        return this._data ? this._data.endTime - Tools.GetNowTime() : 0;
    }

    matchNewTurn() {
        if (!this._data) return;
        this._data.realStep = 0;
        this._data.showStep = 0;
        this._data.startLevel = MgrGame.Instance.gameData.curLv;
        this.clearRaceFailedMustLevel();
        this._initRaceLevel();
        this._data.initAiData();
        this._data.raceDayCount++;
        this._raceState = RaceState.TurnRace;
        director.emit(GlobalEvent.refreshIconProgress);

        if (MgrTask.Instance.data.raceInPeriod != this._data.inPeriod) {
            MgrTask.Instance.data.raceInPeriod = this._data.inPeriod;
            MgrTask.Instance.data.addTaskData(TASK_TYPE.JOIN_RACE, 1);
        }

        const rid = this._data.raceAiCfgId;
        const matchNum = this._data.raceDayCount;
        AnalyticsManager.getInstance().reportRaceMatch({
            Race_Id: rid,
            Race_Match_Num: matchNum,
        });
    }

    setAllShowStep() {
        if (!this._data) return;
        this._data.showStep = this._data.realStep;
        this._data.raceAis.forEach((ai: any) => {
            ai.showStep = ai.realStep;
        });
        this._data.doDrity();
    }

    isRaceMust(level: number) {
        for (let i = 0; i < MUST_LEVEL_INDEXES.length; i++) {
            const idx = MUST_LEVEL_INDEXES[i];
            if (level === this._raceLevel[idx]) return true;
        }
        return false;
    }

    getRaceMustIdx(level: number) {
        for (let i = 0; i < MUST_LEVEL_INDEXES.length; i++) {
            const idx = MUST_LEVEL_INDEXES[i];
            if (level === this._raceLevel[idx]) return i;
        }
        return -1;
    }

    addSelfProgress(level: number) {
        if (this._raceState === RaceState.TurnRace && this._raceLevel.includes(level) && this._data) {
            this._data.realStep++;
            this._data.realStep = Math.min(this._data.realStep, RaceMaxProgress);
            this._data.refreshTime = Tools.GetNowTime();

            const rid = this._data.raceAiCfgId;
            const matchNum = this._data.raceDayCount;
            const isMust = this.isRaceMust(level) ? 1 : 0;
            const rank = this.getSelfRankIdx();
            const progress = this._data.realStep;

            AnalyticsManager.getInstance().reportRaceProgress({
                Race_Id: rid,
                Race_Match_Num: matchNum,
                Race_Is_Must: isMust,
                Race_Rank: rank,
                Race_Progress: progress,
            });

            this._checkCanPushReward();
        }
    }

    private _checkCanPushReward() {
        if (!this._data) return;
        if (this._data.realStep < RaceMaxProgress) return;

        const reach = this.getReachPlayer();
        let myRank = TurnMaxPlayer;
        for (const r of reach) {
            if (r.me) {
                myRank = r.rank;
                break;
            }
        }

        if (myRank > RaceRewardIdx) return;

        const rewardStr = RaceRewardCfg.Instance.get(myRank).reward;
        const parts = rewardStr.split(',');
        const items: { id: number; count: number }[] = [];
        for (const p of parts) {
            const seg = p.split('|');
            const id = Number(seg[0]);
            const cnt = Number(seg[1]);
            items.push({ id, count: cnt });
        }

        for (const it of items) {
            MgrUser.Instance.userData.addItem(it.id, it.count, { type: 'RaceReward' });
        }

        AnalyticsManager.getInstance().reportRaceRewardGet({
            Race_Rank: myRank,
            Reward: rewardStr,
        });

        MgrTask.Instance.data.addTaskData(TASK_TYPE.RECEIVE_RACE_REWARD, 1);
    }

    checkRaceFailedMustLevel(level: number) {
        if (this._raceState === RaceState.TurnRace) {
            if (this.isRaceMust(level) && this._data) {
                this._data.mustFailLevel = level;
            }
        }
    }

    clearRaceFailedMustLevel() {
        if (this._data) this._data.mustFailLevel = 0;
    }

    checkCanEndRace() {
        if (this._raceState === RaceState.TurnRace && this._data) {
            const mustIs = this.isRaceMust(this._data.mustFailLevel);
            const mustAtCurrent = this._data.mustFailLevel === MgrGame.Instance.gameData.curLv;
            if (mustIs && mustAtCurrent) {
                this._raceState = RaceState.TurnOver;
                director.emit(GlobalEvent.refreshIconProgress);
                const rid = this._data.raceAiCfgId;
                const matchNum = this._data.raceDayCount;
                const rank = this.getSelfRankIdx();
                const progress = this._data.realStep;
                AnalyticsManager.getInstance().reportRaceFail({
                    Race_Id: rid,
                    Race_Match_Num: matchNum,
                    Race_Rank: rank,
                    Race_Progress: progress,
                    Race_Fail_Type: 1,
                });
            } else {
                const reach = this.getReachPlayer();
                for (const r of reach) {
                    if (r.me && r.rank <= TurnMaxPlayer) {
                        this._raceState = RaceState.TurnOver;
                        director.emit(GlobalEvent.refreshIconProgress);
                        return;
                    }
                }

                if (reach.length >= TurnMaxPlayer) {
                    this._raceState = RaceState.TurnOver;
                    director.emit(GlobalEvent.refreshIconProgress);
                    const rid = this._data.raceAiCfgId;
                    const matchNum = this._data.raceDayCount;
                    const rank = this.getSelfRankIdx();
                    const progress = this._data.realStep;
                    AnalyticsManager.getInstance().reportRaceFail({
                        Race_Id: rid,
                        Race_Match_Num: matchNum,
                        Race_Rank: rank,
                        Race_Progress: progress,
                        Race_Fail_Type: 2,
                    });
                } else {
                    // not end yet
                }
            }
        }
    }

    settlementOneTurn() {
        if (!this._data) return;
        this._data.raceDaySettle++;
        if (!Utils.isSameDay(this._data.raceDayTime, Tools.GetNowTime())) {
            this._data.raceDayTime = Tools.GetNowTime();
            this._data.raceDayCount = 0;
            this._data.raceDaySettle = 0;
        }
        this._data.realStep = 0;
        this._data.showStep = 0;
        this._raceLevel.length = 0;
        this.clearRaceFailedMustLevel();

        if (AppGame && AppGame.mainUI && AppGame.mainUI.refreshRaceMustNode) {
            AppGame.mainUI.refreshRaceMustNode();
        }

        this._raceState = RaceState.None;
        this._checkRaceState();

        director.emit(GlobalEvent.SettementRaceTurn);

        if (!this.checkDayRaceCountFull()) {
            this._autoPopMatch = true;
        }
    }

    checkAutoPopMatchView() {
        if (this._raceState === RaceState.Open) {
            if (AppGame.inGame) return;
            if (this._autoPopMatch) {
                MgrUi.Instance.openViewAsync(UIPrefabs.RaceMatchView);
                this._autoPopMatch = false;
            }
        }
    }

    onEnter() {
        const open = MgrUi.Instance.getOpenView();
        open && MgrUi.Instance.addViewAsyncQueue(open);
    }

    getUnlockInfo() {
        return Language.Instance.getLangByID('event_level_unlock').replace('{0}', GameConst.RACE_OPEN_LEVEL.toString());
    }

    getOpenTimeInfo() {
        return Language.Instance.getLangByID('RaceOpenTime');
    }

    getActiveStatus() {
        if (MgrGame.Instance.gameData.maxLv < GameConst.RACE_OPEN_LEVEL) return ACTIVE_STATUS.LOCK;
        const now = Tools.GetNowTime();
        if (now < (this._data ? this._data.startTime : 0) || now > (this._data ? this._data.endTime : 0)) return ACTIVE_STATUS.GAP;
        return ACTIVE_STATUS.ACTIVE;
    }

    hasGuide() {
        return !!this._data && !!this._data.tip;
    }

    // getters / setters
    get data() {
        return this._data;
    }

    get raceState() {
        return this._raceState;
    }

    set canRunAi(v: boolean) {
        this._canRunAi = v;
    }

    get raceLevel() {
        return this._raceLevel;
    }

    get autoPopMatch() {
        return this._autoPopMatch;
    }
    set autoPopMatch(v: boolean) {
        this._autoPopMatch = v;
    }

    static get Instance() {
        return MgrRace._instance;
    }

    // optionally provide a way to set instance (MgrBase or app bootstrap usually does this)
    static _setInstance(inst: MgrRace) {
        MgrRace._instance = inst;
    }
}
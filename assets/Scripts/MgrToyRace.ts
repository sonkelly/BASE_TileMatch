import { _decorator, director } from 'cc';
import { DAY_MILLISECOND, SECOND_MILLISECOND, GameMode, ACTIVE_STATUS } from './Const';
import { GlobalEvent } from './Events';
import { GameConst } from './GameConst';
import { UIPrefabs } from './Prefabs';
import {AvatarCfg} from './AvatarCfg';
import {RankNameCfg} from './RankNameCfg';
import {ToyRaceAiCfg} from './ToyRaceAiCfg';
import {ToyRaceCfg} from './ToyRaceCfg';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {Language} from './Language';
import {MgrBase} from './MgrBase';
import {Tools} from './Tools';
import { ToyRaceData } from './ToyRaceData';
import {AppGame} from './AppGame';
import { GuidePos } from './WeakGuide';
import {AnalyticsManager} from './AnalyticsManager';
import { MgrGame } from './MgrGame';
import {MgrUi} from './MgrUi';
import { MgrUser } from './MgrUser';
import {MgrWeakGuide} from './MgrWeakGuide';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {each, set} from 'lodash-es';

const { ccclass } = _decorator;

export enum ToyRaceState {
    None = 0,
    Idle = 1,
    Matching = 2,
    InRace = 3,
    Result = 4,
    Finish = 5,
    Gap = 6
}

export const RaceRewardIdx = 3;
const SPACE_MS = GameConst.ToyRaceSpaceDays * DAY_MILLISECOND;

@ccclass('MgrToyRace')
export class MgrToyRace extends MgrBase {
    private static _instance: MgrToyRace | null = null;
    static get Instance() {
        return MgrToyRace._instance;
    }

    private _toyRaceData: ToyRaceData | null = null;
    private _runningTime = 0;
    private _matchTime = 0;
    private _players: number[] = [];

    get toyRaceData() {
        return this._toyRaceData!;
    }

    onLoad() {
        this._toyRaceData = new ToyRaceData('ck-toy-race-data');
        MgrToyRace._instance = this;
    }

    initLoadData() {
        this._toyRaceData!.load();
        for (let i = 0; i < GameConst.ToyRaceMatchCount; i++) {
            this._players.push(i);
        }
        this.initGameState();
    }

    load() {
        director.on(GlobalEvent.GameVictory, this.onGameSuccess, this);
    }

    hasGuide() {
        return !!this._toyRaceData!.tip;
    }

    initGameState() {
        if (this.toyRaceData.status != ToyRaceState.None) {
            const now = Tools.GetNowTime();
            const diffCount = Math.floor((now - this.toyRaceData.lastTime) / SPACE_MS);
            if (diffCount > 0) {
                this.toyRaceData.lastTime += diffCount * SPACE_MS;
                const first = this.toyRaceData.players[0];
                if (first) {
                    const rank = first.rank;
                    const progress = first.levels;
                    AnalyticsManager.getInstance().reportToyRaceFail({
                        ToyRace_Id: this._toyRaceData!.aiCfgId,
                        ToyRace_Match_Num: this._toyRaceData!.matchCount,
                        ToyRace_Rank: rank,
                        ToyRace_Progress: progress,
                        ToyRace_Fail_Type: rank > RaceRewardIdx ? 1 : 2
                    });
                }
                this.toyRaceData.players.length = 0;
                this.toyRaceData.status = ToyRaceState.None;
                this.toyRaceData.matchCount = 0;
                this.toyRaceData.addOpenCount();
            }

            if (this.toyRaceData.status !== ToyRaceState.Gap) {
                this.checkinGap();
            }
            if (this.toyRaceData.status === ToyRaceState.Gap && this.checkoutGap()) {
                this.toyRaceData.tip = true;
            }

            switch (this.toyRaceData.status) {
                case ToyRaceState.Matching:
                    this.matchAll();
                    break;
                case ToyRaceState.InRace:
                    this.updateInRace();
                    break;
                case ToyRaceState.None:
                    this.toyRaceData.tip = false;
                    this.tryUnlock();
                    break;
            }
        } else {
            this.tryUnlock();
        }
    }

    update(dt: number) {
        this._runningTime += dt;
        if (this._runningTime >= 1) {
            this._runningTime = this._runningTime % 1;
            switch (this.toyRaceData.status) {
                case ToyRaceState.Matching:
                    this.updateMatch();
                    break;
                case ToyRaceState.InRace:
                    this.updateInRace();
                    break;
            }
            if (this.toyRaceData.status !== ToyRaceState.Gap && this.toyRaceData.status !== ToyRaceState.None) {
                this.checkinGap();
            }
        }
    }

    updateMatch() {
        this._matchTime -= 1;
        if (this._matchTime <= 0) {
            this.rdmMatchAI();
            this.rdmMatchTime();
            director.emit(GlobalEvent.ToyRaceMatchPlayer);
            if (this.toyRaceData.players.length === GameConst.ToyRaceMatchCount) {
                this.matchComplete();
            }
        }
    }

    checkinGap() {
        const now = Tools.GetNowTime();
        const gapTime = this.toyRaceData.lastTime + GameConst.ToyRaceOpenDays * DAY_MILLISECOND;
        if (now > gapTime) {
            const first = this.toyRaceData.players[0];
            if (first) {
                const rank = first.rank;
                const progress = first.levels;
                AnalyticsManager.getInstance().reportToyRaceFail({
                    ToyRace_Id: this._toyRaceData!.aiCfgId,
                    ToyRace_Match_Num: this._toyRaceData!.matchCount,
                    ToyRace_Rank: rank,
                    ToyRace_Progress: progress,
                    ToyRace_Fail_Type: rank > RaceRewardIdx ? 1 : 2
                });
            }
            this.toyRaceData.status = ToyRaceState.Gap;
            this.toyRaceData.lastTime = gapTime;
            this.toyRaceData.players.length = 0;
            director.emit(GlobalEvent.ToyRaceEnterGap);
        }
    }

    checkoutGap(): boolean {
        const nowDate = Tools.GetNowDate();
        const day = nowDate.getDay();
        const start = GameConst.TOY_RACE_OPEN_TIME[0];
        const end = GameConst.TOY_RACE_OPEN_TIME[2];
        if (day >= start && day <= end) {
            this.toyRaceData.status = ToyRaceState.Idle;
            const dayOffset = day - start;
            const baseTime = nowDate.getTime() - dayOffset * DAY_MILLISECOND;
            this.toyRaceData.lastTime = moment(baseTime).startOf('days').valueOf();
            this.toyRaceData.addOpenCount();
            this.toyRaceData.matchCount = 0;
            director.emit(GlobalEvent.ToyRaceActive);
            return true;
        }
        return false;
    }

    updateInRace() {
        this.refreshAIs();
    }

    addLevels(idx: number, add: number) {
        const p = this.toyRaceData.players[idx];
        if (p) {
            p.levels = Math.min(p.levels + add, GameConst.ToyRaceMaxProgress);
            p.rTime = Tools.GetNowTime();
            this.refreshRanks();
            director.emit(GlobalEvent.ToyRaceRefreshAIProgress);
            this.checkSettle();
        }
    }

    refreshAiPlayer(now: number, aiId: number, player: any) {
        const aiInfo = ToyRaceAiCfg.Instance.getAiInfo(aiId, player.rank);
        const elapsed = (now - player.rTime) / SECOND_MILLISECOND;
        let times = Math.floor(elapsed / aiInfo.aiTimeMax);
        times = Math.min(times, aiInfo.aiNumMax);
        if (times <= 0) return false;
        let changed = false;
        let rankMax = aiInfo.aiRankMax === -1 ? GameConst.ToyRaceMaxProgress : aiInfo.aiRankMax;
        rankMax = Math.min(rankMax, GameConst.ToyRaceMaxProgress);
        for (let i = 0; i < times; i++) {
            if (Math.floor(100 * Math.random()) < aiInfo.aiProbability && player.levels < rankMax) {
                changed = true;
                player.levels += 1;
                player.rTime = now;
            }
        }
        return changed;
    }

    refreshAIs() {
        const now = Tools.GetNowTime();
        const aiCfgId = this.toyRaceData.aiCfgId;
        let finishedCount = 0;
        const changedIdxs: number[] = [];
        for (let i = 1; i < this.toyRaceData.players.length; i++) {
            const p = this.toyRaceData.players[i];
            if (this.refreshAiPlayer(now, aiCfgId, p)) {
                changedIdxs.push(i);
            }
            if (p.levels == GameConst.ToyRaceMaxProgress) finishedCount++;
        }
        if (changedIdxs.length > 0) {
            this.refreshRanks();
            this.toyRaceData.saveData();
            director.emit(GlobalEvent.ToyRaceRefreshAIProgress, changedIdxs);
        }
        if (finishedCount >= RaceRewardIdx) {
            this.raceSettle();
        }
    }

    refreshRanks() {
        const self = this;
        this._players.sort((a, b) => {
            const pa = self.toyRaceData.players[a];
            const pb = self.toyRaceData.players[b];
            if (pa.levels !== pb.levels) {
                return pb.levels - pa.levels;
            } else if (pa.rTime !== pb.rTime) {
                return pa.rTime - pb.rTime;
            } else {
                return -1;
            }
        });
        for (let i = 0; i < this._players.length; i++) {
            const idx = this._players[i];
            this.toyRaceData.players[idx].rank = i + 1;
        }
        this.toyRaceData.saveData();
        director.emit(GlobalEvent.ToyRaceRankChange);
    }

    onGameSuccess() {
        if (AppGame.gameCtrl.currMode == GameMode.Challenge || MgrGame.Instance.gameData.curLv < MgrGame.Instance.gameData.maxLv) {
            return;
        }

        switch (this.toyRaceData.status) {
            case ToyRaceState.None:
                this.tryUnlock();
                break;
            case ToyRaceState.Matching:
            case ToyRaceState.InRace: {
                const me = this.toyRaceData.players[0];
                if (me && me.levels < GameConst.ToyRaceMaxProgress) {
                    this.toyRaceData.players[0].levels++;
                    this.toyRaceData.players[0].rTime = Tools.GetNowTime();
                    this.refreshRanks();
                    this.checkSettle();
                    AnalyticsManager.getInstance().reportToyRaceProgress({
                        ToyRace_Id: this._toyRaceData!.aiCfgId,
                        ToyRace_Match_Num: this._toyRaceData!.matchCount,
                        ToyRace_Rank: me.rank,
                        ToyRace_Progress: this.toyRaceData.players[0].levels
                    });
                }
                break;
            }
            case ToyRaceState.Finish:
                this.toyRaceData.status = ToyRaceState.Idle;
                this.toyRaceData.players = [];
                break;
        }
    }

    tryUnlock(): boolean {
        if (MgrGame.Instance.gameData.maxLv >= GameConst.ToyRaceUnlockLevel) {
            const nowDate = Tools.GetNowDate();
            const day = nowDate.getDay();
            const start = GameConst.TOY_RACE_OPEN_TIME[0];
            const end = GameConst.TOY_RACE_OPEN_TIME[2];
            if (day < start || day > end) {
                return false;
            }
            const dayOffset = day - start;
            const baseTime = nowDate.getTime() - dayOffset * DAY_MILLISECOND;
            const t = this.toyRaceData.lastTime = moment(baseTime).startOf('days').valueOf();
            this.unlock(t);
            return true;
        }
        return false;
    }

    unlock(timeValue: number) {
        AnalyticsManager.getInstance().reportToyRaceOpen({
            ToyRace_Is_First: this.toyRaceData.openCount > 0 ? 0 : 1
        });
        this.toyRaceData.status = ToyRaceState.Idle;
        this.toyRaceData.lastTime = timeValue;
        this.toyRaceData.openCount++;
        director.emit(GlobalEvent.ToyRaceUnlock);
    }

    isVisible() {
        return this.toyRaceData.status != ToyRaceState.None && this.toyRaceData.status != ToyRaceState.Gap;
    }

    matchEnable() {
        return MgrGame.Instance.gameData.maxLv > GameConst.ToyRaceUnlockLevel && this.toyRaceData.status == ToyRaceState.Idle;
    }

    startMatch() {
        if (this.toyRaceData.status != ToyRaceState.Matching) {
            this.toyRaceData.status = ToyRaceState.Matching;
            this.toyRaceData.matchCount++;
            this.toyRaceData.aiCfgId = ToyRaceAiCfg.Instance.getRandomId();
            this.toyRaceData.players = [{
                rTime: 0,
                id: 0,
                levels: 0,
                cacheLvs: 0,
                me: 1,
                rank: 1,
                head: MgrUser.Instance.userData.userHead
            }];
            this.rdmMatchTime();
        }
    }

    rdmMatchAI() {
        const p = {
            rTime: Tools.GetNowTime(),
            id: RankNameCfg.Instance.getRandomId(),
            levels: 0,
            cacheLvs: 0,
            me: 0,
            rank: this.toyRaceData.players.length + 1,
            head: AvatarCfg.Instance.getRandomHeadId()
        };
        this.toyRaceData.players.push(p);
    }

    syncCacheLvs() {
        each(this.toyRaceData.players, (p: any) => {
            p.cacheLvs = p.levels;
        });
        this.toyRaceData.saveData();
    }

    rdmMatchTime() {
        this._matchTime = 1 + 5 * Math.random();
    }

    matchAll() {
        if (this.toyRaceData.status != ToyRaceState.InRace) {
            if (this.toyRaceData.players.length < GameConst.ToyRaceMatchCount) {
                for (let i = this.toyRaceData.players.length; i < GameConst.ToyRaceMatchCount; i++) {
                    this.rdmMatchAI();
                }
            }
            this.matchComplete();
        }
    }

    matchComplete() {
        this.toyRaceData.status = ToyRaceState.InRace;
        AnalyticsManager.getInstance().reportToyRaceMatch({
            ToyRace_Id: this.toyRaceData.aiCfgId,
            ToyRace_Match_Num: this.toyRaceData.matchCount
        });
    }

    raceSettle() {
        this.toyRaceData.status = ToyRaceState.Result;
        const me = this.toyRaceData.players[0];
        if (me) {
            const rank = me.rank;
            const progress = me.levels;
            AnalyticsManager.getInstance().reportToyRaceFail({
                ToyRace_Id: this._toyRaceData!.aiCfgId,
                ToyRace_Match_Num: this._toyRaceData!.matchCount,
                ToyRace_Rank: rank,
                ToyRace_Progress: progress,
                ToyRace_Fail_Type: rank > RaceRewardIdx ? 1 : 2
            });
        }
        director.emit(GlobalEvent.ToyRaceSettle);
    }

    receiveReward() {
        const me = this.toyRaceData.players[0];
        if (me) {
            const rank = me.rank;
            if (rank <= RaceRewardIdx) {
                const cfg = ToyRaceCfg.Instance.get(rank);
                if (cfg) {
                    let rewardStr = '';
                    const rewardMap: Record<string, number> = {};
                    each(cfg.rewards, (r: any) => {
                        if (rewardStr === '') rewardStr = `${r.id}|${r.count}`;
                        else rewardStr += `,${r.id}|${r.count}`;
                        set(rewardMap, r.id, r.count);
                    });
                    AnalyticsManager.getInstance().reportToyRaceReward({
                        ToyRace_Rank: rank,
                        Reward: rewardStr
                    });
                    MgrUi.Instance.openViewAsync(UIPrefabs.CommonRewardView, {
                        priority: 2,
                        data: {
                            rewardData: rewardMap,
                            sourceType: 'ToyRaceReward',
                            title: Language.Instance.getLangByID('toyrace_title')
                        }
                    });
                } else {
                    console.error('未配置对应排名的奖励：' + rank);
                }
            }
        } else {
            console.error('数据错误，领取奖励时没有自己的数据');
        }
        this.settle();
    }

    settle() {
        this.toyRaceData.players.length = 1;
        this.toyRaceData.status = ToyRaceState.Finish;
        director.emit(GlobalEvent.ToyRaceFinish);
    }

    checkSettle() {
        let finished = 0;
        for (let i = 1; i < this.toyRaceData.players.length; i++) {
            if (this.toyRaceData.players[i].levels == GameConst.ToyRaceMaxProgress) finished++;
        }
        const me = this.toyRaceData.players[0];
        if (finished >= RaceRewardIdx || (me && me.levels == GameConst.ToyRaceMaxProgress)) {
            if (me && me.rank > RaceRewardIdx) {
                AnalyticsManager.getInstance().reportToyRaceFail({
                    ToyRace_Id: this._toyRaceData!.aiCfgId,
                    ToyRace_Match_Num: this._toyRaceData!.matchCount,
                    ToyRace_Rank: me.rank,
                    ToyRace_Progress: me.levels,
                    ToyRace_Fail_Type: 1
                });
            }
            this.raceSettle();
        }
    }

    getRemainTime() {
        const now = Tools.GetNowTime();
        return this.toyRaceData.lastTime + GameConst.ToyRaceOpenDays * DAY_MILLISECOND - now;
    }

    tryHomePopViews(cb?: () => void) {
        if (this._toyRaceData!.tip) {
            switch (this.toyRaceData.status) {
                case ToyRaceState.None:
                    if (this.tryUnlock()) {
                        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRacePrepare, {
                            data: {
                                hideCall: () => {
                                    cb && cb();
                                }
                            }
                        });
                    } else {
                        cb && cb();
                    }
                    return;
                case ToyRaceState.Gap:
                    if (this.checkoutGap()) {
                        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRacePrepare, {
                            data: {
                                hideCall: () => {
                                    cb && cb();
                                }
                            }
                        });
                    } else {
                        cb && cb();
                    }
                    return;
                case ToyRaceState.Result:
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRaceView, {
                        data: {
                            hideCall: () => {
                                cb && cb();
                            }
                        }
                    });
                    return;
            }
            cb && cb();
        } else {
            cb && cb();
        }
    }

    onEnter() {
        switch (this.toyRaceData.status) {
            case ToyRaceState.Idle:
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRacePrepare);
                break;
            case ToyRaceState.Matching:
            case ToyRaceState.InRace:
            case ToyRaceState.Result:
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRaceView);
                break;
            case ToyRaceState.Finish:
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRaceNextTip);
                break;
        }
    }

    getActiveStatus() {
        if (this.toyRaceData.status == ToyRaceState.Gap) {
            return ACTIVE_STATUS.GAP;
        }
        if (this.toyRaceData.status == ToyRaceState.None) {
            if (MgrGame.Instance.gameData.maxLv < GameConst.ToyRaceUnlockLevel) {
                return ACTIVE_STATUS.LOCK;
            }
            const day = Tools.GetNowDate().getDay();
            const start = GameConst.TOY_RACE_OPEN_TIME[0];
            const end = GameConst.TOY_RACE_OPEN_TIME[2];
            if (day < start || day > end) {
                return ACTIVE_STATUS.GAP;
            }
        }
        return ACTIVE_STATUS.ACTIVE;
    }

    getUnlockInfo() {
        return Language.Instance.getLangByID('event_level_unlock').replace('{0}', GameConst.ToyRaceUnlockLevel.toString());
    }

    getOpenTimeInfo() {
        return Language.Instance.getLangByID('ToyRaceOpenTime');
    }

    guide(callback?: () => void) {
        const btn = AppGame.topUI.toyRaceBtn;
        let clicked = false;
        MgrWeakGuide.Instance.openWeakGuide({
            node: btn.node,
            click: () => {
                clicked = true;
                if (!MgrUi.Instance.getView(UIPrefabs.ToyRacePrepare.url)) {
                    if (MgrUi.Instance.hasViewQueus(UIPrefabs.ToyRaceView.url)) {
                        MgrUi.Instance.addViewAsyncQueueCallback(UIPrefabs.ToyRaceView, (v: any) => {
                            v.once(VIEW_ANIM_EVENT.Remove, callback);
                        });
                    } else {
                        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.ToyRacePrepare, {
                            root: MgrUi.root(2),
                            data: {
                                guideCall: callback
                            }
                        });
                    }
                }
            },
            close: () => {
                this._toyRaceData!.tip = true;
                if (!clicked && callback) callback();
            },
            pos: GuidePos.Left,
            lang: 'ui_toyrace_open_tip'
        });
    }

    checkNeedGuide() {
        return MgrGame.Instance.gameData.maxLv >= GameConst.ToyRaceUnlockLevel && this.isVisible() && !this._toyRaceData!.tip;
    }
}
import { _decorator, director } from 'cc';
const { ccclass } = _decorator;

import { ACTIVE_STATUS } from './Const';
import { GlobalEvent } from './Events';
import { GameConst } from './GameConst';
import { UIPrefabs } from './Prefabs';
import {AvatarCfg} from './AvatarCfg';
import {RankNameCfg} from './RankNameCfg';
import {StarLeagueAiCfg} from './StarLeagueAiCfg';
import StarLeagueCfg from './StarLeagueCfg';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {Language} from './Language';
import {MgrBase} from './MgrBase';
import {Tools} from './Tools';
import { StarEagueData } from './StarEagueData';
import { AppGame } from './AppGame';
import { GuidePos } from './WeakGuide';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrGame } from './MgrGame';
import {MgrUi} from './MgrUi';
import { MgrUser } from './MgrUser';
import {MgrWeakGuide} from './MgrWeakGuide';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

export const StarEagueRewardStageName = ['box_green', 'box_blue', 'box_pink', 'box_red', 'box_purple'];
export const StarEagleRewardStateName = ['loop', 'open', 'open_idle'];

export enum StarEagleRewardState {
    LOOP = 0,
    OPEN = 1,
    OPEN_IDLE = 2,
}

export const StarEagleStageLevel = 5;
export const StarEagueRewardBox = 3;
export const StarEagueRewardItem = 10;

export const StarEagueUpRange = [1, 10];
export const StarEagueStillRange = [11, 30];
export const StarEagueDownRange = [31, 60];
export const StarEagueTipUpRank = 10;
export const StarEagueTipDownRank = 30;

export enum StarEagueState {
    Wait = 0,
    Open = 1,
    WaitReward = 2,
    Rewarded = 3,
}

@ccclass('MgrStar')
export class MgrStar extends MgrBase {
    private static _instance: MgrStar | null = null;

    private _starData: StarEagueData | null = null;
    private _curPeriod = 0;
    private _startTime = 0;
    private _endTime = 0;
    private _state: StarEagueState = StarEagueState.Wait;
    private _updateRunTime = 0;
    private _rankRunTime = 0;
    private _prevStar = 0;

    onLoad() {
        this._starData = new StarEagueData('ck-star-data');
        (this.constructor as any)._instance = this;
    }

    initLoadData() {
        this.starData?.load();
        this.resetPrevStar();
        this._checkState();
    }

    load() {
        // intentionally empty (kept for parity)
    }

    resetPrevStar() {
        if (this._starData) {
            this._prevStar = this._starData.star;
        }
    }

    private _checkState(dt = 0) {
        // If feature locked by level
        if (MgrGame.Instance.gameData.maxLv < GameConst.STAR_LEAGUE_OPEN_LEVEL) {
            if (this._state !== StarEagueState.Wait) {
                this._state = StarEagueState.Wait;
                director.emit(GlobalEvent.StarEagueStateChange);
            }
            return;
        }

        this._initPeriod();

        if (this._curPeriod <= 0) {
            if (this._state !== StarEagueState.Wait) {
                this._state = StarEagueState.Wait;
                director.emit(GlobalEvent.StarEagueStateChange);
            }
            return;
        }

        // If user's firstPeriod is ahead of current period, still waiting
        if (this.starData?.firstPeriod && this.starData.firstPeriod > this._curPeriod) {
            if (this._state !== StarEagueState.Wait) {
                this._state = StarEagueState.Wait;
                director.emit(GlobalEvent.StarEagueStateChange);
            }
            return;
        }

        // If user has a recorded period different from current and it's not settled -> WaitReward
        if (this.starData && this.starData.period && this.starData.period != this._curPeriod && !this._checkPeriodSettle(this.starData.period)) {
            if (this._state !== StarEagueState.WaitReward) {
                this._state = StarEagueState.WaitReward;
                director.emit(GlobalEvent.StarEagueStateChange);
            }
            return;
        }

        // If current period is already settled -> Wait
        if (this._checkPeriodSettle(this._curPeriod)) {
            if (this._state !== StarEagueState.Wait) {
                this._state = StarEagueState.Wait;
                director.emit(GlobalEvent.StarEagueStateChange);
            }
            return;
        }

        const now = Tools.GetNowTime();
        if (now < this._startTime) {
            if (this._state !== StarEagueState.Wait) {
                this._state = StarEagueState.Wait;
                director.emit(GlobalEvent.StarEagueStateChange);
            }
            return;
        }

        if (now > this._endTime) {
            if (this.starData?.period == this._curPeriod) {
                if (this._state !== StarEagueState.WaitReward) {
                    this._state = StarEagueState.WaitReward;
                    director.emit(GlobalEvent.StarEagueStateChange);
                }
            } else {
                if (this._state !== StarEagueState.Wait) {
                    this._state = StarEagueState.Wait;
                    director.emit(GlobalEvent.StarEagueStateChange);
                }
            }
            return;
        }

        // Period is active
        if (this._state === StarEagueState.Open) {
            director.emit(GlobalEvent.StarEagueTimeChange);
            this._rankRunTime += dt;
            if (this._rankRunTime >= 10) {
                this._rankRunTime = 0;
                this._triggerAIRank();
            }
            return;
        }

        this._state = StarEagueState.Open;
        this._triggerAIRank();
        director.emit(GlobalEvent.StarEagueStateChange);
    }

    update(dt: number) {
        this._updateRunTime += dt;
        if (this._updateRunTime > 1) {
            this._checkState(this._updateRunTime);
            this._updateRunTime = 0;
        }
    }

    private _initPeriod() {
        const nowMoment = Tools.GetNowMoment();
        const base = moment('2024-01-01 00:00');
        const diffDays = nowMoment.startOf('day').diff(base, 'day');
        if (diffDays >= 0) {
            const weekOpenDays = GameConst.STAR_LEAGUE_WEEK_OPEN_DAY; // array of week days
            const firstOpenIdx = weekOpenDays[0] - 1;
            const lastOpenIdx = weekOpenDays[weekOpenDays.length - 1] - 1;
            const periodNum = Math.floor(diffDays / 7) + 1;
            const periodStartBase = base.add(7 * (periodNum - 1), 'day').valueOf();
            this._curPeriod = periodNum;
            this._startTime = moment(periodStartBase).add(firstOpenIdx, 'day').startOf('day').valueOf();
            this._endTime = moment(periodStartBase).add(lastOpenIdx, 'day').endOf('day').valueOf();
        } else {
            this._curPeriod = 0;
            this._startTime = 0;
            this._endTime = 0;
        }
    }

    private _checkPeriodSettle(period: number) {
        return this.starData?.settlePersiod.includes(period);
    }

    private _initRankData() {
        if (!this._starData) return;
        this._starData.aiRank.length = 0;
        const now = Tools.GetNowTime();
        const aiIds = RankNameCfg.Instance.radomAiNameIds(GameConst.STAR_LEAGUE_COUNT - 1);
        for (let i = 0; i < aiIds.length; i++) {
            const id = aiIds[i];
            const rTime = now;
            const rank = i + 1;
            const head = AvatarCfg.Instance.getRandomHeadId();
            this._starData.addRankData({
                id,
                rTime,
                rank,
                star: 0,
                head,
            });
        }
    }

    private _triggerAIRank() {
        if (this._state !== StarEagueState.Open || this.starData?.period !== this._curPeriod) return;

        let changed = false;
        const now = Tools.GetNowTime();
        for (let i = 0; i < this.starData.aiRank.length; i++) {
            const ai = this.starData.aiRank[i];
            const aiCfg = StarLeagueAiCfg.Instance.getStarLeagueAiValue(this.starData.aiCfgId, ai.rank);
            const delta = now - ai.rTime;
            const aiIntervalMs = 60000 * aiCfg.aiTime; // 60000 ms per minute
            const times = Math.floor(delta / aiIntervalMs);
            if (times > 0) {
                changed = true;
                let add = 0;
                const range = aiCfg.aiAddRange;
                const min = range[0];
                const max = range[1];
                const percent = aiCfg.aiPercent;
                for (let t = 0; t < times; t++) {
                    if (Tools.randomRange(0, 100) <= percent) {
                        add += Tools.randomRange(min, max);
                    }
                }
                ai.rTime = now;
                ai.star += add;
            }
        }

        if (changed) {
            this.starData.aiRank.sort((a, b) => b.star - a.star);
            this.starData.aiRank.forEach((r, idx) => {
                r.rank = idx + 1;
            });
            this.starData.saveData();
            director.emit(GlobalEvent.StarEagueRankRefresh);
        }
    }

    getRankData() {
        const list: any[] = [];
        this._starData?.aiRank.forEach((it) => {
            list.push({
                rank: it.rank,
                rTime: it.rTime,
                id: it.id,
                star: it.star,
                head: it.head,
            });
        });

        const selfData: any = {
            star: this._starData ? this._starData.star : 0,
            me: true,
            rank: -1,
            rTime: -1,
            id: -1,
            head: MgrUser.Instance.userData.userHead,
        };

        let pos = list.length;
        for (let i = list.length - 1; i >= 0; i--) {
            const item = list[i];
            if (selfData.star < item.star) {
                break;
            }
            pos--;
            item.rank += 1;
        }

        selfData.rank = pos + 1;
        list.splice(pos, 0, selfData);

        // insert tip up marker at index 10 (0xa)
        list.splice(10, 0, {
            rank: -1,
            rTime: -1,
            id: -1,
            star: -1,
            tipUp: true,
            head: 0,
        });

        // insert tip down marker at index 31 (0x1f) per source (splice params are position and deleteCount 0)
        list.splice(31, 0, {
            rank: -1,
            rTime: -1,
            id: -1,
            star: -1,
            tipDown: true,
            head: 0,
        });

        return {
            rankData: list,
            selfData,
        };
    }

    getPrevRankData() {
        const list: any[] = [];
        this._starData?.aiRank.forEach((it) => {
            list.push({
                rank: it.rank,
                rTime: it.rTime,
                id: it.id,
                star: it.star,
                head: it.head,
            });
        });

        const selfData: any = {
            star: this._prevStar,
            me: true,
            rank: -1,
            rTime: -1,
            id: -1,
            head: MgrUser.Instance.userData.userHead,
        };

        let pos = list.length;
        for (let i = list.length - 1; i >= 0; i--) {
            const item = list[i];
            if (selfData.star < item.star) {
                break;
            }
            pos--;
            item.rank += 1;
        }

        selfData.rank = pos + 1;
        list.splice(pos, 0, selfData);

        list.splice(10, 0, {
            rank: -1,
            rTime: -1,
            id: -1,
            star: -1,
            tipUp: true,
            head: 0,
        });

        list.splice(31, 0, {
            rank: -1,
            rTime: -1,
            id: -1,
            star: -1,
            tipDown: true,
            head: 0,
        });

        return {
            rankData: list,
            selfData,
        };
    }

    joinCurPeriod() {
        if (!this._starData) return;
        if (this._starData.period != this._curPeriod) {
            this._starData.period = this._curPeriod;
            if (!this._starData.firstPeriod) this._starData.firstPeriod = this._curPeriod;
            this._starData.star = 0;

            const stage = Math.ceil(this._starData.level / StarEagleStageLevel);
            this._starData.aiCfgId = StarLeagueAiCfg.Instance.getRandomCfgIdByStage(stage);
            this._initRankData();
            director.emit(GlobalEvent.StarEagueRankChange);
        }
    }

    checkJoinCurPeriod() {
        return this._starData?.period == this._curPeriod;
    }

    showMenu() {
        return this._state == StarEagueState.Open;
    }

    showMenuRank() {
        const open = this._state == StarEagueState.Open;
        const samePeriod = this._starData?.period == this._curPeriod;
        return open && samePeriod;
    }

    getRemainTime() {
        return this._endTime ? this._endTime - Tools.GetNowTime() : 0;
    }

    refreshPopPeriod() {
        if (this._starData) this._starData.popPeriod = this._curPeriod;
    }

    addStar(value: number) {
        if (this._state == StarEagueState.Open && this._starData?.period == this._curPeriod) {
            this._starData.star += value;
            let levelIndex = this._starData.level % StarEagleStageLevel;
            if (levelIndex === 0) levelIndex = StarEagleStageLevel;
            const stage = Math.ceil(this._starData.level / StarEagleStageLevel);

            AnalyticsManager.getInstance().reportSunLeagueProgress({
                SunLeague_Stage: stage,
                SunLeague_Level: levelIndex,
                SunLeague_Point: this._starData.star,
                SunLeague_Rank: this.getRankData().selfData.rank,
                SunLeague_Ai_Id: this.starData?.aiCfgId,
            });

            director.emit(GlobalEvent.StarEagueRankChange);
        }
    }

    retrieveStarEague() {
        return this._state == StarEagueState.Open && this._starData?.period == this._curPeriod && !(MgrGame.Instance.wisdom <= 0);
    }

    tryHomePopViews(cb?: () => void) {
        if (this.needGuide() && this._state != StarEagueState.WaitReward) {
            cb && cb();
            return;
        }

        if (this._state == StarEagueState.Open) {
            if (this._starData && this._starData.popPeriod != this._curPeriod) {
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueStartView, {
                    data: {
                        hideCall: () => {
                            cb && cb();
                        },
                    },
                });
            } else {
                cb && cb();
            }
            return;
        }

        if (this._state == StarEagueState.WaitReward) {
            MgrUi.Instance.openViewAsync(UIPrefabs.StarEagueResultView, {
                data: {
                    hideCall: () => {
                        cb && cb();
                    },
                },
            });
            return;
        }

        cb && cb();
    }

    checkWinPop() {
        return this._state == StarEagueState.Open && this._starData?.period == this._curPeriod;
    }

    getRewardAnimationName(stage: number, boxIndex: number, stateIndex: number) {
        return `${StarEagueRewardStageName[stage - 1]}${boxIndex}_${StarEagleRewardStateName[stateIndex]}`;
    }

    getRewardBoxAnimationName(stage: number, stateIndex: number) {
        return `${StarEagueRewardStageName[stage - 1]}_${StarEagleRewardStateName[stateIndex]}`;
    }

    settlePersiod(period: number, rank: number) {
        if (!this._starData) return;
        if (this._checkPeriodSettle(period)) return;

        let rewardStr = '';

        if (rank <= StarEagueRewardBox) {
            const stage = Math.ceil(this._starData.level / StarEagleStageLevel);
            const rewards = StarLeagueCfg.Instance.get(stage)[`rewards${rank}`];
            for (let i = 0; i < rewards.length; i++) {
                const r = rewards[i];
                MgrUser.Instance.userData.addItem(r.id, r.count, { type: 'SunReward' });
            }
            rewards.forEach((r: any) => {
                if (rewardStr === '') rewardStr = `${r.id}|${r.count}`;
                else rewardStr += `,${r.id}|${r.count}`;
            });
        } else if (rank <= StarEagueRewardItem) {
            const stage = Math.ceil(this._starData.level / StarEagleStageLevel);
            const rewards = StarLeagueCfg.Instance.get(stage)['rewards4'];
            for (let i = 0; i < rewards.length; i++) {
                const r = rewards[i];
                MgrUser.Instance.userData.addItem(r.id, r.count, { type: 'SunReward' });
            }
        }

        let levelChange = 2;
        if (rank <= StarEagueTipUpRank) {
            this._starData.level++;
            levelChange = 1;
            this._starData.level = Math.min(this._starData.level, StarLeagueCfg.Instance.maxStage * StarEagleStageLevel);
        } else if (rank > StarEagueTipDownRank) {
            this._starData.level--;
            levelChange = 3;
            this._starData.level = Math.max(this._starData.level, 1);
        }

        const newStage = Math.ceil(this._starData.level / StarEagleStageLevel);
        let newLevel = this._starData.level % StarEagleStageLevel;
        if (newLevel === 0) newLevel = StarEagleStageLevel;

        AnalyticsManager.getInstance().reportSunLeagueGet({
            SunLeague_Stage: newStage,
            SunLeague_Level: newLevel,
            SunLeague_Point: this._starData.star,
            SunLeague_Rank: rank,
            SunLeague_Level_Change: levelChange,
            Reward: rewardStr,
        });

        this._starData.settlePersiod.push(period);
        this._starData.saveData();
    }

    onEnter() {
        if (this.checkJoinCurPeriod()) {
            this.resetPrevStar();
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueView, {
                root: MgrUi.root(1),
            });
        } else {
            if (this._starData) this._starData.tipPeriod = this._curPeriod;
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueStartView);
        }
    }

    getActiveStatus() {
        if (MgrGame.Instance.gameData.maxLv < GameConst.STAR_LEAGUE_OPEN_LEVEL) {
            return ACTIVE_STATUS.LOCK;
        }
        const now = Tools.GetNowTime();
        return now < this._startTime || now > this._endTime ? ACTIVE_STATUS.GAP : ACTIVE_STATUS.ACTIVE;
    }

    getUnlockInfo() {
        return Language.Instance.getLangByID('event_level_unlock').replace('{0}', GameConst.STAR_LEAGUE_OPEN_LEVEL.toString());
    }

    getOpenTimeInfo() {
        return Language.Instance.getLangByID('StarLeagueOpenTime');
    }

    needGuide() {
        return this._starData?.tipPeriod != this._curPeriod;
    }

    hasGuide() {
        return this._starData?.tipPeriod == this._curPeriod;
    }

    guide(cb?: () => void) {
        if (!this._starData) return;
        const starBtn = AppGame.topUI.starBtn;
        let clicked = false;

        let levelIndex = this._starData.level % StarEagleStageLevel;
        if (levelIndex === 0) levelIndex = StarEagleStageLevel;

        AnalyticsManager.getInstance().reportSunLeagueOpen({
            SunLeague_Stage: Math.ceil(this._starData.level / StarEagleStageLevel),
            SunLeague_Level: levelIndex,
        });

        MgrWeakGuide.Instance.openWeakGuide({
            node: starBtn.node,
            click: () => {
                clicked = true;
                const startView = MgrUi.Instance.getView(UIPrefabs.StarEagueStartView.url);
                if (startView) {
                    startView.once(VIEW_ANIM_EVENT.Remove, cb);
                } else if (MgrUi.Instance.hasViewQueus(UIPrefabs.StarEagueView.url)) {
                    MgrUi.Instance.addViewAsyncQueueCallback(UIPrefabs.StarEagueView, (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, cb);
                    });
                } else {
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueStartView, {
                        root: MgrUi.root(2),
                        data: {
                            guideCall: cb,
                        },
                    });
                }
            },
            close: () => {
                this._starData!.tipPeriod = this._curPeriod;
                if (!clicked) {
                    cb && cb();
                }
            },
            pos: GuidePos.Left,
            lang: 'ui_sunleague_open_tip',
        });
    }

    checkNeedGuide() {
        return MgrGame.Instance.gameData.maxLv >= GameConst.STAR_LEAGUE_OPEN_LEVEL && this.showMenu() && this.needGuide();
    }

    get starData() {
        return this._starData!;
    }

    get curPeriod() {
        return this._curPeriod;
    }

    get startTime() {
        return this._startTime;
    }

    get endTime() {
        return this._endTime;
    }

    get prevStar() {
        return this._prevStar;
    }

    static get Instance() {
        return (this as any)._instance as MgrStar;
    }
}
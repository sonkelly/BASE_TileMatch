import { _decorator, Node, Button, UIOpacity, Label, Animation, Vec3, director, tween, Tween, v3, easing } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import {AsyncQueue} from './AsyncQueue';
import {UIPool} from './UIPool';
import { MgrRace, RaceMaxProgress, RaceState, RaceRewardIdx, RaceFailedType, TurnMaxPlayer } from './MgrRace';
import {Utils} from './Utils';
import { RaceAvatar } from './RaceAvatar';
import { GlobalEvent } from './Events';
import {MgrGame} from './MgrGame';
import { RaceReward } from './RaceReward';
import {AppGame} from './AppGame';

const { ccclass, property } = _decorator;

// module-level temp vectors reused to avoid allocations
const TMP_V0 = new Vec3(0, 0, 0);
const TMP_V1 = new Vec3();
const TMP_V2 = new Vec3();
const TMP_V3 = new Vec3();
const TMP_BEZIER = new Vec3();

@ccclass('RaceView')
export default class RaceView extends UIPool {
    @property(Button)
    public backBtn: Button | null = null;

    @property(Button)
    public helpBtn: Button | null = null;

    @property([Node])
    public stepPos: Node[] = [];

    @property([RaceReward])
    public rewardNodes: RaceReward[] = [];

    @property(Node)
    public playerLayer: Node | null = null;

    @property(UIOpacity)
    public redLight1: UIOpacity | null = null;

    @property(UIOpacity)
    public redLight2: UIOpacity | null = null;

    @property(Label)
    public timeLabel: Label | null = null;

    @property([Animation])
    public boomAnimations: Animation[] = [];

    @property(Node)
    public levelTipNode: Node | null = null;

    @property(UIOpacity)
    public levelTipOpacity: UIOpacity | null = null;

    private _taskAsync: AsyncQueue | null = null;
    private _mustLevelFailedAsync: AsyncQueue | null = null;
    private _allRaceInfo: any[] = [];
    private _raceFinishInfo: Map<number, any> = new Map();
    private _playersRaceCmp: RaceAvatar[] = [];
    private _selfRaceCmp: RaceAvatar | null = null;
    private _raceStepMap: Map<string | number, number> = new Map();
    private _maxRaceStep: number = 0;
    private _runBackTip: boolean = false;
    private _backTipTime: number = 0;
    private _closeCall: (() => void) | null = null;

    // reuse data may contain closeCall
    public reuse(data?: { closeCall?: () => void }) {
        if (data) {
            this._closeCall = data?.closeCall;
        }
    }

    onLoad() {
        this.backBtn?.node.on('click', this._onClickBack, this);
        this.helpBtn?.node.on('click', this._onClickHelp, this);
        this.rewardNodes.forEach((rn) => rn.setDelegate && rn.setDelegate(this));
    }

    onEnable() {
        AppGame.Ins.checkNetwork();
        MgrRace.Instance.canRunAi = false;
        director.on(GlobalEvent.refreshRaceTime, this._refreshRaceTime, this);
        director.on(GlobalEvent.changeRaceState, this._refreshRaceState, this);

        this._resetBackTipAct();
        this._refreshRaceTime();
        this._runRedLightAct();
        this._checkShowHelp();
        this._initStep();
        this._initRewardState();
        this._runTask();

        console.log('use AiCfgId:', MgrRace.Instance.data.raceAiCfgId);
    }

    update(dt: number) {
        if (this._runBackTip) {
            this._backTipTime += dt;
            if (this._backTipTime >= 10) {
                this._runBackTip = false;
                this._backTipTime = 0;
                this._runBackTipAct();
            }
        }
    }

    onDisable() {
        this._stopRedLightAct();

        this._playersRaceCmp.forEach((p) => {
            Tween.stopAllByTarget(p.node);
            this.put(p);
        });
        this._playersRaceCmp.length = 0;
        this._selfRaceCmp = null;

        this._taskAsync?.clear();
        this._taskAsync = null;

        this._mustLevelFailedAsync?.clear();
        this._mustLevelFailedAsync = null;

        this.unscheduleAllCallbacks();
        director.targetOff(this);

        this.boomAnimations.forEach((anim) => {
            anim.stop();
            anim.node.active = false;
        });

        MgrRace.Instance.setAllShowStep();
        MgrRace.Instance.canRunAi = true;
    }

    private _initStep() {
        MgrRace.Instance.checkCanEndRace();
        this._raceStepMap.clear();
        this._raceFinishInfo.clear();
        this._allRaceInfo.length = 0;
        this._allRaceInfo = MgrRace.Instance.getRankData();

        for (let i = 0; i < this._allRaceInfo.length; i++) {
            const info = this._allRaceInfo[i];
            if (info.realStep >= RaceMaxProgress) {
                this._raceFinishInfo.set(info.rank, info);
            }

            const playerNode = this.get();
            if (playerNode && this.playerLayer) {
                playerNode.parent = this.playerLayer;
                playerNode.setSiblingIndex(info.rank);
            }

            const avatar = playerNode?.getComponent(RaceAvatar)!;
            avatar.raceInfo = info;
            this._playersRaceCmp.push(avatar);
            if (info.me) {
                this._selfRaceCmp = avatar;
            }

            const showStep = info.showStep;
            TMP_V0.set(0, 0, 0);
            this._setTempV3ByStep(showStep); // sets TMP_V0
            if (playerNode) {
                playerNode.worldPosition = TMP_V0;
            }
            this._raceStepMap.set(info.id, info.realStep - info.showStep);
        }

        if (this._selfRaceCmp) {
            this._selfRaceCmp.node.name = 'self';
            this._selfRaceCmp.node.setSiblingIndex(0x64);
        }

        const tmpArr: number[] = [];
        this._raceStepMap.forEach((v) => tmpArr.push(v));
        this._maxRaceStep = Math.max.apply(Math, tmpArr.length ? tmpArr : [0]);
    }

    private _setTempV3ByStep(step: number) {
        const pos = this.stepPos[step];
        const rx = step === 0 ? Utils.randomRange(-60, 60) : Utils.randomRange(-20, 20);
        const ry = step === 0 ? Utils.randomRange(-30, -10) : Utils.randomRange(15, 35);
        TMP_V0.set(pos.worldPosition.x + rx, pos.worldPosition.y + ry, 0);
        return TMP_V0;
    }

    private _runTask() {
        if (!this._checkSelfDirectWin() && !this._checkSelfDirectFailed()) {
            const isMust = MgrRace.Instance.isRaceMust(MgrRace.Instance.data.mustFailLevel);
            const inMustLevel = MgrRace.Instance.data.mustFailLevel == MgrGame.Instance.gameData.curLv;
            if (isMust && inMustLevel) {
                this._runMustLevelFailed();
            } else {
                this._runJumpTask();
            }
        }
    }

    private _checkSelfDirectWin(): boolean {
        if (MgrRace.Instance.raceState != RaceState.TurnOver) return false;

        let rank = TurnMaxPlayer;
        let reached = false;
        let sameShow = false;
        for (const info of this._allRaceInfo) {
            if (info.me) {
                rank = info.rank;
                reached = info.realStep >= RaceMaxProgress;
                sameShow = info.realStep == info.showStep;
                break;
            }
        }

        if (reached && rank <= RaceRewardIdx && sameShow) {
            MgrUi.Instance.openViewAsync(UIPrefabs.RaceSuccess, { priority: 3, data: { rank } });
            return true;
        }
        return false;
    }

    private _checkSelfDirectFailed(): boolean {
        if (MgrRace.Instance.raceState != RaceState.TurnOver) return false;
        if (this._raceFinishInfo.size < 3) return false;

        for (let i = 1; i <= 3; i++) {
            const info = this._raceFinishInfo.get(i)!;
            const notMe = !info.me;
            const reached = info.realStep >= RaceMaxProgress;
            const sameShow = info.realStep == info.showStep;
            if (!notMe || !reached || !sameShow) {
                return false;
            }
        }

        MgrUi.Instance.openViewAsync(UIPrefabs.RaceFailed, { priority: 3, data: { faildType: RaceFailedType.Rank } });
        return true;
    }

    private _runMustLevelFailed() {
        this._mustLevelFailedAsync = new AsyncQueue();
        this._selfRaceCmp?.stopAnimation();

        const boomIdx = MgrRace.Instance.getRaceMustIdx(MgrRace.Instance.data.mustFailLevel);
        if (boomIdx !== -1) {
            const anim = this.boomAnimations[boomIdx];
            this._mustLevelFailedAsync.push((next: () => void) => {
                anim.node.active = true;
                anim.play();
                this.scheduleOnce(next, 0.2);
            });
        }

        // prepare bezier movement
        TMP_V1.set(this._selfRaceCmp!.node.worldPosition);
        this._setTempV3ByStep(0);
        TMP_V2.set(TMP_V0);
        TMP_V3.set(TMP_V2.x, TMP_V1.y + 600, 0);

        this._mustLevelFailedAsync.push((done: () => void) => {
            const node = this._selfRaceCmp!.node;
            Tween.stopAllByTarget(node);
            tween(node)
                .to(1.3, { worldPosition: TMP_V2 }, {
                    onUpdate: (ratio: number) => {
                        const t = ratio;
                        // Quadratic Bezier between start(TMP_V1), control(TMP_V3), end(TMP_V2)
                        const ix = (1 - t) * (1 - t) * TMP_V1.x + 2 * t * (1 - t) * TMP_V3.x + t * t * TMP_V2.x;
                        const iy = (1 - t) * (1 - t) * TMP_V1.y + 2 * t * (1 - t) * TMP_V3.y + t * t * TMP_V2.y;
                        TMP_BEZIER.set(ix, iy, 0);
                        node.worldPosition = TMP_BEZIER;
                    }
                })
                .call(() => {
                    done();
                })
                .start();
        });

        this._mustLevelFailedAsync.complete = () => {
            MgrUi.Instance.openViewAsync(UIPrefabs.RaceFailed, { priority: 3, data: { faildType: RaceFailedType.Boom } });
        };

        this._mustLevelFailedAsync.play();
    }

    private _runJumpTask() {
        this._taskAsync = new AsyncQueue();
        this.backBtn!.node.active = false;

        for (let step = 0; step < this._maxRaceStep; step++) {
            const joinIds = this._getJoinTurnIds(step + 1);
            for (let i = 0; i < this._playersRaceCmp.length; i++) {
                const avatar = this._playersRaceCmp[i];
                const info = avatar.raceInfo;
                if (joinIds.indexOf(info.id) >= 0) {
                    this._taskAsync.push((next: () => void) => {
                        const targetShow = info.showStep + 1;
                        this._raceJump(avatar, targetShow);
                        this._checkStopJumpTask(avatar, targetShow);
                        info.showStep = targetShow;
                        this.scheduleOnce(next, 0.1);
                    });
                }
            }
            this._taskAsync.push((next: () => void) => {
                this.scheduleOnce(next, 1);
            });
        }

        this._taskAsync.complete = () => {
            this._runBackTip = true;
            this.backBtn!.node.active = true;
        };

        this._taskAsync.play();
    }

    private _getJoinTurnIds(turn: number): (string | number)[] {
        const ids: (string | number)[] = [];
        for (const [id, val] of this._raceStepMap.entries()) {
            if (val >= turn) ids.push(id);
        }
        return ids;
    }

    private _checkStopJumpTask(avatar: RaceAvatar, showStep: number) {
        const info = avatar.raceInfo;
        if (!(info.rank > RaceRewardIdx) && this._raceFinishInfo.get(info.rank)) {
            if (info.me && showStep >= RaceMaxProgress) {
                this._taskAsync?.clear();
                this.backBtn!.node.active = true;
                return;
            } else if (info.rank == RaceRewardIdx && showStep >= RaceMaxProgress) {
                this._taskAsync?.clear();
                this.backBtn!.node.active = true;
            }
        }
    }

    private _raceJump(avatar: RaceAvatar, showStep: number) {
        const info = avatar.raceInfo;
        avatar.playJump();
        this._setTempV3ByStep(showStep);
        const target = new Vec3(TMP_V0);
        const node = avatar.node;
        Tween.stopAllByTarget(node);
        tween(node)
            .delay(0.13)
            .to(0.6, { worldPosition: target })
            .call(() => {
                this._checkRewardState(info, showStep);
            })
            .start();
    }

    private _initRewardState() {
        this.rewardNodes.forEach((rn, idx) => {
            const fin = this._raceFinishInfo.get(idx + 1);
            rn.initRewardState(fin);
        });
    }

    private _checkRewardState(info: any, showStep: number) {
        const rn = this.rewardNodes[info.rank - 1];
        if (rn) {
            if (this._raceFinishInfo.get(info.rank) && info.realStep == showStep) {
                rn.playBoxOpen();
            }
        }
    }

    public checkResult(rank: number) {
        if (MgrRace.Instance.raceState != RaceState.TurnOver) return false as unknown as void;
        const fin = this._raceFinishInfo.get(rank)!;
        if (fin.me) {
            MgrUi.Instance.openViewAsync(UIPrefabs.RaceSuccess, { priority: 3, data: { rank: fin.rank } });
            MgrRace.Instance.setAllShowStep();
            return;
        }
        if (rank == RaceRewardIdx) {
            MgrUi.Instance.openViewAsync(UIPrefabs.RaceFailed, { priority: 3, data: { faildType: RaceFailedType.Rank } });
            MgrRace.Instance.setAllShowStep();
        }
    }

    private _runRedLightAct() {
        tween(this.redLight2 as any)
            .set({ opacity: 0xff })
            .to(2, { opacity: 0 })
            .to(2, { opacity: 0xff })
            .union()
            .repeatForever()
            .start();

        const delay = Math.random() + 1;
        this.scheduleOnce(() => {
            tween(this.redLight1 as any)
                .set({ opacity: 0xff })
                .to(2, { opacity: 0 })
                .to(2, { opacity: 0xff })
                .union()
                .repeatForever()
                .start();
        }, delay);
    }

    private _stopRedLightAct() {
        Tween.stopAllByTarget(this.redLight1 as any);
        Tween.stopAllByTarget(this.redLight2 as any);
    }

    private _refreshRaceTime() {
        const remain = MgrRace.Instance.getRemainTime();
        if (remain <= 0) {
            if (this.timeLabel) this.timeLabel.string = '';
        } else {
            const hhmm = Utils.timeConvertToHHMM(remain);
            if (this.timeLabel) this.timeLabel.string = '' + hhmm;
        }
    }

    private async _checkShowHelp() {
        if (!MgrRace.Instance.data.help) {
            await MgrUi.Instance.openViewAsync(UIPrefabs.RaceHelpView);
            MgrRace.Instance.data.help = true;
        }
    }

    private _onClickBack() {
        this.node.emit(VIEW_ANIM_EVENT.Remove, this);
        this._closeCall?.call(this);
    }

    private _onClickHelp() {
        MgrUi.Instance.openViewAsync(UIPrefabs.RaceHelpView);
    }

    private _resetBackTipAct() {
        this._runBackTip = false;
        if (this.levelTipNode) this.levelTipNode.scale = v3(0, 0, 0);
        if (this.levelTipOpacity) this.levelTipOpacity.opacity = 0;
        this._backTipTime = 0;
    }

    private _runBackTipAct() {
        if (this.levelTipNode) {
            Tween.stopAllByTarget(this.levelTipNode);
            tween(this.levelTipNode)
                .to(0.48, { scale: v3(1, 1, 1) }, { easing: easing.backOut })
                .start();
        }
        if (this.levelTipOpacity) {
            Tween.stopAllByTarget(this.levelTipOpacity);
            tween(this.levelTipOpacity)
                .to(0.48, { opacity: 0xff }, { easing: easing.backOut })
                .start();
        }
    }

    private _refreshRaceState() {
        if (MgrRace.Instance.raceState == RaceState.None) {
            this._onClickBack();
        }
    }
}
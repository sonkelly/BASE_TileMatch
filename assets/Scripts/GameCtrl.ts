import {
    _decorator,
    Component,
    director
} from 'cc';
import { GameMap } from './GameMap';
import { GameStatus, MgrGame, MAX_COLLECTED, GiveupType } from './MgrGame';
import { GameCollect } from './GameCollect';
import { GameStorage } from './GameStorage';
import { GlobalEvent } from './Events';
import { LogicStatus } from './GameLogic';
import { AsyncQueue } from './AsyncQueue';
import { GameOption } from './GameOption';
import { AppGame } from './AppGame';
import { MgrGoldTournament } from './MgrGoldTournament';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import { GameMode, FAILED_REASON } from './Const';
import {Language} from './Language';
import {Toast} from './Toast';
import { AdsManager } from './AdsManager';
import { MgrAnalytics } from './MgrAnalytics';
import { NativeBridge } from './NativeBridge';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrMine } from './MgrMine';
import { ITEM } from './GameConst';
import { MgrBattleLevel } from './MgrBattleLevel';

const { ccclass, property } = _decorator;

const LogicMap = {
    [GameMode.Challenge]: 'LogicChallenge',
    [GameMode.Level]: 'LogicLevel',
    [GameMode.Hard]: 'LogicHard',
    [GameMode.Bonus]: 'LogicBonus',
};

@ccclass('GameCtrl')
export class GameCtrl extends Component {
    @property(GameMap)
    gameMap: GameMap | null = null;

    @property(GameCollect)
    collector: GameCollect | null = null;

    @property(GameStorage)
    storage: GameStorage | null = null;

    @property(GameOption)
    option: GameOption | null = null;

    private _currMode: GameMode = GameMode.Level;
    private _gameState: GameStatus = GameStatus.None;
    private _logics: Record<string, any> = {};
    private curLogic: any = null;
    private _taskQueus: AsyncQueue = new AsyncQueue();
    private victoryQuery: AsyncQueue = new AsyncQueue();

    onLoad() {
        this.collector!.delegate = this;
        this.option!.delegate = this;
    }

    clear() {
        this.unscheduleAllCallbacks();
        this.unregisterLogicEvents();
        this.curLogic.clear();
        this.gameMap!.clear();
        this.collector!.clear();
        this.storage!.clear();
        this._taskQueus.clear();
    }

    getLogic(mode: GameMode) {
        let logic = this._logics[mode];
        if (!logic) {
            logic = this._logics[mode] = this.addComponent(LogicMap[mode]);
            logic.delegate = this;
        }
        return logic;
    }

    registerLogicEvents() {}

    unregisterLogicEvents() {
        this.curLogic.targetOff(this);
    }

    createGame() {
        this.gameState = GameStatus.Enter;
        this._taskQueus.clear();
        this._taskQueus.push((next) => {
            this.curLogic.enter(next);
        });
        this._taskQueus.complete = () => {
            this.registerLogicEvents();
            this.curLogic.startup();
            this.gameState = GameStatus.Playing;
        };
        this._taskQueus.play();
    }

    enter(mode: GameMode, callback: Function) {
        this.currMode = mode;
        this.curLogic = this.getLogic(this.currMode);
        this.gameState = GameStatus.Enter;
        MgrGame.Instance.wisdom = 0;
        this.playEnter(callback);
    }

    exit(callback: Function) {
        if (this.gameState != GameStatus.Ended) {
            this.gameState = GameStatus.Ended;
            this.curLogic.exit();
            this.playExit(callback);
        } else {
            callback && callback();
        }
    }

    playEnter(callback: Function) {
        this.collector!.playEnter();
        this.option!.playEnter();
        this.scheduleOnce(callback, 0.9);
    }

    playExit(callback: Function) {
        this.collector!.playExit();
        this.option!.playExit();
        this._taskQueus.clear();
        this.clear();
        this.scheduleOnce(callback, 0.6);
    }

    collectedEvent(event: any) {
        this.curLogic.collectedEvent(event);
    }

    eliminateEvent(event: any) {
        MgrGame.Instance.wisdom += 1;
        this.curLogic.eliminateEvent(event);
    }

    onEndEliminateEvent() {
        this.option!.refreshStatusUndo();
        director.emit(GlobalEvent.EliminateEvent);
    }

    endComplementEvent() {
        this.curLogic.endComplementEvent();
    }

    settlementOnce() {
        if (this.collector!.settlementEnable && this.collector!.isFull) {
            this.curLogic.failed(FAILED_REASON.Full);
        }
        if (this.gameMap!.tileList.length === 0) {
            this.victory();
        }
    }

    onAddCollectBox() {
        if (this.gameState == GameStatus.Playing) {
            const logicStatus = this.curLogic.logicStatus;
            if (logicStatus >= LogicStatus.Auto || logicStatus < LogicStatus.Idle) {
                AdsManager.getInstance().showRewardedVideo({
                    OpenUi: 'AddCollectBox',
                    AdsType: 'AddCollectBox',
                    onSucceed: () => {
                        this.collector!.maxCollectCnt = MAX_COLLECTED + 1;
                    },
                    onFail: () => {
                        Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
                    }
                });
            }
        }
    }

    onGuideComplete() {
        this.curLogic.onGuideComplete();
    }

    revive(callback: Function) {
        if (this.gameState == GameStatus.Playing) {
            this.curLogic.revive(callback);
        }
    }

    giveup(type: GiveupType) {
        const onGiveup = this.curLogic.onGiveup;
        onGiveup && onGiveup.call(this.curLogic, type);
        if (type == GiveupType.Retry) {
            this.replay();
        } else if (type == GiveupType.Home) {
            AppGame.topUI.backToUpper();
            MgrBattleLevel.Instance.clearBattleInfo();
        }
    }

    replay() {
        this.clear();
        this.curLogic.replay();
        this.playEnter(() => {
            this.createGame();
        });
    }

    undo() {
        if (this.gameState == GameStatus.Playing && this.curLogic.undo()) {
            this.option!.refreshStatusUndo();
            director.emit(GlobalEvent.GameUsePropUndo);
        }
    }

    wand() {
        if (this.gameState == GameStatus.Playing && this.curLogic.wand()) {
            this.option!.refreshStatusUndo();
            director.emit(GlobalEvent.GameUsePropTip);
        }
    }

    shuffle() {
        if (this.gameState == GameStatus.Playing && this.curLogic.shuffle()) {
            director.emit(GlobalEvent.GameUsePropShuffle);
        }
    }

    autoComplete() {
        if (this.gameState == GameStatus.Playing && this.curLogic.autoComplete(this.victory.bind(this))) {
            this.option!.playHideAuto();
            AppGame.topUI.setBtnEventEnable(AppGame.topUI.backBtn.node, false);
            AppGame.topUI.setBtnEventEnable(AppGame.topUI.setBtn.node, false);
        }
    }

    getCollectedCount() {
        return this.collector!.Collected.length;
    }

    victory() {
        const result = this.curLogic.victory();
        if (result) {
            MgrAnalytics.Instance.stopGameTime();
            MgrAnalytics.Instance.interstitialCnt = 0;
            MgrAnalytics.Instance.eliminateCnt = 0;
            this.playVictory(result);
        }
    }

    playVictory(result: any) {
        const goldCube = result.goldCube;
        const attachs = result.attachs;

        this.victoryQuery.clear();
        this.victoryQuery.push((next) => {
            const isNotChallenge = AppGame.gameCtrl.currMode !== GameMode.Challenge;
            const isBattleLevel = MgrBattleLevel.Instance.checkIsBattleLevel(result.level);
            if (isNotChallenge && isBattleLevel) {
                MgrBattleLevel.Instance.addToPlayVictoryFlows(next);
            } else {
                next();
            }
        });

        this.victoryQuery.push((next) => {
            this.exit(next);
        });

        this.victoryQuery.push((next) => {
            AppGame.gameUI.clearLevelInfo();
            NativeBridge.Instance.hideBanner();
            AppGame.gameCtrl.collector!.stopTipAnim();
            AppGame.topUI.setBtnEventEnable(AppGame.topUI.backBtn.node, true);
            AppGame.topUI.setBtnEventEnable(AppGame.topUI.setBtn.node, true);
            MgrUi.Instance.openViewAsync(UIPrefabs.EvaluateView, {
                priority: 1,
                data: {
                    endCall: () => {
                        NativeBridge.Instance.showInterstitialWithoutCooldown({
                            OpenUi: this.currMode === GameMode.Challenge ? 'ChallengeVictory' : 'Victory',
                            closeCallback: next,
                            errCallback: next
                        }) || next();
                    }
                }
            });
        });

        this.victoryQuery.push((next) => {
            AppGame.topUI.registerAssetFly();
            next();
        });

        this.victoryQuery.push((next) => {
            if (MgrGoldTournament.Instance.checkGoldTourOpen() && goldCube > 0) {
                MgrUi.Instance.openViewAsync(UIPrefabs.GoldTournamentDoubleView, {
                    priority: 1,
                    data: {
                        goldCube: goldCube,
                        endCall: next
                    }
                });
            } else {
                next();
            }
        });

        if (this.currMode == GameMode.Bonus) {
            this.victoryQuery.push((next) => {
                const coins = attachs[ITEM.TileCoin] || 0;
                if (coins > 0) {
                    MgrUi.Instance.openViewAsync(UIPrefabs.BonusDoubleView, {
                        priority: 1,
                        data: {
                            coins: coins,
                            onDouble: () => {
                                attachs[ITEM.TileCoin] = 2 * coins;
                            }
                        },
                        callback: (view) => {
                            view.once(VIEW_ANIM_EVENT.Remove, () => {
                                next();
                            });
                        }
                    });
                } else {
                    next();
                }
            });
        }

        this.victoryQuery.push((next) => {
            if (MgrGoldTournamentV2.Instance.checkGoldTourOpen() && goldCube > 0) {
                MgrUi.Instance.openViewAsync(UIPrefabs.GoldTournamentV2DoubleView, {
                    priority: 1,
                    data: {
                        goldCube: goldCube,
                        endCall: next
                    }
                });
            } else {
                next();
            }
        });

        this.victoryQuery.push((next) => {
            const pickAxe = attachs[ITEM.PickAxe] || 0;
            const isMineOpen = MgrMine.Instance.isOpen();
            const hasPickAxe = pickAxe > 0;
            const isMineFinished = MgrMine.Instance.isFinish();
            if (isMineOpen && hasPickAxe && !isMineFinished) {
                MgrUi.Instance.openViewAsync(UIPrefabs.MineViewDoubleView, {
                    priority: 1,
                    data: {
                        pickAxeCnt: pickAxe,
                        endCall: next
                    }
                });
            } else {
                next();
            }
        });

        this.victoryQuery.push((next) => {
            AppGame.topUI.normalMine.hide();
            next();
        });

        this.victoryQuery.complete = () => {
            this.node.active = false;
            MgrUi.Instance.closeAll();
            AppGame.topUI.clearBackFunc();
            this.curLogic.onAfterVictory(result);
        };

        this.victoryQuery.play();
    }

    get currMode() {
        return this._currMode;
    }

    set currMode(value: GameMode) {
        if (this._currMode !== value) {
            this._currMode = value;
        }
    }

    get gameState() {
        return this._gameState;
    }

    set gameState(value: GameStatus) {
        this._gameState = value;
        director.emit(GlobalEvent.ChangeGameStatus);
    }

    get isGoldTourOpen() {
        return MgrGoldTournament.Instance.checkGoldTourOpen() || MgrGoldTournamentV2.Instance.checkGoldTourOpen();
    }

    get optionEnable() {
        return this.gameState == GameStatus.Playing && (this.curLogic.logicStatus == LogicStatus.Idle || this.curLogic.logicStatus == LogicStatus.Guide);
    }
}
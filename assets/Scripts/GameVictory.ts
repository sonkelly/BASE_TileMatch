import { _decorator, Label, Node, ProgressBar, Sprite, Button, sp, director, Vec3, tween, easing, v3, sys, Tween, Component } from 'cc';
import { MgrStar } from './MgrStar';
import { MgrToyRace } from './MgrToyRace';
import { AppGame } from './AppGame';
import { MgrGame } from './MgrGame';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {Language} from './Language';
import { AsyncQueue } from './AsyncQueue';
import {LevelChestCfg} from './LevelChestCfg';
import { MgrUser } from './MgrUser';
import { ITEM, GameConst } from './GameConst';
import { MgrDetail } from './MgrDetail';
import { MgrLevelChest } from './MgrLevelChest';
import {AudioPlayer} from './AudioPlayer';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { MgrSkin } from './MgrSkin';
import { SkinBreviaryPath } from './Const';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { SdkBridge } from './SdkBridge';
import {NativeBridge} from './NativeBridge';
import {NotificationMgr} from './NotificationMgr';
import { GlobalEvent } from './Events';
import { MgrRace } from './MgrRace';
import { HardLevelCfg } from './HardLevelCfg'; // placeholder for module mapped to acl in original (kept for compatibility)
import { MgrWinStreak } from './MgrWinStreak';
import { StreakBtn } from './StreakBtn';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { StreakBtnV2 } from './StreakBtnV2';
import { RaceBtn } from './RaceBtn';
import { ToyRaceMenu } from './ToyRaceMenu';
import { BonusWandMenu } from './BonusWandMenu';
import { MgrMine } from './MgrMine';
import { MineMenu } from './MineMenu';
import { SocialManager, SocialMgr } from './SocialManager';
import { channelManager, ChannelType } from './ChannelManager';
import { FbInstantSdkWrapper } from './FbInstantSdkWrapper';
import { MgrBattleLevel } from './MgrBattleLevel';
import { InviteReportPoint } from './ReportEventEnum';
import {GameAudios} from "./Prefabs";

const { ccclass, property } = _decorator;

@ccclass('GameVictory')
export class GameVictory extends Component {
    @property(Label)
    public completeLevel: Label | null = null;

    @property(Node)
    public wisdomNode: Node | null = null;

    @property(Node)
    public wisdomShain: Node | null = null;

    @property(Label)
    public wisdomLabel: Label | null = null;

    @property(Node)
    public progressNode: Node | null = null;

    @property(Label)
    public progressLabel: Label | null = null;

    @property(ProgressBar)
    public progress: ProgressBar | null = null;

    @property(Node)
    public giftNode: Node | null = null;

    @property(Node)
    public skinNode: Node | null = null;

    @property(ProgressBar)
    public skinProgress: ProgressBar | null = null;

    @property(Label)
    public skinProgressLabel: Label | null = null;

    @property(Sprite)
    public skinIcon: Sprite | null = null;

    @property(Label)
    public nextLevel: Label | null = null;

    @property(Button)
    public btnLevel: Button | null = null;

    @property(Node)
    public raceMustNode: Node | null = null;

    @property(Node)
    public hardTipNode: Node | null = null;

    @property(Node)
    public bounsTipNode: Node | null = null;

    @property(Node)
    public battleTipNode: Node | null = null;

    @property(Node)
    public battleTip1: Node | null = null;

    @property(Node)
    public battleTip2: Node | null = null;

    @property(sp.Skeleton)
    public eft: sp.Skeleton | null = null;

    public level: number | undefined;
    public getGoldCube: number = 0;
    public attachs: any;
    private _playQueus: AsyncQueue = new AsyncQueue();

    public reuse(data: { level: number, goldCube?: number, attachs?: any }) {
        this.level = data.level;
        this.getGoldCube = data.goldCube || 0;
        this.attachs = data.attachs;
    }

    onLoad() {
        this.btnLevel?.node.on('click', this.onClickLevel, this);
    }

    onEnable() {
        director.on(VIEW_ANIM_EVENT.CHANGE, this.showLabel, this);
        director.on(GlobalEvent.SettementRaceTurn, this.refreshRaceMustNode, this);
        director.on(GlobalEvent.changeRaceState, this.refreshRaceMustNode, this);
        director.on(GlobalEvent.MinePlayGame, this._onMinePlayGame, this);

        this.showLabel();
        if (this.btnLevel) this.btnLevel.interactable = false;
        this.play();
        MgrDetail.Instance.data.addPlayTime();
        AudioPlayer.Instance.playEffect(GameAudios.Win.url);
    }

    onDisable() {
        director.targetOff(this);
    }

    showLabel() {
        if (!this.level) return;
        const levelStr = this.level.toString();
        if (this.nextLevel) this.nextLevel.string = Language.Instance.getLangByID('Language1').replace('{0}', levelStr);
        if (this.completeLevel) this.completeLevel.string = Language.Instance.getLangByID('Language2').replace('{0}', levelStr);
    }

    play() {
        // set initial states
        if (!this.level) return;
        this.completeLevel!.node.scale = Vec3.ZERO;
        this.wisdomNode!.scale = Vec3.ZERO;
        this.wisdomShain!.scale = Vec3.ZERO;
        this.progressNode!.scale = Vec3.ZERO;
        this.btnLevel!.node.scale = Vec3.ZERO;
        this.progressLabel!.node.active = true;
        this.progress!.node.parent!.active = true;
        this.skinNode!.scale = Vec3.ZERO;
        this.giftNode!.active = true;
        this.giftNode!.position = new Vec3(190, 0, 0); // 0xbe = 190
        this.giftNode!.scale = Vec3.ONE;

        // show tournament (async but fire-and-forget)
        this.showTournament();

        // facebook shortcut attempt
        if (this.level % 2 !== 0 && this.level >= 3 && channelManager.getChannelType() === ChannelType.FaceBook) {
            FbInstantSdkWrapper.getInstance().createShortcutAsync();
        }

        // chest logic
        const chestNew = this.level > MgrLevelChest.Instance.data.chestLv;
        MgrLevelChest.Instance.data.setChestLv(this.level);
        this.progressNode!.active = chestNew;
        if (!chestNew) {
            MgrGame.Instance.wisdom = 0;
        }

        const skinProgressInfo = chestNew ? MgrSkin.Instance.getLevelUnlockProgress(this.level - 1) : null;
        this.skinNode!.active = !!skinProgressInfo;
        this.btnLevel!.node.setPosition(new Vec3(0, skinProgressInfo ? -390 : -300, 0)); // -0x186 = -390, -0x12c = -300

        const cfg = LevelChestCfg.Instance.getCfgsByLevel(this.level);
        const idx = cfg.idx === 0 ? cfg.gap - 1 : cfg.idx - 1;
        const nextIdx = cfg.idx === 0 ? cfg.gap : cfg.idx;

        // prepare queue
        this._playQueus.clear();

        // show complete level animation
        this._playQueus.push((done: Function) => {
            tween(this.completeLevel!.node).to(0.3, { scale: Vec3.ONE }, { easing: easing.backOut }).call(() => done()).start();
        });

        // set wisdom label
        this.wisdomLabel!.string = '' + (MgrUser.Instance.userData.getItem(ITEM.Wisdom) || 0);
        const finalWisdom = (MgrUser.Instance.userData.getItem(ITEM.Wisdom) || 0) + MgrGame.Instance.wisdom;

        // wisdom node pop
        this._playQueus.push((done: Function) => {
            tween(this.wisdomNode!).to(0.3, { scale: new Vec3(1.3, 1.3, 1.3) }).to(0.1, { scale: Vec3.ONE }).call(() => done()).start();
        });

        // progress label and bar
        this.progressLabel!.string = idx + ' / ' + cfg.gap;
        this.progress!.progress = idx / cfg.gap;

        if (chestNew) {
            this._playQueus.push((done: Function) => {
                tween(this.progressNode!).to(0.3, { scale: new Vec3(1.5, 1.5, 1.5) }).to(0.1, { scale: Vec3.ONE }).call(() => done()).start();
            });
        }

        if (skinProgressInfo) {
            this.showSkinIcon(skinProgressInfo.icon);
            const price = skinProgressInfo.price;
            const cur = this.level - 1 < 0 ? 0 : this.level - 1;
            this.skinProgress!.progress = cur / price;
            this.skinProgressLabel!.string = cur + ' / ' + price;
            this._playQueus.push((done: Function) => {
                tween(this.skinNode!).to(0.3, { scale: new Vec3(1.5, 1.5, 1.5) }).to(0.1, { scale: Vec3.ONE }).call(() => done()).start();
            });
        }

        // complex queue of wisdom increment, chest open, skin unlock etc.
        this._playQueus.push((outerDone: Function) => {
            const seq = new AsyncQueue();

            seq.push((innerDone: Function) => {
                tween(this.wisdomNode!).to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) }).call(() => {
                    this.wisdomShain!.scale = new Vec3(1.7, 1.7, 1.7);
                    tween(this.wisdomShain!).by(1, { angle: -30 }).repeatForever().start();
                    innerDone();
                }).start();
            });

            seq.push((innerDone: Function) => {
                const addCount = MgrGame.Instance.wisdom;
                tween(this.wisdomLabel!).delay(0.03).call(() => {
                    this.wisdomLabel!.string = '' + (Number(this.wisdomLabel!.string) + 1);
                }).union().repeat(addCount).call(() => {
                    this.wisdomLabel!.string = '' + finalWisdom;
                    MgrUser.Instance.userData.addItem(ITEM.Wisdom, MgrGame.Instance.wisdom, { type: 'Victory' });
                    MgrStar.Instance.addStar(MgrGame.Instance.wisdom);
                    innerDone();
                }).start();
            });

            if (chestNew) {
                seq.push((innerDone: Function) => {
                    tween(this.progress!).call(() => {
                        this.progressLabel!.string = nextIdx + ' / ' + cfg.gap;
                    }).to(0.4, { progress: nextIdx / cfg.gap }).call(() => innerDone()).start();
                });

                if (nextIdx >= cfg.gap) {
                    seq.push((innerDone: Function) => {
                        this.progressLabel!.node.active = false;
                        this.progress!.node.parent!.active = false;
                        tween(this.giftNode!).to(0.6, { position: Vec3.ZERO, scale: v3(1.5, 1.5, 1.5) }).delay(0.1).call(() => {
                            AudioPlayer.Instance.playEffect(GameAudios.OpenBox.url);
                            this.giftNode!.active = false;
                            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.CommonDoubleView, {
                                root: MgrUi.root(2),
                                data: {
                                    reward: cfg.cfg.reward,
                                    adType: 'AdLevelChest',
                                    getSource: 'LevelChest'
                                },
                                callback: (view: any) => {
                                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                                        innerDone();
                                    });
                                }
                            });
                        }).start();
                    });
                }
            }

            if (skinProgressInfo) {
                const price = skinProgressInfo.price;
                seq.push((innerDone: Function) => {
                    tween(this.skinProgress!).to(0.4, { progress: this.level / price }).call(() => {
                        this.skinProgressLabel!.string = this.level + ' / ' + price;
                        if (this.level === price) {
                            MgrSkin.Instance.unlock(skinProgressInfo.id);
                            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.UISkinUnlock, {
                                root: MgrUi.root(2),
                                data: skinProgressInfo,
                                callback: (view: any) => {
                                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                                        innerDone();
                                    });
                                }
                            });
                        } else {
                            innerDone();
                        }
                    }).start();
                });
            }

            seq.complete = () => {
                outerDone();
            };

            seq.play();
        });

        // btn animation and set next level text
        this._playQueus.push((done: Function) => {
            tween(this.btnLevel!.node).to(0.12, { scale: Vec3.ONE }, { easing: easing.backOut }).call(() => {
                this.eft?.setAnimation(0, 'pass_btn', false);
                console.log('播放特效');
            }).delay(0.3).to(0.2, { scale: v3(1.3, 1.3, 1.3) }, { easing: easing.sineOut }).call(() => {
                this.nextLevel!.string = Language.Instance.getLangByID('Language1').replace('{0}', (this.level! + 1).toString());
            }).to(0.2, { scale: Vec3.ONE }).call(() => done()).start();
        });

        // show top UI and enable button
        this._playQueus.push((done: Function) => {
            AppGame.topUI.setShowGoldCubeCnt(this.getGoldCube);
            AppGame.topUI.setShowFlyCoins(this.attachs ? (this.attachs[ITEM.TileCoin] || 0) : 0);
            AppGame.topUI.showMain(false);
            this.btnLevel!.interactable = true;
            this.scheduleOnce(() => done(), 0.5);
        });

        // various checks and potential auto pop handling
        this._playQueus.push((done: Function) => {
            const maxLv = MgrGame.Instance.gameData.maxLv;
            const mineOpen = MgrMine.Instance.isOpen();
            const mineFinish = MgrMine.Instance.isFinish();
            if (mineOpen && !mineFinish) AppGame.topUI.mineBtn.getComponent(MineMenu).showMineLabel();

            const streakOpen = maxLv >= GameConst.WINSTREAK_OPEN_LEVEL && MgrWinStreak.Instance.checkInWinStreak();
            if (streakOpen) AppGame.topUI.streakBtn.getComponent(StreakBtn).showStreakLabel();

            const streakV2Open = maxLv >= GameConst.WINSTREAK_V2_OPEN_LEVEL && MgrWinStreakV2.Instance.checkInWinStreak();
            if (streakV2Open) AppGame.topUI.streakBtnV2.getComponent(StreakBtnV2).showStreakLabel();

            const raceLabelShown = AppGame.topUI.raceBtn.getComponent(RaceBtn).showLabel();
            const toyRaceProgress = ToyRaceMenu.Ins.playProgress();
            const bonusWandProgress = BonusWandMenu.Ins.playProgress();

            if (streakOpen || streakV2Open || raceLabelShown || toyRaceProgress || bonusWandProgress) {
                AppGame.Ins.openBlack();
                this.scheduleOnce(() => {
                    AppGame.Ins.closeBlack();
                    done();
                }, 1.3);
            } else {
                done();
            }
        });

        // star league pop check
        if (MgrStar.Instance.checkWinPop()) {
            this._playQueus.push((done: Function) => {
                if (MgrStar.Instance.checkJoinCurPeriod()) {
                    MgrStar.Instance.resetPrevStar();
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueView, {
                        root: MgrUi.root(1),
                        data: { hideCall: done }
                    });
                } else {
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.StarEagueStartView, {
                        data: { hideCall: done }
                    });
                }
            });
        }

        // try other pops
        this._playQueus.push((done: Function) => {
            MgrToyRace.Instance.tryHomePopViews(done);
        });

        // set complete handler for play queue
        this._playQueus.complete = () => {
            director.once(GlobalEvent.GameAutoPopComplete, () => {
                director.emit(GlobalEvent.GameSettleComplete);
                this.checkAppReview();
                AppGame.Ins.checkNetwork();
            });
            AppGame.Ins.autoRewardAndGuide(false);
        };

        // hard tip node visibility
        const hardOpen = HardLevelCfg.Instance.get(this.level + 1) ? true : false;
        if (this.hardTipNode) this.hardTipNode.active = hardOpen;
        this.bounsTipNode!.active = false;

        // race must node
        const raceMustNext = MgrRace.Instance.isRaceMust(this.level + 1);
        const raceOpen = MgrRace.Instance.checkRaceOpen();
        const raceMustActive = raceMustNext && raceOpen;
        if (this.raceMustNode) this.raceMustNode.active = raceMustActive;

        if (MgrBattleLevel.Instance.checkIsBattleLevel(this.level + 1)) {
            this.battleTipNode!.active = true;
            this.battleTip1!.active = !hardOpen;
            this.battleTip2!.active = hardOpen;
        } else {
            this.battleTipNode!.active = false;
        }

        this._playQueus.play();
    }

    private showTournament = (async () => {
        return new Promise<void>(async (resolve) => {
            const curLv = MgrGame.Instance.gameData.curLv;
            const interval = GameConst.RankingListIntervalLevel + 1;
            const inBetween = (curLv - GameConst.RankingListOpenLevel) % interval !== 0;
            if (curLv >= GameConst.RankingListOpenLevel) {
                if (inBetween) {
                    const tournament = await SdkBridge.getTournamentAsync();
                    if (tournament != null) {
                        SdkBridge.tournamentShareAsync(MgrGame.Instance.gameData.curLv - 1, { test: 0x457 })
                            .then(() => resolve())
                            .catch(() => resolve());
                    } else {
                        SdkBridge.createTournamentAsync(MgrGame.Instance.gameData.curLv - 1)
                            .then(() => resolve())
                            .catch(() => resolve());
                    }
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        });
    });

    onClickLevel = (async () => {
        if (!this.level) return;
        const doEnterNext = () => {
            AppGame.topUI.lightningItem.hide();
            this.node.emit(VIEW_ANIM_EVENT.Close);
            MgrGame.Instance.enterNextLevel();
            NativeBridge.Instance.showInterstitialIfCooldown({ OpenUi: 'MainLevel' });
            Tween.stopAllByTarget(this.wisdomShain);
        };

        const curLv = MgrGame.Instance.gameData.curLv;
        if (MgrBattleLevel.Instance.checkIsBattleLevel(curLv)) {
            doEnterNext();
            return;
        }

        const friendCondition = (curLv - GameConst.FriendListOpenLevel) % (GameConst.FriendListIntervalLevel + 1) !== 0;
        if (curLv > GameConst.FriendListOpenLevel && friendCondition) {
            if (SocialManager.shareNums % 2 === 0) {
                await SocialMgr.showShcialPop(async () => {
                    doEnterNext();
                });
            } else {
                await SocialMgr.showSocialList(async () => {
                    doEnterNext();
                }, null, InviteReportPoint.LevelStart);
            }
        } else {
            doEnterNext();
        }
    });

    showSkinIcon = (async (icon: string) => {
        const sprite = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, SkinBreviaryPath + icon);
        this.skinIcon!.spriteFrame = sprite;
    });

    checkAppReview() {
        if (MgrGame.Instance.gameData.curLv === MgrGame.Instance.gameData.maxLv) {
            if (this.level === GameConst.Evaluation_OPEN_LEVEL) {
                if (sys.platform === sys.Platform.ANDROID) {
                    const sdk = SdkBridge.getSdkWrapper();
                    sdk && sdk.appRevive();
                }
            } else {
                NotificationMgr.Instance.guideNotificationPermission();
            }
        }
    }

    refreshRaceMustNode() {
        const must = MgrRace.Instance.isRaceMust((this.level || 0) + 1);
        const open = MgrRace.Instance.checkRaceOpen();
        if (this.raceMustNode) this.raceMustNode.active = must && open;
    }

    _onMinePlayGame() {
        this.node.emit(VIEW_ANIM_EVENT.Close);
        Tween.stopAllByTarget(this.wisdomShain);
    }
}
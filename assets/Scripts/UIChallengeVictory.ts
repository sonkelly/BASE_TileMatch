import { _decorator, Sprite, Label, Node, Button, sp, director, Vec3, tween, easing, Component } from 'cc';
import { GameAudios, UIPrefabs } from './Prefabs';
import {AudioPlayer} from './AudioPlayer';
import { MgrChallenge } from './MgrChallenge';
import { ITEM, GameConst } from './GameConst';
import { MgrStar } from './MgrStar';
import { MgrUser } from './MgrUser';
import { MgrGame } from './MgrGame';
import { AsyncQueue } from './AsyncQueue';
import { AppGame } from './AppGame';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {MgrUi} from './MgrUi';
import { AdsManager } from './AdsManager';
import { MgrChallengeStorage } from './MgrChallengeStorage';
import { MgrTask } from './MgrTask';
import { Challenge_Multiplex, TASK_TYPE, BgPath } from './Const';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { LanguageEvent, Language } from './Language';
import { AdsMultiplex } from './AdsMultiplex';
import {Toast} from './Toast';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass, property } = _decorator;

enum UIState {
    Init = 0,
    Delay = 1,
    Contiune = 2,
    Main = 3
}

@ccclass('UIChallengeVictory')
export class UIChallengeVictory extends Component {
    @property(Sprite)
    bgSprite: Sprite = null!;

    @property(Label)
    completeLabel: Label = null!;

    @property(Label)
    dateLabel: Label = null!;

    @property(Node)
    wisdomNode: Node = null!;

    @property(Node)
    wisdomShain: Node = null!;

    @property(Label)
    wisdomLabel: Label = null!;

    @property(Node)
    gameStarNode: Node = null!;

    @property(Label)
    gameStarLabel: Label = null!;

    @property(Node)
    multiplexNode: Node = null!;

    @property(AdsMultiplex)
    multiplex: AdsMultiplex = null!;

    @property(Button)
    multiplexBtn: Button = null!;

    @property(Label)
    multiplexLabel: Label = null!;

    @property(Button)
    continueBtn: Button = null!;

    @property(sp.Skeleton)
    eft: sp.Skeleton = null!;

    private _playQueus: AsyncQueue = new AsyncQueue();
    private getGoldCube: number = 0;
    private attachs: any = {};
    private _step: UIState = UIState.Init;

    reuse(data: any) {
        this.getGoldCube = data.goldCube;
        this.attachs = data.attachs;
    }

    getStarCount(): number {
        return this.attachs[ITEM.Star] || 0;
    }

    onLoad() {
        this.continueBtn.node.on('click', this.onContinue, this);
        this.multiplexBtn.node.on('click', this.onMultiplex, this);
        this.showBg();
        this.multiplex.initMultipeList(Challenge_Multiplex);
    }

    async showBg() {
        this.bgSprite.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, BgPath + 'bg' + GameConst.CHALLENGE_BG_ID);
    }

    onEnable() {
        director.on(LanguageEvent.CHANGE, this.showLabel, this);
        this.continueBtn.interactable = false;
        this.showLabel();
        this.play();
        this.onMultiplexEnable();
        AudioPlayer.Instance.playEffect(GameAudios.Win.url);
    }

    onDisable() {
        this.onMultiplexDisable();
        director.targetOff(this);
        this.unscheduleAllCallbacks();
    }

    showLabel() {
        const curTime = MgrChallenge.Instance.curTime;
        const month = Language.Instance.getLangByID('Month' + (curTime.month() + 1));
        this.dateLabel.string = month + ' ' + curTime.format('D.YYYY');
    }

    play() {
        this.completeLabel.node.scale = Vec3.ZERO;
        this.dateLabel.node.scale = Vec3.ZERO;
        this.wisdomNode.scale = Vec3.ZERO;
        this.wisdomShain.scale = Vec3.ZERO;
        this.gameStarNode.scale = Vec3.ZERO;
        this.multiplexNode.scale = Vec3.ZERO;
        this.multiplexBtn.node.scale = Vec3.ZERO;
        this.continueBtn.node.scale = Vec3.ZERO;

        let wisdom = MgrUser.Instance.userData.getItem(ITEM.Wisdom) || 0;
        this.wisdomLabel.string = '' + wisdom;

        const today = moment(MgrChallenge.Instance.curTime).startOf('day').valueOf();
        const isFirstWin = MgrChallengeStorage.Instance.getData(today).winTime === 1;
        const finalWisdom = isFirstWin ? wisdom + MgrGame.Instance.wisdom : wisdom;

        if (isFirstWin) {
            MgrTask.Instance.data.addTaskData(TASK_TYPE.DAILY_CHALLENGE, 1);
        }

        const starCount = this.getStarCount();
        MgrUser.Instance.userData.addMemItem(ITEM.Star, starCount);
        MgrChallengeStorage.Instance.addStarCount(MgrChallenge.Instance.curTime, starCount);
        this.gameStarLabel.string = 'x' + starCount;
        AppGame.topUI.setShowGoldCubeCnt(this.getGoldCube);

        this._step = UIState.Init;
        this._playQueus.clear();
        this._playQueus.enable = true;

        this._playQueus.push((next) => {
            tween(this.completeLabel.node)
                .to(0.2, { scale: new Vec3(1.3, 1.3, 1.3) })
                .to(0.1, { scale: Vec3.ONE })
                .call(next)
                .start();
        });

        this._playQueus.push((next) => {
            tween(this.dateLabel.node)
                .to(0.2, { scale: new Vec3(1.3, 1.3, 1.3) })
                .to(0.1, { scale: Vec3.ONE })
                .call(next)
                .start();
        });

        this._playQueus.push((next) => {
            tween(this.wisdomNode)
                .to(0.3, { scale: new Vec3(1.3, 1.3, 1.3) })
                .to(0.1, { scale: Vec3.ONE })
                .call(next)
                .start();
        });

        this._playQueus.push((next) => {
            const queue = new AsyncQueue();
            queue.push((innerNext) => {
                tween(this.wisdomNode)
                    .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                    .call(() => {
                        this.wisdomShain.scale = new Vec3(1.7, 1.7, 1.7);
                        tween(this.wisdomShain)
                            .by(1, { angle: -30 })
                            .repeatForever()
                            .start();
                        innerNext();
                    })
                    .start();
            });

            if (isFirstWin) {
                queue.push((innerNext) => {
                    const wisdomGain = MgrGame.Instance.wisdom;
                    tween(this.wisdomLabel)
                        .delay(0.03)
                        .call(() => {
                            this.wisdomLabel.string = '' + (Number(this.wisdomLabel.string) + 1);
                        })
                        .union()
                        .repeat(wisdomGain)
                        .call(() => {
                            this.wisdomLabel.string = '' + finalWisdom;
                            MgrUser.Instance.userData.addItem(ITEM.Wisdom, MgrGame.Instance.wisdom, { type: 'ChallengeVictory' });
                            MgrStar.Instance.addStar(MgrGame.Instance.wisdom);
                            innerNext();
                        })
                        .start();
                });
            }

            queue.complete = next;
            queue.play();
        });

        this._playQueus.push((next) => {
            tween(this.gameStarNode)
                .delay(0.2)
                .to(0.2, { scale: Vec3.ONE }, { easing: easing.backOut })
                .call(next)
                .start();
        });

        this._playQueus.push((next) => {
            tween(this.multiplexNode)
                .to(0.2, { scale: Vec3.ONE }, { easing: easing.backOut })
                .call(next)
                .start();
        });

        this._playQueus.push((next) => {
            this.multiplexBtn.interactable = true;
            tween(this.multiplexBtn.node)
                .delay(0.2)
                .to(0.2, { scale: Vec3.ONE }, { easing: easing.backOut })
                .to(0.1, { scale: new Vec3(1.3, 1.3, 1.3) }, { easing: easing.sineOut })
                .to(0.2, { scale: Vec3.ONE })
                .call(next)
                .start();
        });

        this._playQueus.push((next) => {
            this._step = UIState.Delay;
            this.scheduleOnce(next, GameConst.AdNext_Delay_Time);
        });

        this._playQueus.push((next) => {
            this._step = UIState.Contiune;
            tween(this.continueBtn.node)
                .to(0.2, { scale: Vec3.ONE }, { easing: easing.backOut })
                .call(() => {
                    this.eft.setAnimation(0, 'pass_btn', false);
                })
                .delay(0.3)
                .to(0.2, { scale: new Vec3(1.3, 1.3, 1.3) }, { easing: easing.sineOut })
                .to(0.2, { scale: Vec3.ONE })
                .call(next)
                .start();
        });

        this._playQueus.complete = () => {
            this._playQueusComplete();
        };
        this._playQueus.play();
    }

    _playQueusComplete() {
        if (this._step !== UIState.Main) {
            this._step = UIState.Main;
            AppGame.topUI.showMain();
            AppGame.Ins.closeBlack();
            this.continueBtn.interactable = true;
        }
    }

    async onContinue() {
        AppGame.topUI.lightningItem.hide();
        this.node.getComponent(ViewAnimCtrl).onClose();
        await MgrUi.Instance.openViewAsync(UIPrefabs.ChallengeView, {
            root: MgrUi.root(1),
            callback: (view) => {
                AppGame.Ins.closeBlack();
            }
        });
    }

    onMultiplex() {
        this.onMultiplexDisable();
        this._playQueus.enable = false;
        AppGame.Ins.openBlack();
        this.scheduleOnce(() => {
            AdsManager.getInstance().showRewardedVideo({
                OpenUi: 'AdMultiplex',
                AdsType: 'AdChanllengeStar',
                onSucceed: () => {
                    this.onMultiplexSuccess();
                },
                onBegin: () => {},
                onCancel: () => {
                    this.onMultiplexEnable();
                    AppGame.Ins.closeBlack();
                    this._playQueus.enable = true;
                    this._playQueusComplete();
                },
                onFail: () => {
                    this.onMultiplexEnable();
                    AppGame.Ins.closeBlack();
                    this._playQueus.enable = true;
                    this._playQueusComplete();
                    Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
                }
            });
        }, 0.5);
    }

    onMultiplexSuccess() {
        const multiple = this.multiplex.getMultipe();
        const starGain = this.getStarCount() * (multiple - 1);
        MgrUser.Instance.userData.addMemItem(ITEM.Star, starGain);
        MgrChallengeStorage.Instance.addStarCount(MgrChallenge.Instance.curTime, starGain);
        this.multiplexBtn.interactable = false;

        switch (this._step) {
            case UIState.Delay:
            case UIState.Contiune:
                this.playComplete();
                break;
            case UIState.Main:
                this.onContinue();
        }
    }

    playComplete() {
        if (this.getGoldCube > 0) {
            this._playQueus.clear();
            this._playQueus.enable = true;
            this._playQueus.push((next) => {
                AppGame.topUI.showMain();
                this.continueBtn.interactable = true;
                let delay = 0.5;
                if (this.getGoldCube > 0) {
                    delay += 0.1 * this.getGoldCube + 0.64;
                }
                this.scheduleOnce(next, delay);
            });
            this._playQueus.complete = () => {
                this.onContinue();
            };
            this._playQueus.play();
        } else {
            this.onContinue();
        }
    }

    onMultiplexEnable() {
        this.fixUpdate();
        this.schedule(this.fixUpdate, 0.02);
        this.multiplex.onMultipeMove();
    }

    onMultiplexDisable() {
        this.unschedule(this.fixUpdate);
        this.fixUpdate();
        this.multiplex.stopMultipe();
    }

    fixUpdate() {
        const starCount = this.getStarCount();
        const multiple = this.multiplex.getMultipe();
        this.multiplexLabel.string = '+' + multiple * starCount;
    }
}
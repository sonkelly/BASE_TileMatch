import { _decorator, Component, Node, Sprite, SpriteFrame, Button, Tween, UIOpacity, tween, Vec3, easing, sp, v3 } from 'cc';
import { ITEM } from './GameConst';
import { OptionItem } from './OptionItem';
import { Toast } from './Toast';
import { Language } from './Language';
import { MgrGame } from './MgrGame';
import { GuidesViews, GamePrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';
import { GuidePos, GuideType } from './WeakGuide';
import { AssetPool } from './AssetPool';
import { AsyncQueue } from './AsyncQueue';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrBonusWand } from './MgrBonusWand';
import { BonusWandStatus } from './BonusWandData';
import { AppGame } from './AppGame';

const { ccclass, property } = _decorator;

@ccclass('GameOption')
export class GameOption extends Component {
    @property(OptionItem)
    btnUndo: OptionItem = null!;

    @property(OptionItem)
    btnWand: OptionItem = null!;

    @property(Sprite)
    wandSuperSprite: Sprite = null!;

    @property(SpriteFrame)
    wandSuperSpriteFrame: SpriteFrame = null!;

    @property(OptionItem)
    btnShuffle: OptionItem = null!;

    @property(Button)
    btnAuto: Button = null!;

    delegate: any = null;
    wandOriginSpriteFrame: SpriteFrame = null!;
    wandAnimAsync: AsyncQueue = new AsyncQueue();

    onLoad() {
        this.btnUndo.node.on('click', this.onClickUndo, this);
        this.btnWand.node.on('click', this.onClickWand, this);
        this.btnShuffle.node.on('click', this.onClickShuffle, this);
        this.btnAuto.node.on('click', this.onClickAuto, this);
        this.wandOriginSpriteFrame = this.wandSuperSprite.spriteFrame!;
    }

    getOption(type: ITEM): OptionItem {
        switch (type) {
            case ITEM.Back:
                return this.btnUndo;
            case ITEM.Hint:
                return this.btnWand;
            case ITEM.Fresh:
                return this.btnShuffle;
        }
    }

    guide(type: ITEM, data: any) {
        const option = this.getOption(type);
        if (option) {
            const guideId = data.guideId;
            const desc = data.desc;
            MgrUi.Instance.openViewAsync(GuidesViews.PropGuide, {
                priority: 2,
                data: {
                    node: option.node,
                    click: () => {
                        switch (type) {
                            case ITEM.Back:
                                this.onClickUndo();
                                break;
                            case ITEM.Hint:
                                this.onClickWand();
                                break;
                            case ITEM.Fresh:
                                this.onClickShuffle();
                        }
                    },
                    close: () => {
                        MgrGame.Instance.gameData.setGuided(guideId);
                        this.delegate.onGuideComplete();
                    },
                    pos: GuidePos.Top,
                    boxDistance: 120,
                    lang: desc,
                    type: GuideType.Touch,
                    touchPos: GuidePos.Top,
                    blockTouch: true
                }
            });
        }
    }

    playEnter() {
        const wandStatus = MgrBonusWand.Instance.status;
        if (AppGame.gameCtrl.curLogic.isSupportWand() && wandStatus === BonusWandStatus.Active && MgrBonusWand.Instance.activeBonus) {
            this.wandSuperSprite.spriteFrame = this.wandSuperSpriteFrame;
        } else {
            this.wandSuperSprite.spriteFrame = this.wandOriginSpriteFrame;
        }

        const duration = 0.3;
        this.freshOptions();
        let delay = 0;

        this._playShow(this.btnUndo.node, duration, delay);
        delay += duration;
        this._playShow(this.btnWand.node, duration, delay);
        delay += duration;
        this._playShow(this.btnShuffle.node, duration, delay);
        this.btnAuto.node.parent!.active = false;
    }

    playExit() {
        const duration = 0.3;
        const delay = 0.3;

        if (this.btnUndo.node.active) {
            this._playHide(this.btnUndo.node, duration, delay);
        }
        if (this.btnWand.node.active) {
            this._playHide(this.btnWand.node, duration, delay);
        }
        if (this.btnShuffle.node.active) {
            this._playHide(this.btnShuffle.node, duration, delay);
        }
        if (this.btnAuto.node.parent!.active) {
            this._playHide(this.btnAuto.node.parent!, duration, delay);
        }
    }

    freshOptions() {
        this.btnUndo.fresh();
        this.btnWand.fresh();
        this.btnShuffle.fresh();
    }

    _playHide(node: Node, duration: number, delay: number = 0) {
        Tween.stopAllByTarget(node);
        const opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacityComp);

        tween(opacityComp)
            .delay(delay + 0.2 * duration)
            .to(0.8 * duration, { opacity: 0 })
            .start();

        tween(node)
            .delay(delay)
            .to(duration, { scale: Vec3.ZERO }, { easing: easing.backIn })
            .call(() => { node.active = false; })
            .start();
    }

    _playShow(node: Node, duration: number, delay: number = 0) {
        Tween.stopAllByTarget(node);
        node.active = true;
        node.scale = Vec3.ZERO;

        const opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacityComp);

        tween(opacityComp)
            .delay(delay + 0.2 * duration)
            .to(0.8 * duration, { opacity: 255 })
            .start();

        tween(node)
            .delay(delay)
            .to(duration, { scale: Vec3.ONE }, { easing: easing.sineIn })
            .start();
    }

    playShowAuto() {
        if (!this.btnAuto.node.parent!.active) {
            const duration = 0.3;
            this._playHide(this.btnShuffle.node, duration);
            this._playHide(this.btnUndo.node, duration);
            this._playHide(this.btnWand.node, duration);
            this.btnAuto.interactable = true;
            this._playShow(this.btnAuto.node.parent!, duration, 0.3);
        }
    }

    playHideAuto() {
        this.btnAuto.interactable = false;
        const node = this.btnAuto.node.parent!;
        const opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacityComp);

        tween(opacityComp)
            .delay(0.06)
            .to(0.24, { opacity: 0 })
            .start();

        tween(node)
            .to(0.3, { scale: Vec3.ZERO }, { easing: easing.smooth })
            .call(() => { node.active = false; })
            .start();
    }

    onClickUndo() {
        if (this.delegate.optionEnable) {
            if (this.delegate.getCollectedCount() <= 0) {
                Toast.tip(Language.Instance.getLangByID('back_tip'));
            } else {
                this.btnUndo.onClickHandel(() => {
                    this.delegate.undo();
                });
            }
        }
    }

    onClickWand() {
        if (this.delegate.optionEnable) {
            this.btnWand.onClickHandel(() => {
                this.delegate.wand();
            });
        }
    }

    onClickShuffle() {
        if (this.delegate.optionEnable) {
            this.btnShuffle.onClickHandel(() => {
                this.delegate.shuffle();
            });
        }
    }

    onClickAuto() {
        this.delegate.autoComplete();
    }

    refreshStatus() {
        this.refreshStatusUndo();
    }

    refreshStatusUndo() {
        const opacityComp = this.btnUndo.getComponent(UIOpacity)!;
        opacityComp.opacity = this.delegate.getCollectedCount() > 0 ? 255 : 100;
    }

    onEnable() {
        this.wandSuperSprite.spriteFrame = this.wandOriginSpriteFrame;
    }

    setWandSuper(enable: boolean) {
        this.wandSuperSprite.spriteFrame = enable ? this.wandSuperSpriteFrame : this.wandOriginSpriteFrame;
    }

    playWandSuper(callback: Function) {
        this.wandAnimAsync.clear();
        
        this.wandAnimAsync.push((next: Function) => {
            this.scheduleOnce(next, 0.2);
        });

        this.wandAnimAsync.push((next: Function) => {
            const effect = AssetPool.Instance.createObject(GamePrefabs.WandEliminateOpen.url);
            effect.parent = MgrUi.root(1);
            effect.position = Vec3.ZERO;

            const skeleton = effect.getComponentInChildren(sp.Skeleton);
            skeleton.setAnimation(0, 'notice_max', false);
            skeleton.timeScale = 1.2;
            skeleton.node.worldPosition = this.btnWand.node.worldPosition;
            skeleton.setCompleteListener(() => {
                skeleton.setCompleteListener(null);
                AssetPool.Instance.put(effect);
            });

            this.scheduleOnce(() => {
                effect.emit(VIEW_ANIM_EVENT.Close);
            }, 1);

            this.scheduleOnce(() => {
                next();
            }, 1.25);
        });

        this.wandAnimAsync.push((next: Function) => {
            Tween.stopAllByTarget(this.btnWand.node);
            tween(this.btnWand.node)
                .to(0.12, { scale: v3(1.2, 1.2, 1.2) })
                .call(() => {
                    this.wandSuperSprite.spriteFrame = this.wandSuperSpriteFrame;
                })
                .to(0.12, { scale: Vec3.ONE })
                .call(() => {
                    next();
                })
                .start();
        });

        this.wandAnimAsync.complete = callback;
        this.wandAnimAsync.play();
    }
}
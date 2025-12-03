import { _decorator, Component, Node, Sprite, SpriteFrame, Label, ProgressBar, Button, Vec3, Color, Tween, tween, easing } from 'cc';
import { WinStreakCfg } from './WinStreakCfg';
import { MgrWinStreak } from './MgrWinStreak';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';

import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('StreakItem')
export class StreakItem extends Component {
    @property(Sprite)
    lvSprite: Sprite | null = null;

    @property([SpriteFrame])
    lvFrame: SpriteFrame[] = [];

    @property(Label)
    lvLabel: Label | null = null;

    @property(ProgressBar)
    lvProgress: ProgressBar | null = null;

    @property(Node)
    boxNode: Node | null = null;

    @property(Node)
    arrowNode: Node | null = null;

    @property(Button)
    boxBtn: Button | null = null;

    @property(Node)
    box1: Node | null = null;

    @property(Node)
    box2: Node | null = null;

    @property(Node)
    box3: Node | null = null;

    @property(Button)
    earnBtn: Button | null = null;

    @property(Node)
    earnTag: Node | null = null;

    @property(Node)
    lockTag: Node | null = null;

    @property(Node)
    rdNode: Node | null = null;

    private _lv: number | null = null;
    private _cfg: any = null;
    private _showBox: Node | null = null;

    get lv(): number | null {
        return this._lv;
    }

    onLoad() {
        this.boxBtn!.node.on('click', this.onBoxBtn, this);
        this.earnBtn!.node.on('click', this.onBoxBtn, this);
    }

    show(lv: number) {
        this._lv = lv;
        this._cfg = WinStreakCfg.Instance.getCfgByLevel(this._lv);
        this.showItem();
    }

    onDisable() {
        this.boxAnimStop();
    }

    onEnable() {}

    showItem() {
        this.boxAnimStop();
        this.showLv();
        this.showProgress();

        const isUnlock = MgrWinStreak.Instance.getIsUnlock(this._lv!);
        const streakTime = MgrWinStreak.Instance.getStreakTime();
        const isCompleted = streakTime >= this._lv!;

        this.lvSprite!.spriteFrame = isCompleted ? this.lvFrame[0] : this.lvFrame[1];
        this.lvSprite!.node.scale = new Vec3(1, 1, 1);

        if (!this._cfg) {
            this.boxNode!.active = false;
            this.arrowNode!.active = false;
            return;
        }

        this.lvSprite!.node.scale = new Vec3(1.5, 1.5, 1.5);
        this.showBox();
        this.showBoxBtn();

        const isEarn = MgrWinStreak.Instance.getIsEarn(this._cfg.winnum);
        this.boxBtn!.interactable = !isEarn;
        this.earnTag!.active = isEarn;
        this.lockTag!.active = !isUnlock;

        const isGray = isEarn || !isUnlock;
        const grayColor = new Color();

        const arrowSprites = this.arrowNode!.getComponentsInChildren(Sprite);
        each(arrowSprites, (sprite: Sprite) => {
            sprite.color = isGray ? Color.fromHEX(grayColor, '#96969696') : Color.WHITE;
        });

        const boxSprites = this['box' + this._cfg.gift]!.getComponentsInChildren(Sprite);
        each(boxSprites, (sprite: Sprite) => {
            sprite.color = isEarn ? Color.fromHEX(grayColor, '#B4B4B4') : Color.WHITE;
            sprite.grayscale = isEarn;
        });

        this.earnBtn!.node.active = !isEarn && isUnlock;
        this.rdNode!.active = !isEarn && isUnlock;
        this.earnBtnAnim(!isEarn && isUnlock);

        if (!isEarn && isUnlock) {
            this.boxShakeAnim();
        }

        if (!isUnlock) {
            this.boxStaticAnim();
        }
    }

    showBox() {
        const isLeft = this._cfg.id % 2 === 1;
        const boxPos = new Vec3(isLeft ? 225 : -225, 0, 0);
        this.boxNode!.setPosition(boxPos);

        const arrowPos = new Vec3(isLeft ? 85 : -85, 0, 0);
        this.arrowNode!.setPosition(arrowPos);
        this.arrowNode!.scale = new Vec3(isLeft ? 1 : -1, 1, 1);

        this.boxNode!.active = true;
        this.arrowNode!.active = true;
    }

    showBoxBtn() {
        this.box1!.active = false;
        this.box2!.active = false;
        this.box3!.active = false;

        this._showBox = this['box' + this._cfg.gift] as Node;
        this._showBox!.active = true;
    }

    showProgress() {
        const streakTime = MgrWinStreak.Instance.getStreakTime();
        if (streakTime > this._lv!) {
            this.lvProgress!.progress = 1;
        } else if (streakTime === this._lv!) {
            this.lvProgress!.progress = 0.5;
        } else {
            this.lvProgress!.progress = 0;
        }
    }

    onBoxBtn() {
        if (MgrWinStreak.Instance.getIsUnlock(this._cfg.winnum)) {
            this.boxAnimStop();
            MgrUi.Instance.openViewAsync(UIPrefabs.StreakEarnView, {
                priority: 2,
                data: {
                    reward: this._cfg.rewards,
                    cfg: this._cfg,
                    delegate: this
                }
            });
        } else {
            MgrUi.Instance.openViewAsync(UIPrefabs.StreakDetailView, {
                priority: 2,
                data: {
                    reward: this._cfg.rewards,
                    target: this.boxNode
                }
            });
        }
    }

    showClear(duration: number, callback?: Function) {
        Tween.stopAllByTarget(this.lvProgress);
        tween(this.lvProgress)
            .to(duration, { progress: 0 })
            .call(() => {
                this.lvSprite!.spriteFrame = this.lvFrame[1];
                callback && callback();
            })
            .start();
    }

    showLv() {
        this.lvLabel!.string = '' + this._lv;
    }

    boxShakeAnim() {
        const targetBox = this['box' + this._cfg.gift] as Node;
        Tween.stopAllByTarget(targetBox);

        tween(targetBox)
            .to(0.2, { angle: 3, position: new Vec3(-1.5, 3, 0) }, { easing: easing.cubicOut })
            .to(0.2, { angle: 0, position: new Vec3(0, 0, 0) }, { easing: easing.quartIn })
            .to(0.2, { angle: -3, position: new Vec3(1.5, 3, 0) }, { easing: easing.cubicOut })
            .to(0.2, { angle: 0, position: new Vec3(0, 0, 0) }, { easing: easing.quartIn })
            .union()
            .repeatForever()
            .start();
    }

    boxStaticAnim() {
        const targetBox = this['box' + this._cfg.gift] as Node;
        Tween.stopAllByTarget(targetBox);

        tween(targetBox)
            .delay(4)
            .to(0.2, { scale: new Vec3(0.98, 1.04, 1), position: new Vec3(0, 4, 0) })
            .to(0.2, { scale: new Vec3(1.02, 0.98, 1), position: new Vec3(0, -2, 0) })
            .to(0.1, { scale: Vec3.ONE, position: new Vec3(0, 0, 0) })
            .to(0.2, { scale: new Vec3(0.98, 1.04, 1), position: new Vec3(0, 4, 0) })
            .to(0.2, { scale: new Vec3(1.02, 0.98, 1), position: new Vec3(0, -2, 0) })
            .to(0.1, { scale: Vec3.ONE, position: new Vec3(0, 0, 0) })
            .union()
            .repeatForever()
            .start();
    }

    earnBtnAnim(enable: boolean) {
        this.earnBtn!.node.scale = Vec3.ONE;
        Tween.stopAllByTarget(this.earnBtn!.node);

        if (enable) {
            tween(this.earnBtn!.node)
                .to(0.3, { scale: new Vec3(1.1, 1.1, 1.1) })
                .to(0.3, { scale: new Vec3(1, 1, 1) })
                .union()
                .repeatForever()
                .start();
        }
    }

    boxAnimStop() {
        Tween.stopAllByTarget(this.box1!);
        Tween.stopAllByTarget(this.box2!);
        Tween.stopAllByTarget(this.box3!);

        this.box1!.angle = 0;
        this.box2!.angle = 0;
        this.box3!.angle = 0;

        this.box1!.setPosition(Vec3.ZERO);
        this.box2!.setPosition(Vec3.ZERO);
        this.box3!.setPosition(Vec3.ZERO);

        this.box1!.scale = Vec3.ONE;
        this.box2!.scale = Vec3.ONE;
        this.box3!.scale = Vec3.ONE;
    }
}
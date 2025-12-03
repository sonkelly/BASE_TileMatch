import { _decorator, Component, Sprite, SpriteFrame, Label, ProgressBar, Node, Button, Vec3, Color, Tween, tween, easing } from 'cc';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import {each} from 'lodash-es';
import WinStreakV2Cfg from './WinStreakV2Cfg';
import { MgrWinStreakV2 } from './MgrWinStreakV2';

const { ccclass, property } = _decorator;

@ccclass('StreakItemV2')
export class StreakItemV2 extends Component {
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
        this._cfg = WinStreakV2Cfg.Instance.getCfgByLevel(this._lv);
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

        const isUnlock = MgrWinStreakV2.Instance.getIsUnlock(this._lv!);
        const isStreakTime = MgrWinStreakV2.Instance.getStreakTime() >= this._lv!;

        this.lvSprite!.spriteFrame = isStreakTime ? this.lvFrame[0] : this.lvFrame[1];
        this.lvSprite!.node.scale = new Vec3(0.7, 0.7, 0.7);

        if (!this._cfg) {
            this.boxNode!.active = false;
            this.arrowNode!.active = false;
            return;
        }

        this.lvSprite!.node.scale = Vec3.ONE;
        this.showBox();
        this.showBoxBtn();

        const isEarn = MgrWinStreakV2.Instance.getIsEarn(this._cfg.winnum);
        this.boxBtn!.interactable = !isEarn;
        this.earnTag!.active = isEarn;
        this.lockTag!.active = !isUnlock;

        const isGray = isEarn || !isUnlock;
        const color = new Color();
        const arrowSprites = this.arrowNode!.getComponentsInChildren(Sprite);
        each(arrowSprites, (sprite: Sprite) => {
            sprite.color = isGray ? Color.fromHEX(color, '#C8C8C896') : Color.WHITE;
        });

        const boxSprites = this[`box${this._cfg.gift}`]!.getComponentsInChildren(Sprite);
        each(boxSprites, (sprite: Sprite) => {
            sprite.color = isEarn ? Color.fromHEX(color, '#B4B4B4') : Color.WHITE;
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

        const arrowPos = new Vec3(isLeft ? 90 : -90, 0, 0);
        this.arrowNode!.setPosition(arrowPos);
        this.arrowNode!.scale = new Vec3(isLeft ? 1 : -1, 1, 1);

        this.boxNode!.active = true;
        this.arrowNode!.active = true;
    }

    showBoxBtn() {
        this.box1!.active = false;
        this.box2!.active = false;
        this.box3!.active = false;

        this._showBox = this[`box${this._cfg.gift}`];
        this._showBox!.active = true;
    }

    showProgress() {
        const streakTime = MgrWinStreakV2.Instance.getStreakTime();
        if (streakTime > this._lv!) {
            this.lvProgress!.progress = 1;
        } else if (streakTime === this._lv!) {
            this.lvProgress!.progress = 0.5;
        } else {
            this.lvProgress!.progress = 0;
        }
    }

    onBoxBtn() {
        if (MgrWinStreakV2.Instance.getIsUnlock(this._cfg.winnum)) {
            this.boxAnimStop();
            MgrUi.Instance.openViewAsync(UIPrefabs.StreakEarnViewV2, {
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
        Tween.stopAllByTarget(this.lvProgress!);
        tween(this.lvProgress!)
            .to(duration, { progress: 0 })
            .call(() => {
                this.lvSprite!.spriteFrame = this.lvFrame[1];
                callback && callback();
            })
            .start();
    }

    showLv() {
        this.lvLabel!.string = `${this._lv}`;
    }

    boxShakeAnim() {
        const box = this[`box${this._cfg.gift}`]!;
        Tween.stopAllByTarget(box);

        tween(box)
            .to(0.2, { angle: 3, position: new Vec3(-1.5, 3, 0) }, { easing: easing.cubicOut })
            .to(0.2, { angle: 0, position: new Vec3(0, 0, 0) }, { easing: easing.quartIn })
            .to(0.2, { angle: -3, position: new Vec3(1.5, 3, 0) }, { easing: easing.cubicOut })
            .to(0.2, { angle: 0, position: new Vec3(0, 0, 0) }, { easing: easing.quartIn })
            .union()
            .repeatForever()
            .start();
    }

    boxStaticAnim() {
        const box = this[`box${this._cfg.gift}`]!;
        Tween.stopAllByTarget(box);

        tween(box)
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
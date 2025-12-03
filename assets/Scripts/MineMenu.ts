import { _decorator, Button, Label, Node, Vec3, director, Tween, UIOpacity, tween, v3, easing, Component } from 'cc';
import { GlobalEvent } from './Events';
import {Utils} from './Utils';
import { MgrMine } from './MgrMine';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { ITEM } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('MineMenu')
export class MineMenu extends Component {
    @property(Button)
    activityBtn: Button | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Node)
    redDot: Node | null = null;

    @property(Node)
    scaleNode: Node | null = null;

    @property(Node)
    upNode: Node | null = null;

    @property(Label)
    upLabel: Label | null = null;

    private _addNum: number = 0;
    private _upStartPos: Vec3 = new Vec3();

    onLoad() {
        this.activityBtn?.node.on('click', this._clickActivityBtn, this);
        this._upStartPos.set(this.upNode?.position || new Vec3());
    }

    onEnable() {
        director.on(GlobalEvent.MineRefreshRemainTime, this._onMineRefreshRemainTime, this);
        director.on(GlobalEvent.AssetItemChange + ITEM.PickAxe, this._checkRedDot, this);
        director.on(GlobalEvent.MineStateChange, this._checkRedDot, this);
        this._onMineRefreshRemainTime();
        this._checkRedDot();
    }

    onDisable() {
        director.targetOff(this);
    }

    private _onMineRefreshRemainTime() {
        const remainTime = MgrMine.Instance.remainTime;
        this.timeLabel!.string = remainTime >= 0 ? Utils.timeConvertToHHMM(remainTime) : '';
    }

    private _checkRedDot() {
        this.redDot!.active = MgrMine.Instance.showRedDot();
    }

    addPickAxe(amount: number) {
        this._addNum += amount;
    }

    showMineLabel() {
        if (this.upNode!.active = false, this.upLabel!.node.active = false, this._addNum > 0) {
            const addNum = this._addNum;
            this._addNum = 0;
            Tween.stopAllByTarget(this.upLabel!.node);
            this.upLabel!.node.active = true;
            this.upLabel!.string = '+' + addNum;
            this.upLabel!.node.setPosition(this._upStartPos);

            const opacityComp = this.upLabel!.getComponent(UIOpacity) || this.upLabel!.addComponent(UIOpacity);
            opacityComp.opacity = 0;
            Tween.stopAllByTarget(opacityComp);
            tween(opacityComp)
                .delay(0.7)
                .set({ opacity: 255 })
                .delay(0.9)
                .to(0.4, { opacity: 0 })
                .start();

            tween(this.upLabel!.node)
                .delay(0.7)
                .to(1.3, { position: v3(this._upStartPos.x, this._upStartPos.y + 40, 0) }, { easing: easing.sineOut })
                .call(() => { this.upLabel!.node.active = false; })
                .start();

            this.upNode!.active = true;
            Tween.stopAllByTarget(this.upNode);
            this.upNode!.setPosition(this._upStartPos);
            this.upNode!.scale = Vec3.ZERO;

            tween(this.upNode)
                .to(0.2, { scale: v3(1.3, 1.3, 1.3) })
                .to(0.1, { scale: v3(1, 1, 1) })
                .delay(0.4)
                .to(0.3, { position: Vec3.ZERO })
                .to(0.13, { scale: Vec3.ZERO })
                .call(() => {
                    this.upNode!.active = false;
                    tween(this.scaleNode)
                        .to(0.1, { scale: new Vec3(1.1, 1.1, 1.1) })
                        .to(0.1, { scale: Vec3.ONE })
                        .start();
                })
                .start();
        }
    }

    private _clickActivityBtn() {
        MgrUi.Instance.addViewAsyncQueue(UIPrefabs.MineView, { root: MgrUi.root(2) });
    }
}
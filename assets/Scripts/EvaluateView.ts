import { _decorator, Component, Node, UITransform, UIOpacity, Label, Vec3, tween, cclegacy, Tween } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { GameConst } from './GameConst';
import {Tools} from './Tools';
import {Language} from './Language';
import { AppGame } from './AppGame';
import { VALUE_COIN, GOLD_CUBE, BTN_TILE_COIN, BTN_NORMAL_MINE } from './TopUIView';

const { ccclass, property } = _decorator;

@ccclass('EvaluateView')
export class EvaluateView extends Component {
    @property(Node)
    aniNode: Node | null = null;

    @property(UITransform)
    aniTransform: UITransform | null = null;

    @property(UIOpacity)
    aniOpacity: UIOpacity | null = null;

    @property(Label)
    label: Label | null = null;

    private endCall: (() => void) | null = null;
    private prefix: string = 'Evaluate_';
    private suffixList: number[] | null = null;
    private lastIdx: number = 0;

    public reuse(data: { endCall: () => void }): void {
        this.endCall = data.endCall;
    }

    protected onLoad(): void {
        this.suffixList = [];
        for (let i = 1; i <= GameConst.EVALUATE_COUNT; i++) {
            this.suffixList.push(i);
        }
    }

    protected onEnable(): void {
        this.showLabel();
        this.play();
    }

    private showLabel(): void {
        if (!this.suffixList || !this.label) return;

        const filteredList = this.suffixList.filter(idx => idx !== this.lastIdx);
        const randomIdx = Tools.getRandomArrayElements(filteredList, 1)[0];
        
        this.lastIdx = randomIdx;
        this.label.string = Language.Instance.getLangByID(`${this.prefix}${randomIdx}`);
    }

    protected onDisable(): void {
        //fix tween remember before disable
        Tween.stopAllByTarget(this.node);
    }

    private play(): void {
        if (!this.aniNode || !this.aniOpacity) return;

        AppGame.topUI.clearBackFunc();
        AppGame.topUI.show(VALUE_COIN | GOLD_CUBE | BTN_TILE_COIN | BTN_NORMAL_MINE);

        this.aniNode.setPosition(new Vec3(0, 20, 0));
        this.aniNode.setScale(Vec3.ZERO);
        this.aniOpacity.opacity = 0;

        tween(this.aniOpacity)
            .to(0.15, { opacity: 255 })
            .delay(0.45)
            .to(0.4, { opacity: 0 })
            .start();

        tween(this.aniNode)
            .to(0.15, { scale: Vec3.ONE })
            .delay(0.45)
            .to(0.4, { position: new Vec3(0, -30, 0) })
            .call(() => {
                this.onClose();
                this.endCall && this.endCall();
            })
            .start();
    }

    private onClose(): void {
        const animCtrl = this.node.getComponent(ViewAnimCtrl);
        if (animCtrl) {
            animCtrl.onClose();
        }
    }
}
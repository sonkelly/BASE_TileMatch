import { _decorator, Component, Node, tween, Vec3, Tween } from 'cc';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('DailyBtn')
export class DailyBtn extends Component {
    @property(Node)
    animNode: Node | null = null;

    private _tween: Tween<Node> | null = null;

    onLoad() {
        this.node.on('click', this.onDailyBtn, this);
    }

    onEnable() {
        this.animEnable();
    }

    onDisable() {
        this.animDisable();
    }

    animEnable() {
        if (!this._tween) {
            this._tween = tween(this.animNode)
                .to(0.25, { scale: new Vec3(1.05, 1.1) }, { easing: 'sineInOut' })
                .to(0.25, { scale: Vec3.ONE }, { easing: 'sineInOut' })
                .to(0.25, { scale: new Vec3(1.05, 1.1) }, { easing: 'sineInOut' })
                .to(0.25, { scale: Vec3.ONE }, { easing: 'sineInOut' })
                .delay(1)
                .union()
                .repeatForever()
                .start();
        }
    }

    animDisable() {
        if (this._tween) {
            this._tween.stop();
            this.animNode.scale = Vec3.ONE;
            this._tween = null;
        }
    }

    onDailyBtn() {
        (async () => {
            await MgrUi.Instance.openViewAsync(UIPrefabs.DaliyRewardView, {
                root: MgrUi.root(2)
            });
        })();
    }
}
import { _decorator, Component, Node, Label, Button, Vec3, instantiate, tween, CCInteger } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { UIIcon } from './UIIcon';
import { AssetsCfg } from './AssetsCfg';
import { AsyncQueue } from './AsyncQueue';
import { MgrUser } from './MgrUser';
import {each , keys as ldKeys} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('CommonRewardView')
export class CommonRewardView extends Component {
    @property(Label)
    title: Label | null = null;

    @property(Node)
    rewardItem: Node | null = null;

    @property(Node)
    popNode: Node | null = null;

    @property(Button)
    closeBtn: Button | null = null;

    private pos_1: Vec3[] = [new Vec3(0, 222, 0)];
    private pos_2: Vec3[] = [new Vec3(-120, 222, 0), new Vec3(120, 222, 0)];
    private pos_3: Vec3[] = [new Vec3(0, 280, 0), new Vec3(-150, 50, 0), new Vec3(150, 50, 0)];
    private pos_4: Vec3[] = [new Vec3(-100, 280, 0), new Vec3(100, 280, 0), new Vec3(-150, 50, 0), new Vec3(150, 50, 0)];
    private pos_5: Vec3[] = [new Vec3(-200, 280, 0), new Vec3(0, 280, 0), new Vec3(200, 280, 0), new Vec3(-140, 50, 0), new Vec3(140, 50, 0)];

    private rewardData: Record<string, number> | null = null;
    private sourceType: any = null;

    reuse(data: { rewardData: Record<string, number>; title: string; sourceType: any }) {
        this.rewardData = data.rewardData;
        if (this.title) {
            this.title.string = data.title;
        }
        this.sourceType = data.sourceType;
    }

    onLoad() {
        if (this.closeBtn && this.closeBtn.node) {
            this.closeBtn.node.on('click', this.onClose, this);
        }
    }

    onEnable() {
        if (this.popNode) {
            this.popNode.removeAllChildren();
        }
        if (this.rewardItem) {
            this.rewardItem.active = false;
        }
        this.playAllItems();
    }

    private playAllItems() {
        if (!this.closeBtn || !this.closeBtn.node || !this.rewardItem || !this.popNode || !this.rewardData) return;

        this.closeBtn.node.active = false;
        const queue = new AsyncQueue();
        const keys = ldKeys(this.rewardData);
        const positions = (this as any)[`pos_${keys.length}`] as Vec3[];

        each(keys, (key, index) => {
            const count = this.rewardData![key];
            const itemNode = instantiate(this.rewardItem);
            
            itemNode.parent = this.popNode;
            itemNode.setPosition(positions[index]);
            
            const iconNode = itemNode.getChildByName('icon');
            if (iconNode) {
                const uiIcon = iconNode.getComponent(UIIcon);
                if (uiIcon) {
                    const assetCfg = AssetsCfg.Instance.get(Number(key));
                    if (assetCfg) {
                        uiIcon.icon = assetCfg.icon;
                    }
                }
            }

            const countNode = itemNode.getChildByName('count');
            if (countNode) {
                const label = countNode.getComponent(Label);
                if (label) {
                    label.string = `x${count}`;
                }
            }

            MgrUser.Instance.userData.addMemItem(Number(key), count, this.sourceType);

            const shainNode = itemNode.getChildByName('shain');
            if (shainNode) {
                tween(shainNode)
                    .by(1, { angle: -60 })
                    .repeatForever()
                    .start();
            }

            itemNode.scale = new Vec3(1.2, 1.2, 1.2);

            queue.push((next) => {
                itemNode.active = true;
                tween(itemNode)
                    .to(0.2, { scale: Vec3.ONE })
                    .call(() => next())
                    .start();
            });
        });

        queue.complete = () => {
            if (this.closeBtn && this.closeBtn.node) {
                this.closeBtn.node.active = true;
            }
        };

        queue.play();
    }

    private playFly() {
        if (!this.rewardData || !this.node) return;

        each(this.rewardData, (count, key) => {
            const result = MgrUser.Instance.userData.getItem(Number(key));
            MgrUser.Instance.userData.flyAddItem({
                itemId: Number(key),
                change: count,
                result: result,
                sourcePos: this.node.getWorldPosition()
            });
        });
    }

    private onClose() {
        this.playFly();
        const animCtrl = this.node.getComponent(ViewAnimCtrl);
        if (animCtrl) {
            animCtrl.onClose();
        }
    }
}
import { _decorator, Vec3, Node, Layout, UITransform, director, Label, view, Component } from 'cc';
import { GlobalEvent } from './Events';
import {AssetsCfg} from './AssetsCfg';
import { AssetPool } from './AssetPool';
import {UIIcon} from './UIIcon';
import {UIPool} from './UIPool';

const { ccclass, property } = _decorator;

@ccclass('UIPopAssetList')
export class UIPopAssetList extends Component {
    @property(UIPool)
    itemPool: UIPool | null = null;

    @property(Node)
    noticeNode: Node | null = null;

    @property(Layout)
    layout: Layout | null = null;

    items: any = null;
    targetPosition: Vec3 = new Vec3();

    reuse(data: any) {
        this.items = data.assets;
        const targetTransform = data.target.getComponent(UITransform);
        const targetHeight = targetTransform.height;
        const targetAnchor = targetTransform.anchorPoint;
        this.targetPosition = targetTransform.convertToWorldSpaceAR(Vec3.ZERO);
        this.targetPosition.y += targetHeight * (1 - targetAnchor.y);
    }

    onEnable() {
        this.showItem();
        director.on(GlobalEvent.TouchScreenBegin, this.onTouchScreen, this);
    }

    onDisable() {
        director.targetOff(this);
        this.node.targetOff(this);
    }

    onTouchScreen() {
        this.close();
    }

    close() {
        director.targetOff(this);
        AssetPool.Instance.put(this);
    }

    showItem() {
        this.layout.enabled = false;
        this.noticeNode.getComponent(Layout).enabled = false;
        this.itemPool.clear();
        this.layout.node.getComponent(UITransform).height = 100;
        this.layout.type = Layout.Type.HORIZONTAL;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (AssetsCfg.Instance.get(item.id)) {
                const itemNode = this.itemPool.get();
                itemNode.getChildByName('icon').getComponent(UIIcon).icon = AssetsCfg.Instance.get(item.id).icon;
                itemNode.getChildByName('count').getComponent(Label).string = 'x' + item.count;
                itemNode.parent = this.layout.node;
            } else {
                console.error('无 id: ' + item.id + ' 的物品！！');
            }
        }

        this.layout.enabled = true;
        this.layout.updateLayout(true);
        this.noticeNode.getComponent(Layout).enabled = true;
        this.noticeNode.getComponent(Layout).updateLayout(true);

        const noticeTransform = this.noticeNode.getComponent(UITransform);
        const noticeHeight = noticeTransform.height;
        const noticeAnchorY = noticeTransform.anchorY;
        const targetPosition = new Vec3(this.targetPosition);
        targetPosition.y += noticeHeight * noticeAnchorY;

        const visibleSize = view.getVisibleSize();
        const layoutTransform = this.layout.getComponent(UITransform);
        const layoutPosition = new Vec3(this.layout.node.position);

        if (targetPosition.x + 0.5 * layoutTransform.width > visibleSize.width) {
            layoutPosition.x = -(targetPosition.x + 0.5 * layoutTransform.width - visibleSize.width);
        } else {
            layoutPosition.x = 0;
        }

        this.layout.node.position = layoutPosition;
        const noticePosition = this.noticeNode.parent.getComponent(UITransform).convertToNodeSpaceAR(targetPosition);
        this.noticeNode.setPosition(noticePosition);
    }
}
import { _decorator, Component, Node, NodeEventType, Sprite, Enum, cclegacy } from 'cc';
import { FlyItem, UIAssetFlyView } from './UIAssetFlyView';
import AddCoinLabel from './AddCoinLabel';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AssetPool } from './AssetPool';

const { ccclass, property, menu } = _decorator;

@ccclass('UIAssetFlyItem')
@menu('Asset/UIAssetFlyItem')
export class UIAssetFlyItem extends Component {
    @property({
        type: Enum(FlyItem),
        visible: function(this: UIAssetFlyItem) {
            return this.assetTypes.length === 0;
        }
    })
    assetType: FlyItem = FlyItem.None;

    @property(Sprite)
    assetIcon: Sprite | null = null;

    @property(AddCoinLabel)
    addCoinLabel: AddCoinLabel | null = null;

    @property({
        type: [Enum(FlyItem)],
        visible: function(this: UIAssetFlyItem) {
            return this.assetType === FlyItem.None;
        }
    })
    assetTypes: FlyItem[] = [];

    onEnable() {
        const animCtrl = this.node.getComponentInParent(ViewAnimCtrl);
        if (animCtrl) {
            animCtrl.node.once('anim-in-done', () => {
                this.register();
            });
        } else {
            this.scheduleOnce(() => {
                this.register();
            });
        }
    }

    onTransformChanged(transformBit: number) {
        if (transformBit & Node.TransformBit.POSITION) {
            this.register();
        }
    }

    register() {
        const position = AssetPool.Instance.getV3();
        if (this.assetIcon) {
            position.set(this.assetIcon.node.worldPosition);
        } else {
            position.set(this.node.worldPosition);
        }

        if (this.assetType > FlyItem.None) {
            UIAssetFlyView.register(this.assetType, position, this.addCoinLabel, this.assetIcon);
        }

        if (this.assetTypes.length > 0) {
            UIAssetFlyView.register(this.assetTypes, position, this.addCoinLabel, this.assetIcon);
        }

        this.node.on(NodeEventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
    }

    unregister() {
        if (this.assetType > FlyItem.None) {
            UIAssetFlyView.unregister(this.assetType);
        }

        if (this.assetTypes.length > 0) {
            UIAssetFlyView.unregister(this.assetTypes);
        }

        this.node.targetOff(this);
    }

    onDisable() {
        this.unregister();
    }
}
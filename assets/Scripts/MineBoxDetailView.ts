import { _decorator, Component, Node, Layout, UITransform, Vec3, director, Label, legacy, view } from 'cc';
import { AssetsCfg } from './AssetsCfg';
import { GlobalEvent } from './Events';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {UIPool} from './UIPool';
import {UIIcon} from './UIIcon';

const { ccclass, property } = _decorator;

@ccclass('MineBoxDetailView')
export class MineBoxDetailView extends UIPool {
    @property(Node)
    noticeNode: Node = null!;

    @property(Layout)
    layout: Layout = null!;

    private _targetPosition: Vec3 = new Vec3();
    private _reward: any = null;

    reuse(data: any): void {
        this._reward = data.reward;
        const targetTransform = data.target.getComponent(UITransform);
        const height = targetTransform.height;
        const anchorPoint = targetTransform.anchorPoint;
        const scale = data.target.scale;

        this._targetPosition = targetTransform.convertToWorldSpaceAR(Vec3.ZERO);
        this._targetPosition.y += height * (1 - anchorPoint.y) * scale.y;
    }

    onEnable(): void {
        this.showItem();
        director.on(GlobalEvent.TouchScreenBegin, this._onTouchScreen, this);
        director.on(GlobalEvent.MinePlayGame, this._onMinePlayGame, this);
    }

    onDisable(): void {
        director.targetOff(this);
    }

    private _onTouchScreen(): void {
        this.node.emit(VIEW_ANIM_EVENT.Close);
    }

    showItem(): void {
        this.layout.enabled = false;
        this.noticeNode.getComponent(Layout)!.enabled = false;
        this.clear();

        const layoutTransform = this.layout.node.getComponent(UITransform)!;
        
        if (this._reward.length === 1) {
            layoutTransform.height = 90;
            this.layout.type = Layout.Type.HORIZONTAL;
        } else {
            layoutTransform.width = 280;
            this.layout.type = Layout.Type.GRID;
        }

        for (const rewardItem of this._reward) {
            const itemNode = this.get();
            const iconComponent = itemNode.getChildByName('icon')!.getComponent(UIIcon)!;
            const labelComponent = itemNode.getChildByName('label')!.getComponent(Label)!;

            iconComponent.icon = AssetsCfg.Instance.get(Number(rewardItem.id)).icon;
            labelComponent.string = 'x' + rewardItem.count;
            itemNode.parent = this.layout.node;
        }

        this.layout.enabled = true;
        this.layout.updateLayout(true);
        this.noticeNode.getComponent(Layout)!.enabled = true;
        this.noticeNode.getComponent(Layout)!.updateLayout(true);

        const noticeTransform = this.noticeNode.getComponent(UITransform)!;
        const height = noticeTransform.height;
        const anchorY = noticeTransform.anchorY;

        const targetPos = new Vec3(this._targetPosition);
        targetPos.y += height * anchorY + 15;

        const visibleSize = view.getVisibleSize();
        const layoutPos = new Vec3(this.layout.node.position);

        if (targetPos.x + 0.5 * layoutTransform.width > visibleSize.width) {
            layoutPos.x = -(targetPos.x + 0.5 * layoutTransform.width - visibleSize.width + 20);
        } else if (targetPos.x - 0.5 * layoutTransform.width < 0) {
            layoutPos.x = 0.5 * layoutTransform.width - targetPos.x + 20;
        } else {
            layoutPos.x = 0;
        }

        this.layout.node.position = layoutPos;

        const localPos = this.noticeNode.parent!.getComponent(UITransform)!.convertToNodeSpaceAR(targetPos);
        this.noticeNode.setPosition(localPos);
    }

    private _onMinePlayGame(): void {
        this._onTouchScreen();
    }
}
import { _decorator, Component, Node, Layout, UITransform, director, Vec3, Label, CCClass } from 'cc';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrWinStreak } from './MgrWinStreak';
import {UIIcon} from './UIIcon';
import {AssetsCfg} from './AssetsCfg';
import {UIPool} from './UIPool';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('StreakDetailView')
export class StreakDetailView extends UIPool {
    @property(Node)
    noticeNode: Node = null!;

    @property(Layout)
    layout: Layout = null!;

    private _rewardStr: string | null = null;
    private _targeetPosition: Vec3 = new Vec3();

    reuse(data: any) {
        this._rewardStr = data.reward;
        const targetTransform = data.target.getComponent(UITransform);
        const height = targetTransform.height;
        const anchorPoint = targetTransform.anchorPoint;
        
        this._targeetPosition = targetTransform.convertToWorldSpaceAR(Vec3.ZERO);
        this._targeetPosition.y += height * (1 - anchorPoint.y);
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
        this.node.emit(VIEW_ANIM_EVENT.Close);
        director.targetOff(this);
    }

    showItem() {
        this.layout.enabled = false;
        this.noticeNode.getComponent(Layout).enabled = false;
        this.clear();

        const rewardList = MgrWinStreak.Instance.getRewardList(this._rewardStr!);
        const layoutTransform = this.layout.node.getComponent(UITransform);

        if (rewardList.length === 1) {
            layoutTransform.height = 90;
            this.layout.type = Layout.Type.HORIZONTAL;
        } else {
            layoutTransform.width = 280;
            this.layout.type = Layout.Type.GRID;
        }

        for (const reward of rewardList) {
            const item = this.get();
            item.getChildByName('icon').getComponent(UIIcon).icon = AssetsCfg.Instance.get(Number(reward[0])).icon;
            item.getChildByName('label').getComponent(Label).string = 'x' + reward[1];
            item.parent = this.layout.node;
        }

        this.layout.enabled = true;
        this.layout.updateLayout(true);
        this.noticeNode.getComponent(Layout).enabled = true;
        this.noticeNode.getComponent(Layout).updateLayout(true);

        const noticeTransform = this.noticeNode.getComponent(UITransform);
        const height = noticeTransform.height;
        const anchorY = noticeTransform.anchorY;

        const position = new Vec3(this._targeetPosition);
        position.y += height * anchorY + 15;

        const localPosition = this.noticeNode.parent.getComponent(UITransform).convertToNodeSpaceAR(position);
        this.noticeNode.setPosition(localPosition);
    }
}
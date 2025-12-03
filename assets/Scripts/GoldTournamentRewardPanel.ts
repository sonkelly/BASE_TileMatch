import { _decorator, Component, ScrollView, Node, Label, director, UITransform, v3, ProgressBar, instantiate, v2 } from 'cc';
import { AvatarFrameCfg } from './AvatarFrameCfg';
import { GoldTournamentAvatarItem, AvatarFrameItemType } from './GoldTournamentAvatarItem';
import { GoldRankCfg } from './GoldRankCfg';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';
import { GlobalEvent } from './Events';
import { UIPool } from './UIPool';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentRewardPanel')
export class GoldTournamentRewardPanel extends UIPool {
    @property(ScrollView)
    avatarRewardScroll: ScrollView = null!;

    @property(Node)
    avatarContent: Node = null!;

    @property(Node)
    progressBg: Node = null!;

    @property(Node)
    progressNode: Node = null!;

    @property(Node)
    gegangNode: Node = null!;

    @property(Node)
    goldFlowerNode: Node = null!;

    @property(Label)
    flowerLabel: Label = null!;

    private _itemLen: number = 0;
    private _itemSize: any = null;
    private _gegangNodes: Node[] = [];
    private _gegangStep: number = 0;

    onLoad() {
        this._createAvatarFrame();
        this._createProgress();
    }

    onEnable() {
        director.on(GlobalEvent.AssetItemChange + ITEM.GoldFlower, this._freshGoldFlower, this);
        this._freshGoldFlower();
        this._refreshInfo();
    }

    onDisable() {
        director.targetOff(this);
    }

    onDestroy() {
        this.clear();
    }

    private _freshGoldFlower() {
        this.flowerLabel.string = 'x' + MgrUser.Instance.userData.getItem(ITEM.GoldFlower);
    }

    private _createAvatarFrame() {
        const rewardMap = GoldRankCfg.Instance.getGoldRankRewardMap();
        const rewardIds = GoldRankCfg.Instance.getGoldRankRewardIds();
        this._itemLen = rewardIds.length + 2;

        for (let i = 0; i < this._itemLen; i++) {
            const item = this.get();
            item.parent = this.avatarContent;
            
            if (!this._itemSize) {
                this._itemSize = item.getComponent(UITransform)!.contentSize;
                this._gegangStep = this._itemSize.width / 4;
            }
            
            item.setPosition(this._getAvatarFrameItemPos(i));
            
            const avatarItem = item.getComponent(GoldTournamentAvatarItem)!;
            
            if (i === 0 || i === this._itemLen - 1) {
                avatarItem.setType(AvatarFrameItemType.Empty);
            } else {
                avatarItem.setType(AvatarFrameItemType.Item);
                const cfg = AvatarFrameCfg.Instance.get(rewardIds[i - 1]);
                avatarItem.refreshSp(cfg.id);
                avatarItem.refreshLabel(rewardMap.get(cfg.id));
            }
        }

        const contentSize = this.avatarContent.getComponent(UITransform)!.contentSize;
        this.avatarContent.getComponent(UITransform)!.setContentSize(
            this._itemLen * this._itemSize.width, 
            contentSize.height
        );
        this.progressBg.setSiblingIndex(this.avatarContent.children.length);
    }

    private _getAvatarFrameItemPos(index: number) {
        const x = this._itemSize.width / 2 + index * this._itemSize.width;
        return v3(x, 0, 0);
    }

    private _createProgress() {
        const progressWidth = (this._itemLen - 2) * this._itemSize.width;
        const progressHeight = this.progressBg.getComponent(UITransform)!.contentSize.height;
        
        this.progressBg.getComponent(UITransform)!.setContentSize(progressWidth, progressHeight);
        
        const progressSize = this.progressNode.getComponent(UITransform)!.contentSize;
        this.progressNode.getComponent(UITransform)!.setContentSize(progressWidth - 5, progressSize.height);
        this.progressNode.getComponent(ProgressBar)!.totalLength = progressWidth - 5;

        const gegangCount = 4 * AvatarFrameCfg.Instance.sortCfg.length - 1;
        
        for (let i = 0; i < gegangCount; i++) {
            if (i !== 0) {
                const gegang = instantiate(this.gegangNode);
                gegang.parent = this.progressBg;
                gegang.setPosition((i + 1) * this._gegangStep, 0, 0);
                this._gegangNodes.push(gegang);
            } else {
                this._gegangNodes.push(this.gegangNode);
            }
        }
    }

    private _getProgressInfo() {
        const goldFlower = MgrUser.Instance.userData.goldFlower;
        const rewardMap = GoldRankCfg.Instance.getGoldRankRewardMap();
        const rewardIds = GoldRankCfg.Instance.getGoldRankRewardIds();
        
        let hitIdx = -1;
        let nextIdx = 0;

        for (let i = rewardIds.length - 1; i >= 0; i--) {
            const id = rewardIds[i];
            if (goldFlower >= rewardMap.get(id)) {
                hitIdx = i;
                nextIdx = i + 1;
                break;
            }
        }

        const currentValue = hitIdx >= 0 ? rewardMap.get(rewardIds[hitIdx]) : 0;
        const nextValue = nextIdx <= rewardIds.length - 1 ? 
            rewardMap.get(rewardIds[nextIdx]) : 
            rewardMap.get(rewardIds[rewardIds.length - 1]);

        const progress = goldFlower - currentValue;
        let progressRatio = 0;
        let goldFlowerPosX = 0;

        if (nextIdx >= rewardIds.length) {
            progressRatio = 1;
        } else {
            progressRatio = (hitIdx + 1) / rewardIds.length + 
                progress / (nextValue - currentValue) * 1 / rewardIds.length;
        }

        if (nextIdx >= rewardIds.length) {
            goldFlowerPosX = 4 * rewardIds.length * this._gegangStep;
        } else {
            goldFlowerPosX = 4 * (hitIdx + 1) * this._gegangStep + 
                progress / (nextValue - currentValue) * 4 * this._gegangStep;
        }

        return {
            progressHitIdx: hitIdx,
            progressNodePro: progressRatio,
            goldFlowerNodeX: goldFlowerPosX
        };
    }

    private _refreshInfo() {
        const progressInfo = this._getProgressInfo();
        
        this.progressNode.getComponent(ProgressBar)!.progress = progressInfo.progressNodePro;
        this.goldFlowerNode.setPosition(
            progressInfo.goldFlowerNodeX, 
            this.goldFlowerNode.position.y, 
            this.goldFlowerNode.position.z
        );

        const maxOffset = this.avatarRewardScroll.getMaxScrollOffset();
        const targetX = Math.min(progressInfo.progressHitIdx * this._itemSize.width, maxOffset.x);
        this.avatarRewardScroll.scrollToOffset(v2(targetX, 0), 0.32);
    }
}
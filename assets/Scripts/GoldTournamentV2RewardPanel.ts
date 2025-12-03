import { _decorator, Component, ScrollView, Node, Label, director, UITransform, v3, ProgressBar, instantiate, v2 } from 'cc';
import { UIPool } from './UIPool';
import { GlobalEvent } from './Events';
import { ITEM } from './GameConst';
import { MgrUser } from './MgrUser';
import { GoldRankV2Cfg } from './GoldRankV2Cfg';
import { GoldTournamentV2AvatarItem } from './GoldTournamentV2AvatarItem';
import { AvatarFrameItemType } from './GoldTournamentAvatarItem';

import { AvatarFrame2Cfg } from './AvatarFrame2Cfg';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentV2RewardPanel')
export class GoldTournamentV2RewardPanel extends UIPool {
    @property(ScrollView)
    avatarRewardScroll: ScrollView | null = null;

    @property(Node)
    avatarContent: Node | null = null;

    @property(Node)
    progressBg: Node | null = null;

    @property(Node)
    progressNode: Node | null = null;

    @property(Node)
    gegangNode: Node | null = null;

    @property(Node)
    goldFlowerNode: Node | null = null;

    @property(Label)
    flowerLabel: Label | null = null;

    private _itemLen: number = 0;
    private _itemSize: any = null;
    private _gegangNodes: Node[] = [];
    private _gegangStep: number = 0;

    onLoad() {
        this._createAvatarFrame();
        this._createProgress();
    }

    onEnable() {
        director.on(GlobalEvent.AssetItemChange + ITEM.ChallengeStar, this._freshGoldFlower, this);
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
        if (this.flowerLabel) {
            this.flowerLabel.string = 'x' + MgrUser.Instance.userData.getItem(ITEM.ChallengeStar);
        }
    }

    private _createAvatarFrame() {
        const rewardMap = GoldRankV2Cfg.Instance.getGoldRankRewardMap();
        const rewardIds = GoldRankV2Cfg.Instance.getGoldRankRewardIds();
        this._itemLen = rewardIds.length + 2;

        for (let i = 0; i < this._itemLen; i++) {
            const item = this.get();
            if (item && this.avatarContent) {
                item.parent = this.avatarContent;
                
                if (!this._itemSize) {
                    const uiTransform = item.getComponent(UITransform);
                    if (uiTransform) {
                        this._itemSize = uiTransform.contentSize;
                        this._gegangStep = this._itemSize.width / 4;
                    }
                }

                item.setPosition(this._getAvatarFrameItemPos(i));
                
                const avatarItem = item.getComponent(GoldTournamentV2AvatarItem);
                if (avatarItem) {
                    if (i === 0 || i === this._itemLen - 1) {
                        avatarItem.setType(AvatarFrameItemType.Empty);
                    } else {
                        avatarItem.setType(AvatarFrameItemType.Item);
                        const cfg = AvatarFrame2Cfg.Instance.get(rewardIds[i - 1]);
                        if (cfg) {
                            avatarItem.refreshSp(cfg.id);
                            avatarItem.refreshLabel(rewardMap.get(cfg.id));
                        }
                    }
                }
            }
        }

        if (this.avatarContent) {
            const uiTransform = this.avatarContent.getComponent(UITransform);
            if (uiTransform) {
                const contentSize = uiTransform.contentSize;
                uiTransform.setContentSize(this._itemLen * this._itemSize.width, contentSize.height);
            }
            
            if (this.progressBg) {
                this.progressBg.setSiblingIndex(this.avatarContent.children.length);
            }
        }
    }

    private _getAvatarFrameItemPos(index: number) {
        const x = this._itemSize.width / 2 + index * this._itemSize.width;
        return v3(x, 0, 0);
    }

    private _createProgress() {
        if (!this.progressBg || !this.progressNode) return;

        const uiTransformBg = this.progressBg.getComponent(UITransform);
        const uiTransformNode = this.progressNode.getComponent(UITransform);
        const progressBar = this.progressNode.getComponent(ProgressBar);

        if (uiTransformBg && uiTransformNode && progressBar) {
            const progressWidth = (this._itemLen - 2) * this._itemSize.width;
            const bgHeight = uiTransformBg.contentSize.height;
            const nodeSize = uiTransformNode.contentSize;

            uiTransformBg.setContentSize(progressWidth, bgHeight);
            uiTransformNode.setContentSize(progressWidth - 5, nodeSize.height);
            progressBar.totalLength = progressWidth - 5;

            const gegangCount = 4 * AvatarFrame2Cfg.Instance.sortCfg.length - 1;
            for (let i = 0; i < gegangCount; i++) {
                if (i !== 0 && this.gegangNode) {
                    const gegang = instantiate(this.gegangNode);
                    gegang.parent = this.progressBg;
                    gegang.setPosition((i + 1) * this._gegangStep, 0, 0);
                    this._gegangNodes.push(gegang);
                } else if (this.gegangNode) {
                    this._gegangNodes.push(this.gegangNode);
                }
            }
        }
    }

    private _getProgressInfo() {
        const challengeStar = MgrUser.Instance.userData.challengeStar;
        const rewardMap = GoldRankV2Cfg.Instance.getGoldRankRewardMap();
        const rewardIds = GoldRankV2Cfg.Instance.getGoldRankRewardIds();

        let progressHitIdx = -1;
        let nextIdx = 0;

        for (let i = rewardIds.length - 1; i >= 0; i--) {
            const rewardId = rewardIds[i];
            if (challengeStar >= rewardMap.get(rewardId)) {
                progressHitIdx = i;
                nextIdx = i + 1;
                break;
            }
        }

        const currentValue = progressHitIdx >= 0 ? rewardMap.get(rewardIds[progressHitIdx]) : 0;
        const nextValue = nextIdx <= rewardIds.length - 1 ? 
            rewardMap.get(rewardIds[nextIdx]) : 
            rewardMap.get(rewardIds[rewardIds.length - 1]);

        const currentProgress = challengeStar - currentValue;
        let progressNodePro = 0;
        let goldFlowerNodeX = 0;

        if (nextIdx >= rewardIds.length) {
            progressNodePro = 1;
        } else {
            progressNodePro = (progressHitIdx + 1) / rewardIds.length + 
                currentProgress / (nextValue - currentValue) * 1 / rewardIds.length;
        }

        if (nextIdx >= rewardIds.length) {
            goldFlowerNodeX = 4 * rewardIds.length * this._gegangStep;
        } else {
            goldFlowerNodeX = 4 * (progressHitIdx + 1) * this._gegangStep + 
                currentProgress / (nextValue - currentValue) * 4 * this._gegangStep;
        }

        return {
            progressHitIdx,
            progressNodePro,
            goldFlowerNodeX
        };
    }

    private _refreshInfo() {
        const progressInfo = this._getProgressInfo();

        if (this.progressNode) {
            const progressBar = this.progressNode.getComponent(ProgressBar);
            if (progressBar) {
                progressBar.progress = progressInfo.progressNodePro;
            }
        }

        if (this.goldFlowerNode) {
            const currentPos = this.goldFlowerNode.position;
            this.goldFlowerNode.setPosition(progressInfo.goldFlowerNodeX, currentPos.y, currentPos.z);
        }

        if (this.avatarRewardScroll) {
            const maxOffset = this.avatarRewardScroll.getMaxScrollOffset();
            const targetX = Math.min(progressInfo.progressHitIdx * this._itemSize.width, maxOffset.x);
            this.avatarRewardScroll.scrollToOffset(v2(targetX, 0), 0.32);
        }
    }
}
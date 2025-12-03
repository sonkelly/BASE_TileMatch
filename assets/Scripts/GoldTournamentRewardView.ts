import { _decorator, Button, Node, Label, Sprite, ScrollView, director, UITransform, v3, ProgressBar, instantiate, tween, easing, v2, Tween, CCFloat } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import {Language} from './Language';
import { MgrGoldTournament } from './MgrGoldTournament';
import {GoldRankRewardCfg} from './GoldRankRewardCfg';
import {AssetsCfg} from './AssetsCfg';
import {GoldRankCfg} from './GoldRankCfg';
import { GoldTournamentAvatarItem, AvatarFrameItemType } from './GoldTournamentAvatarItem';
import AvatarFrameCfg from './AvatarFrameCfg';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';
import { TournamentStatus } from './GoldTournamentData';
import {UIAssetFlyItem} from './UIAssetFlyItem';
import { GlobalEvent } from './Events';
import { AsyncQueue } from './AsyncQueue';
import {UIPool} from './UIPool';
import { AnalyticsManager } from './AnalyticsManager';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentRewardView')
export class GoldTournamentRewardView extends UIPool {
    @property(Button)
    confirmBtn: Button = null!;

    @property(Node)
    lightNode: Node = null!;

    @property(Label)
    rankLabel: Label = null!;

    @property(Label)
    descLabel: Label = null!;

    @property(Node)
    rewardNode: Node = null!;

    @property(Node)
    rewardGoldFlower: Node = null!;

    @property(Label)
    rewardGoldFlowerCnt: Label = null!;

    @property(Sprite)
    rewardItemSp: Sprite = null!;

    @property(Label)
    rewardItemCnt: Label = null!;

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

    @property(ScrollView)
    avatarRewardScroll: ScrollView = null!;

    @property(UIAssetFlyItem)
    flowerUIAssetFlyItem: UIAssetFlyItem = null!;

    private _rankDatas: any = null;
    private _rewardData: any = null;
    private _avatarFrames: GoldTournamentAvatarItem[] = [];
    private _itemLen: number = 0;
    private _itemSize: any = null;
    private _gegangStep: number = 0;
    private _unlockFrameIds: number[] = [];
    private _flyFrameNodes: Node[] = [];
    private _resultAsync: AsyncQueue = null!;

    onLoad() {
        this.confirmBtn.node.on('click', this._onClickConfirm, this);
        this._createAvatarFrame();
        this._createProgress();
    }

    onEnable() {
        director.on(GlobalEvent.AssetItemChange + ITEM.GoldFlower, this._freshGoldFlower, this);
        this._rankDatas = MgrGoldTournament.Instance.getGoldTourRankIndexData();
        if (this._rankDatas && this._rankDatas.selfData) {
            this._rewardData = GoldRankRewardCfg.Instance.getRewardById(this._rankDatas.selfData.rank);
            this._unlockFrameIds.length = 0;
            this.confirmBtn.interactable = true;
            this._freshGoldFlower();
            this._startLightAction();
            this._refreshInfo();
            this._refreshProgressInfo();
        } else {
            console.error('no datas in tourRankReward.');
        }
    }

    onDisable() {
        this._stopLightAction();
        this._stopFlyFrameNodes();
        if (this._resultAsync) {
            this._resultAsync.clear();
            this._resultAsync = null;
        }
        director.targetOff(this);
    }

    onDestroy() {
        this.clear();
        this._avatarFrames.length = 0;
    }

    private _createAvatarFrame() {
        const rewardMap = GoldRankCfg.Instance.getGoldRankRewardMap();
        const rewardIds = GoldRankCfg.Instance.getGoldRankRewardIds();
        this._itemLen = rewardIds.length + 2;

        for (let i = 0; i < this._itemLen; i++) {
            const item = this.get();
            item.parent = this.avatarContent;
            if (!this._itemSize) {
                this._itemSize = item.getComponent(UITransform).contentSize;
                this._gegangStep = this._itemSize.width / 4;
            }
            item.setPosition(v3(this._itemSize.width / 2 + i * this._itemSize.width, 0, 0));

            const avatarFrame = item.getComponent(GoldTournamentAvatarItem);
            this._avatarFrames.push(avatarFrame);

            if (i === 0 || i === this._itemLen - 1) {
                avatarFrame.setType(AvatarFrameItemType.Empty);
            } else {
                avatarFrame.setType(AvatarFrameItemType.Item);
                const frameCfg = AvatarFrameCfg.Instance.get(rewardIds[i - 1]);
                avatarFrame.refreshSp(frameCfg.id);
                avatarFrame.refreshLabel(rewardMap.get(frameCfg.id));
            }
        }

        const contentSize = this.avatarContent.getComponent(UITransform).contentSize;
        this.avatarContent.getComponent(UITransform).setContentSize(this._itemLen * this._itemSize.width, contentSize.height);
        this.progressBg.setSiblingIndex(this.avatarContent.children.length);
    }

    private _createProgress() {
        const progressWidth = (this._itemLen - 2) * this._itemSize.width;
        const progressHeight = this.progressBg.getComponent(UITransform).contentSize.height;
        this.progressBg.getComponent(UITransform).setContentSize(progressWidth, progressHeight);

        const progressSize = this.progressNode.getComponent(UITransform).contentSize;
        this.progressNode.getComponent(UITransform).setContentSize(progressWidth - 5, progressSize.height);
        this.progressNode.getComponent(ProgressBar).totalLength = progressWidth - 5;

        const stepCount = 4 * AvatarFrameCfg.Instance.sortCfg.length - 1;
        for (let i = 0; i < stepCount; i++) {
            if (i !== 0) {
                const gegang = instantiate(this.gegangNode);
                gegang.parent = this.progressBg;
                gegang.setPosition((i + 1) * this._gegangStep, 0, 0);
            }
        }
    }

    private _freshGoldFlower() {
        this.flowerLabel.string = 'x' + MgrUser.Instance.userData.getItem(ITEM.GoldFlower);
    }

    private _doSettleMent() {
        MgrGoldTournament.Instance.data.tourStatus = TournamentStatus.Rewarded;
        MgrGoldTournament.Instance.data.settlePeriod(MgrGoldTournament.Instance.data.tourPeriod, this._rankDatas.selfData.rank);

        const goldCube = MgrGoldTournament.Instance.data.goldCube;
        const rank = this._rankDatas.selfData.rank;
        const goldFlower = MgrUser.Instance.userData.getItem(ITEM.GoldFlower);
        const rewardStr = GoldRankRewardCfg.Instance.getAllRewardStrById(this._rankDatas.selfData.rank);

        AnalyticsManager.getInstance().reportGoldGet({
            Gold_Point: goldCube,
            Gold_Rank: rank,
            Gold_Type: 1,
            Gold_Reward_Progress: goldFlower,
            Reward: rewardStr
        });
    }

    private _onClickConfirm() {
        this.confirmBtn.interactable = false;

        if (!this._rewardData) {
            this._doSettleMent();
            this._close();
            return;
        }

        const itemId = this._rewardData.itemId;
        const itemCount = this._rewardData.itemCount;
        const flowerType = ITEM.GoldFlower;
        const flowerCount = this._rewardData.flower;

        if (itemCount > 0) {
            MgrUser.Instance.userData.addMemItem(itemId, itemCount, 'GoldReward');
        }
        if (flowerCount > 0) {
            MgrUser.Instance.userData.addMemItem(flowerType, flowerCount, 'GoldReward');
        }

        const rewardMap = GoldRankCfg.Instance.getGoldRankRewardMap();
        for (const [frameId, requiredFlowers] of rewardMap) {
            if (MgrUser.Instance.userData.goldFlower >= requiredFlowers) {
                if (!MgrUser.Instance.userData.unlockHeadFrame.includes(frameId)) {
                    MgrUser.Instance.userData.addUnlockHeadFrame(frameId);
                    this._unlockFrameIds.push(frameId);
                }
            }
        }

        this._doSettleMent();

        const delay = 0.08;
        this._resultAsync = new AsyncQueue();

        this._resultAsync.push((next) => {
            const itemPos = this.rewardItemSp.node.getWorldPosition();
            const flowerPos = this.rewardGoldFlower.getWorldPosition();

            if (itemCount > 0) {
                const resultCount = MgrUser.Instance.userData.getItem(itemId);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: itemId,
                    change: itemCount,
                    result: resultCount,
                    sourcePos: itemPos
                });
            }

            if (flowerCount > 0) {
                const resultCount = MgrUser.Instance.userData.getItem(flowerType);
                MgrUser.Instance.userData.flyAddItem({
                    itemId: flowerType,
                    change: flowerCount,
                    result: resultCount,
                    sourcePos: flowerPos
                });
            }

            this.scheduleOnce(next, 0.48);
        });

        this._resultAsync.push((next) => {
            const progressInfo = this._getProgressInfo();
            const progressBar = this.progressNode.getComponent(ProgressBar);

            tween(progressBar)
                .to(0.64, { progress: progressInfo.progressNodePro }, { easing: easing.sineInOut })
                .start();

            const maxOffset = this.avatarRewardScroll.getMaxScrollOffset();
            const targetX = Math.min(progressInfo.progressHitIdx * this._itemSize.width, maxOffset.x);
            this.avatarRewardScroll.scrollToOffset(v2(targetX, 0), 0.64);

            const targetPos = v3(progressInfo.goldFlowerNodeX, this.goldFlowerNode.position.y, this.goldFlowerNode.position.z);
            tween(this.goldFlowerNode)
                .to(0.64, { position: targetPos }, { easing: easing.sineInOut })
                .start();

            this.scheduleOnce(next, 0.72);
        });

        this._resultAsync.push((next) => {
            if (this._unlockFrameIds.length <= 0) {
                this.scheduleOnce(next, delay);
            } else {
                const highestFrame = AvatarFrameCfg.Instance.getHightestLvInArray(this._unlockFrameIds);
                for (let i = 0; i < this._avatarFrames.length; i++) {
                    const frame = this._avatarFrames[i];
                    if (frame.frameId === highestFrame) {
                        const flyNode = this.get();
                        const flyFrame = flyNode.getComponent(GoldTournamentAvatarItem);
                        flyFrame.setType(AvatarFrameItemType.Fly);
                        flyFrame.refreshSp(highestFrame);
                        flyNode.parent = this.node;
                        flyNode.setWorldPosition(frame.node.worldPosition);
                        this._flyFrameNodes.push(flyNode);
                    }
                }

                for (let i = 0; i < this._flyFrameNodes.length; i++) {
                    const flyNode = this._flyFrameNodes[i];
                    tween(flyNode)
                        .to(0.64, { 
                            worldPosition: v3(0, 0, 0), 
                            scale: v3(0.3, 0.3, 0.3) 
                        }, { easing: easing.backIn })
                        .start();
                }

                this.scheduleOnce(next, 0.72);
            }
        });

        this._resultAsync.complete = () => {
            this._close();
        };

        this._resultAsync.play();
    }

    private _close() {
        this.node.getComponent(ViewAnimCtrl).onClose();
    }

    private _refreshInfo() {
        const rankStr = '' + this._rankDatas.selfData.rank;
        this.rankLabel.string = Language.Instance.getLangByID('ui_gold_tour_rank').replace('%value', rankStr);
        this.descLabel.string = Language.Instance.getLangByID('ui_gold_tour_rank_reward_tip').replace('%value', rankStr);

        if (this._rewardData) {
            this.rewardGoldFlowerCnt.string = this._rewardData.flower > 0 ? 'x' + this._rewardData.flower : 'x0';
            this.rewardItemSp.node.active = this._rewardData.itemId >= 0;
            this.rewardItemCnt.string = this._rewardData.itemId >= 0 ? 'x' + this._rewardData.itemCount : 'x0';
            
            if (this._rewardData.itemId >= 0) {
                this.rewardItemSp.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(this._rewardData.itemId);
            }
        } else {
            this.rewardGoldFlowerCnt.string = 'x0';
            this.rewardItemSp.node.active = false;
        }
    }

    private _getProgressInfo() {
        const currentFlowers = MgrUser.Instance.userData.goldFlower;
        const rewardMap = GoldRankCfg.Instance.getGoldRankRewardMap();
        const rewardIds = GoldRankCfg.Instance.getGoldRankRewardIds();

        let currentIndex = -1;
        let nextIndex = 0;

        for (let i = rewardIds.length - 1; i >= 0; i--) {
            const frameId = rewardIds[i];
            if (currentFlowers >= rewardMap.get(frameId)) {
                currentIndex = i;
                nextIndex = i + 1;
                break;
            }
        }

        const currentRequire = currentIndex >= 0 ? rewardMap.get(rewardIds[currentIndex]) : 0;
        const nextRequire = nextIndex <= rewardIds.length - 1 ? rewardMap.get(rewardIds[nextIndex]) : rewardMap.get(rewardIds[rewardIds.length - 1]);
        
        const progressValue = currentFlowers - currentRequire;
        let progressRatio = 0;
        let nodePositionX = 0;

        if (nextIndex >= rewardIds.length) {
            progressRatio = 1;
        } else {
            progressRatio = (currentIndex + 1) / rewardIds.length + progressValue / (nextRequire - currentRequire) * 1 / rewardIds.length;
        }

        if (nextIndex >= rewardIds.length) {
            nodePositionX = 4 * rewardIds.length * this._gegangStep;
        } else {
            nodePositionX = 4 * (currentIndex + 1) * this._gegangStep + progressValue / (nextRequire - currentRequire) * 4 * this._gegangStep;
        }

        return {
            progressHitIdx: currentIndex,
            progressNodePro: progressRatio,
            goldFlowerNodeX: nodePositionX
        };
    }

    private _refreshProgressInfo() {
        const progressInfo = this._getProgressInfo();
        this.progressNode.getComponent(ProgressBar).progress = progressInfo.progressNodePro;
        this.goldFlowerNode.setPosition(progressInfo.goldFlowerNodeX, this.goldFlowerNode.position.y, this.goldFlowerNode.position.z);
        this.flowerUIAssetFlyItem.register();

        const maxOffset = this.avatarRewardScroll.getMaxScrollOffset();
        const targetX = Math.min(progressInfo.progressHitIdx * this._itemSize.width, maxOffset.x);
        this.avatarRewardScroll.scrollToOffset(v2(targetX, 0), 0.32);
    }

    private _stopFlyFrameNodes() {
        this._flyFrameNodes.forEach((node) => {
            Tween.stopAllByTarget(node);
            this.put(node);
        });
        this._flyFrameNodes.length = 0;
    }

    private _startLightAction() {
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(12, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    private _stopLightAction() {
        Tween.stopAllByTarget(this.lightNode);
    }
}
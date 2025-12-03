import { _decorator, Component, ProgressBar, UITransform, Node, Prefab, Tween, tween, Vec3, instantiate } from 'cc';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import { DailyChallengeCfg } from './DailyChallengeCfg';
import { GiftItem } from './GiftItem';
import { MgrChallenge } from './MgrChallenge';
import { MgrChallengeStorage } from './MgrChallengeStorage';
import { MgrUser } from './MgrUser';
import { ITEM } from './GameConst';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import AddCoinLabel from './AddCoinLabel';
import {includes, each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('GiftNode')
export class GiftNode extends Component {
    @property(ProgressBar)
    monthProgress: ProgressBar | null = null;

    @property(UITransform)
    lineNode: UITransform | null = null;

    @property(Node)
    giftNode: Node | null = null;

    @property(Prefab)
    giftPrefab: Prefab | null = null;

    @property(AddCoinLabel)
    starLabel: AddCoinLabel | null = null;

    private _time: any = null;
    private giftItems: GiftItem[] = [];
    private _cfg: any = null;

    onDisable() {
        const animCtrl = this.node.getComponentInParent(ViewAnimCtrl);
        animCtrl && animCtrl.node.targetOff(this);
    }

    show(time: any, month: any) {
        this._time = month;
        const monthNum = month.month() + 1;
        this._cfg = DailyChallengeCfg.Instance.get(monthNum);
        this.showNode();

        const startTime = moment(MgrChallenge.Instance.curTime).startOf('month').startOf('day').valueOf();
        const starData = MgrChallengeStorage.Instance.getStarData(startTime);
        
        if (starData) {
            this.showLabel(starData);
            
            if (starData.preStar != starData.star) {
                const preStar = starData.preStar || 0;
                const progress = this.getProgress(preStar);
                this.monthProgress!.progress = progress;
            }

            const animCtrl = this.node.getComponentInParent(ViewAnimCtrl);
            if (animCtrl) {
                animCtrl.node.targetOff(this);
                if (animCtrl.isAnimIn()) {
                    animCtrl.node.once('anim-in-done', () => {
                        this.showProgress(time, starData);
                    }, this);
                } else {
                    this.showProgress(time, starData);
                }
            } else {
                this.showProgress(time, starData);
            }
        } else {
            this.showEmpty();
        }
    }

    showNode() {
        const progressLength = this._cfg.starProgress.length;
        each(this._cfg.starProgress, (progress: number, index: number) => {
            const pos = this.getPos(index + 1, progressLength);
            const giftItem = this.getGiftItem(index);
            giftItem.showItem(this._cfg, index);
            giftItem.node.parent = this.giftNode;
            giftItem.node.setPosition(pos);
        });
        this.hideGiftItem(this._cfg.starProgress.length);
    }

    showProgress(time: any, starData: any) {
        if (starData.star > starData.preStar) {
            const starCount = starData.star - starData.preStar;
            const startProgress = this.getProgress(starData.preStar);
            this.monthProgress!.progress = startProgress;
            const endProgress = this.getProgress(starData.star);

            this.scheduleOnce(() => {
                this.showStarFlyAnim(time, ITEM.Star, starData.star, starCount);
            }, 0);

            Tween.stopAllByTarget(this.monthProgress);
            tween(this.monthProgress)
                .delay(0.4)
                .to(0.3, { progress: endProgress })
                .call(() => {
                    this.getUnlockGift(starData.preStar, starData.star);
                    MgrChallengeStorage.Instance.addStarProgressComplete(MgrChallenge.Instance.curTime);
                })
                .start();
        } else {
            const star = starData?.star || 0;
            this.monthProgress!.progress = this.getProgress(star);
            MgrChallengeStorage.Instance.addStarProgressComplete(MgrChallenge.Instance.curTime);
        }
    }

    showLabel(starData: any) {
        if (starData.star > starData.preStar) {
            this.starLabel!.string = '' + starData.preStar;
        } else {
            const star = starData?.star || 0;
            this.starLabel!.string = '' + star;
        }
    }

    showEmpty() {
        this.monthProgress!.progress = 0;
        this.starLabel!.string = '0';
    }

    getUnlockGift(preStar: number, currentStar: number): boolean {
        for (let i = 0; i < this._cfg.starProgress.length; i++) {
            const progress = this._cfg.starProgress[i];
            if (progress > preStar && progress <= currentStar) {
                const startTime = moment(MgrChallenge.Instance.curTime).startOf('month').startOf('day').valueOf();
                const starData = MgrChallengeStorage.Instance.getStarData(startTime);
                
                if (!includes(starData.earnList, progress)) {
                    const reward = this._cfg.rewards.split(',')[i];
                    MgrUi.Instance.addViewAsyncQueue(UIPrefabs.CommonDoubleView, {
                        root: MgrUi.root(2),
                        data: {
                            reward: reward,
                            adType: 'AdStartChest',
                            getSource: 'ChanllengeStarChest'
                        }
                    });

                    MgrChallengeStorage.Instance.earnStarReward(this._time.valueOf(), progress);
                    this.showNode();
                    return true;
                }
            }
        }
        return false;
    }

    getProgress(star: number): number {
        const unitProgress = 1 / this._cfg.starProgress.length;
        let totalProgress = 0;
        let prevProgress = 0;
        let nextProgress = 0;
        
        for (let i = 0; i < this._cfg.starProgress.length; i++) {
            const progress = this._cfg.starProgress[i];
            if (star >= progress) {
                prevProgress = progress;
                totalProgress += unitProgress;
            } else {
                nextProgress = progress;
                break;
            }
        }

        if (totalProgress === 1) {
            return totalProgress;
        }

        const range = Math.max(prevProgress, nextProgress) - prevProgress;
        let additionalProgress = 0;
        
        if (range > 0) {
            additionalProgress = (star - prevProgress) / range * unitProgress;
        }

        return totalProgress + additionalProgress;
    }

    getPos(index: number, total: number): Vec3 {
        const width = this.lineNode!.width * (index / total);
        return new Vec3(width, 0, 0);
    }

    getGiftItem(index: number): GiftItem {
        if (this.giftItems[index]) {
            return this.giftItems[index];
        }

        const giftItem = instantiate(this.giftPrefab!).getComponent(GiftItem)!;
        this.giftItems[index] = giftItem;
        return giftItem;
    }

    hideGiftItem(startIndex: number) {
        for (let i = startIndex + 1; i < this.giftItems.length; i++) {
            if (this.giftItems[i]) {
                this.giftItems[i].node.active = false;
            }
        }
    }

    showStarFlyAnim(sourcePos: any, itemId: number, result: number, change: number) {
        MgrUser.Instance.userData.flyAddItem({
            itemId: itemId,
            change: change,
            result: result,
            sourcePos: sourcePos
        });
    }
}
import { _decorator, Color, Node, Button, Sprite, Label, Tween, tween, v3, Vec3, Component, cclegacy } from 'cc';
import { MgrChallengeStorage } from './MgrChallengeStorage';
import { MgrChallenge } from './MgrChallenge';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import { includes } from 'lodash-es';

const { ccclass, property } = _decorator;

const GRAY_COLOR = new Color();
Color.fromHEX(GRAY_COLOR, '#B0B0B0');

@ccclass('GiftItem')
export class GiftItem extends Component {
    @property(Node)
    lightNode: Node | null = null;

    @property(Button)
    giftBtn: Button | null = null;

    @property(Sprite)
    topSprite: Sprite | null = null;

    @property(Sprite)
    bottomSprite: Sprite | null = null;

    @property(Label)
    pointLabel: Label | null = null;

    @property(Node)
    earnTag: Node | null = null;

    private _cfg: any = null;
    private _idx = 0;
    private _color = new Color();

    onLoad() {
        this.giftBtn!.node.on('click', this.onGiftBtn, this);
        this._startLightAction();
    }

    showItem(cfg: any, idx: number) {
        this._cfg = cfg;
        this._idx = idx;
        this.pointLabel!.string = '' + this._cfg.starProgress[idx];
        this.showBox();
    }

    showBox() {
        const startTime = moment(MgrChallenge.Instance.curTime).startOf('month').startOf('day').valueOf();
        const starData = MgrChallengeStorage.Instance.getStarData(startTime);
        
        this.earnTag!.active = false;
        this.lightNode!.active = false;
        Tween.stopAllByTarget(this.giftBtn!.node);
        this.giftBtn!.node.angle = 0;

        if (starData) {
            const targetStars = this._cfg.starProgress[this._idx];
            if (starData.star >= targetStars) {
                if (includes(starData.earnList, targetStars)) {
                    this.showEarn();
                } else {
                    this.showMore();
                }
            } else {
                this.showLess();
            }
        } else {
            this.showLess();
        }
    }

    showMore() {
        this.topSprite!.color = Color.WHITE;
        this.bottomSprite!.color = Color.WHITE;
        this.lightNode!.active = true;
        
        tween(this.giftBtn!.node)
            .delay(1.5)
            .to(0.08, { scale: v3(1.1, 1.1, 1.1) })
            .to(0.06, { angle: 10 })
            .to(0.12, { angle: -10 })
            .to(0.12, { angle: 10 })
            .to(0.12, { angle: -10 })
            .to(0.06, { angle: 0 })
            .to(0.08, { scale: Vec3.ONE })
            .union()
            .repeatForever()
            .start();
    }

    private _startLightAction() {
        tween(this.lightNode)
            .set({ eulerAngles: v3(0, 0, 0) })
            .to(18, { eulerAngles: v3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }

    showLess() {
        this.topSprite!.color = GRAY_COLOR;
        this.bottomSprite!.color = GRAY_COLOR;
    }

    showEarn() {
        this.topSprite!.color = GRAY_COLOR;
        this.bottomSprite!.color = GRAY_COLOR;
        this.earnTag!.active = true;
    }

    onGiftBtn() {
        const reward = this._cfg.rewards.split(',')[this._idx];
        const targetStars = this._cfg.starProgress[this._idx];
        const startTime = moment(MgrChallenge.Instance.curTime).startOf('month').startOf('day').valueOf();
        const starData = MgrChallengeStorage.Instance.getStarData(startTime);

        if (starData && starData.star >= targetStars) {
            MgrUi.Instance.addViewAsyncQueue(UIPrefabs.CommonDoubleView, {
                root: MgrUi.root(2),
                data: {
                    reward: reward,
                    adType: 'AdStartChest',
                    getSource: 'ChanllengeStarChest'
                }
            });
            MgrChallengeStorage.Instance.earnStarReward(startTime, targetStars);
            this.showBox();
        } else {
            this.showDetailView(reward);
        }
    }

    showDetailView(reward: string) {
        MgrUi.Instance.openViewAsync(UIPrefabs.StreakDetailView, {
            priority: 2,
            data: {
                reward: reward,
                target: this.giftBtn!.node
            }
        });
    }
}
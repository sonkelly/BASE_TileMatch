import { _decorator, Component, Node, Sprite, SpriteFrame, Button, Label, Color, Vec4, cclegacy } from 'cc';
import { UIIcon } from './UIIcon';
import { MgrPass } from './MgrPass';
import { AssetsCfg } from './AssetsCfg';
import { MgrUser } from './MgrUser';
import { Toast } from './Toast';
import { Language } from './Language';
import { AdsManager } from './AdsManager';

const { ccclass, property } = _decorator;

@ccclass('passRewardItem')
export class passRewardItem extends Component {
    @property(Sprite)
    bgSprite: Sprite | null = null;

    @property(SpriteFrame)
    freeFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    adFrame: SpriteFrame | null = null;

    @property(Button)
    freeBtn: Button | null = null;

    @property(Button)
    adBtn: Button | null = null;

    @property(UIIcon)
    rewardIcon: UIIcon | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Node)
    lockNode: Node | null = null;

    @property(Node)
    earnNode: Node | null = null;

    @property(Node)
    rdNode: Node | null = null;

    private isFree: boolean = false;
    private passData: any = null;
    private passCfg: any = null;

    onLoad() {
        this.freeBtn!.node.on('click', this.onFreeBtn, this);
        this.adBtn!.node.on('click', this.onAdBtn, this);
    }

    show(passCfg: any, isFree: boolean) {
        this.isFree = isFree;
        this.passCfg = passCfg;
        this.passData = MgrPass.Instance.data.getPassData(this.passCfg.level);
        this.hideTag();
        this.showItem();
        this.showReward();
    }

    showReward() {
        const item = this.getItem();
        this.rewardIcon!.icon = AssetsCfg.Instance.get(item.id).icon;
        this.countLabel!.string = 'x' + item.cnt;
    }

    getItem() {
        return {
            id: this.isFree ? this.passCfg.itemId1 : this.passCfg.itemId2,
            cnt: this.isFree ? this.passCfg.count1 : this.passCfg.count2
        };
    }

    hideTag() {
        this.freeBtn!.node.active = false;
        this.adBtn!.node.active = false;
        this.lockNode!.active = false;
        this.earnNode!.active = false;
        this.rdNode!.active = false;
    }

    showItem() {
        this.bgSprite!.spriteFrame = this.isFree ? this.freeFrame : this.adFrame;
        this.rewardIcon!.getComponent(Sprite)!.color = Color.WHITE;

        if (MgrPass.Instance.data.passLevel < this.passCfg.totalLv) {
            this.lockNode!.active = true;
            this.rewardIcon!.getComponent(Sprite)!.color = Color.fromVec4(new Vec4(0.75, 0.75, 0.75, 1));
        } else if (this.isFree && this.passData.free) {
            this.earnNode!.active = true;
        } else if (this.isFree && !this.passData.free) {
            this.freeBtn!.node.active = true;
            this.rdNode!.active = true;
        } else if (!this.isFree && !this.passData.ad) {
            this.adBtn!.node.active = true;
        } else if (!this.isFree && this.passData.ad) {
            this.earnNode!.active = true;
        }
    }

    onFreeBtn() {
        const item = this.getItem();
        MgrUser.Instance.userData.addItem(item.id, item.cnt, {
            sourcePos: this.rewardIcon!.node.getWorldPosition(),
            type: 'PassReward'
        });
        MgrPass.Instance.data.earnPassFree(this.passCfg.level);
        MgrPass.Instance.reportPassEarn({
            Pass_Level: this.passCfg.level,
            Reward: item.id + '|' + item.cnt,
            RewardType: 0,
            Pass_Period: MgrPass.Instance.getRepeatId()
        });
        this.show(this.passCfg, this.isFree);
    }

    onAdBtn() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'Pass',
            AdsType: 'AdPassReward',
            onSucceed: () => {
                const item = this.getItem();
                MgrUser.Instance.userData.addItem(item.id, item.cnt, {
                    sourcePos: this.rewardIcon!.node.getWorldPosition(),
                    type: 'PassReward'
                });
                MgrPass.Instance.data.earnPassAd(this.passCfg.level);
                MgrPass.Instance.reportPassEarn({
                    Pass_Level: this.passCfg.level,
                    Reward: item.id + '|' + item.cnt,
                    RewardType: 1,
                    Pass_Period: MgrPass.Instance.getRepeatId()
                });
                this.show(this.passCfg, this.isFree);
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }
}
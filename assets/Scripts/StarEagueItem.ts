import { _decorator, Component, Node, Sprite, SpriteFrame, Label, Button, sp, tween, Tween, Vec3, v3, easing, Color } from 'cc';
import { UIPrefabs } from './Prefabs';
import {AssetsCfg} from './AssetsCfg';
import {AvatarCfg} from './AvatarCfg';
import {RankNameCfg} from './RankNameCfg';
import StarLeagueCfg from './StarLeagueCfg';
import { RankShowSpIndex, RankNickColorSelf, outlineColor2, RankNickColorOther, RankStarColorSelf, RankStarColorOther, RankIndexColorSelf, RankIndexColorOther } from './RankData';
import { StarEagueRewardBox, MgrStar, StarEagleStageLevel, StarEagleRewardState, StarEagueRewardItem } from './MgrStar';
import {MgrUi} from './MgrUi';
import { MgrUser } from './MgrUser';
import { CommonAvatarFrame } from './CommonAvatarFrame';
import { CommonAvatarFrame2 } from './CommonAvatarFrame2';

const { ccclass, property } = _decorator;

@ccclass('StarEagueItem')
export class StarEagueItem extends Component {
    @property(SpriteFrame)
    spRankIndex1: SpriteFrame | null = null;

    @property(SpriteFrame)
    spRankIndex2: SpriteFrame | null = null;

    @property(SpriteFrame)
    spRankIndex3: SpriteFrame | null = null;

    @property(Sprite)
    rankSp: Sprite | null = null;

    @property(SpriteFrame)
    guaRankIndex1: SpriteFrame | null = null;

    @property(SpriteFrame)
    guaRankIndex2: SpriteFrame | null = null;

    @property(SpriteFrame)
    guaRankIndex3: SpriteFrame | null = null;

    @property(Sprite)
    rankGuaSp: Sprite | null = null;

    @property(Label)
    rankNumLabel: Label | null = null;

    @property(Node)
    rankNumLabelNode: Node | null = null;

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    starLabel: Label | null = null;

    @property(Button)
    rewardBoxBtn: Button | null = null;

    @property(Node)
    rewardNode: Node | null = null;

    @property(sp.Skeleton)
    rewardSpine: sp.Skeleton | null = null;

    @property(Sprite)
    rewardIcon: Sprite | null = null;

    @property(Label)
    rewardLabel: Label | null = null;

    @property(Sprite)
    head: Sprite | null = null;

    @property(Node)
    rankNode: Node | null = null;

    @property(Node)
    tipNode: Node | null = null;

    @property(Node)
    tipUpNode: Node | null = null;

    @property(Node)
    tipDownNode: Node | null = null;

    @property(Sprite)
    itemBg: Sprite | null = null;

    @property(SpriteFrame)
    selfFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    otherFrame: SpriteFrame | null = null;

    @property(CommonAvatarFrame)
    avatarHead: CommonAvatarFrame | null = null;

    @property(CommonAvatarFrame2)
    avatarDown: CommonAvatarFrame2 | null = null;

    private _data: any = null;

    get data(): any {
        return this._data;
    }

    onLoad() {
        this.rewardBoxBtn!.node.on('click', this._onRewardBoxBtn, this);
    }

    async refreshRankData(data: any) {
        this._data = data;
        if (data.tipUp) {
            this._showTipUp();
        } else if (data.tipDown) {
            this._showTipDown();
        } else {
            this._showRank(data);
        }
    }

    private _showTipUp() {
        this.rankNode!.active = false;
        this.tipNode!.active = true;
        this.tipUpNode!.active = true;
        this.tipDownNode!.active = false;
    }

    private _showTipDown() {
        this.rankNode!.active = false;
        this.tipNode!.active = true;
        this.tipUpNode!.active = false;
        this.tipDownNode!.active = true;
    }

    private async _showRank(data: any) {
        this.rankNode!.active = true;
        this.tipNode!.active = false;

        if (data.me) {
            this.nameLabel!.color = Color.fromHEX(RankNickColorSelf);
            this.nameLabel!.outlineColor = Color.fromHEX(outlineColor2);
            this.avatarHead!.show();
            this.avatarDown!.show();
            this.itemBg!.spriteFrame = this.selfFrame;
        } else {
            this.nameLabel!.color = Color.fromHEX(RankNickColorOther);
            this.nameLabel!.outlineColor = Color.fromHEX(outlineColor2);
            this.itemBg!.spriteFrame = this.otherFrame;
            this.avatarHead!.hide();
            this.avatarDown!.hide();
        }

        let name = '';
        if (data.me) {
            name = MgrUser.Instance.userData.userName;
        } else {
            name = RankNameCfg.Instance.get(data.id).name;
        }
        this.nameLabel!.string = name;

        this.starLabel!.color = data.me ? Color.fromHEX(RankStarColorSelf) : Color.fromHEX(RankStarColorOther);
        this.setStar(data.star);

        this.rankNumLabel!.color = data.me ? Color.fromHEX(RankIndexColorSelf) : Color.fromHEX(RankIndexColorOther);
        this.setRank(data.rank, data.me);

        if (data.rank <= StarEagueRewardBox) {
            this.rewardSpine!.node.active = true;
            this.rewardIcon!.node.active = false;
            this.rewardNode!.active = true;
            this.rewardLabel!.node.active = true;

            const level = Math.ceil(MgrStar.Instance.starData.level / StarEagleStageLevel);
            const animName = MgrStar.Instance.getRewardAnimationName(level, data.rank, StarEagleRewardState.LOOP);
            this.rewardSpine!.setAnimation(0, animName, true);
        } else if (data.rank <= StarEagueRewardItem) {
            this.rewardSpine!.node.active = false;
            this.rewardNode!.active = true;
            this.rewardIcon!.node.active = true;
            this.rewardLabel!.node.active = true;

            const level = Math.ceil(MgrStar.Instance.starData.level / StarEagleStageLevel);
            const cfg = StarLeagueCfg.Instance.get(level);
            this.rewardLabel!.string = cfg.rewards4[0].count.toString();
            this.rewardIcon!.spriteFrame = await AssetsCfg.Instance.getIconSpriteframe(cfg.rewards4[0].id);
        } else {
            this.rewardSpine!.node.active = false;
            this.rewardNode!.active = false;
            this.rewardIcon!.node.active = false;
            this.rewardLabel!.node.active = false;
        }

        this.head!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(data.head);
    }

    setRank(rank: number, isMe: boolean) {
        if (rank <= RankShowSpIndex) {
            this.rankNumLabelNode!.active = false;
            this.rankNumLabel!.node.active = false;
            this.rankSp!.node.active = true;
            this.rankGuaSp!.node.active = true;
            this.rankSp!.spriteFrame = this[`spRankIndex${rank}` as keyof this] as SpriteFrame;
            this.rankGuaSp!.spriteFrame = this[`guaRankIndex${rank}` as keyof this] as SpriteFrame;
        } else {
            this.rankNumLabelNode!.active = isMe;
            this.rankSp!.node.active = false;
            this.rankGuaSp!.node.active = false;
            this.rankNumLabel!.node.active = true;
            this.rankNumLabel!.string = '' + rank;
        }
    }

    setStar(star: number) {
        this.starLabel!.string = '' + star;
    }

    private _onRewardBoxBtn() {
        if (this._data.rank > StarEagueRewardBox) return;

        const level = Math.ceil(MgrStar.Instance.starData.level / StarEagleStageLevel);
        const rewards = StarLeagueCfg.Instance.get(level)[`rewards${this._data.rank}` as keyof any];
        MgrUi.Instance.openViewAsync(UIPrefabs.UIPopAssetList, {
            priority: 2,
            data: {
                assets: rewards,
                target: this.rewardBoxBtn!.node
            }
        });
    }

    playStarChange(from: number, to: number, callback?: Function) {
        const target = { value: from };
        this.starLabel!.string = '' + from;

        tween(target)
            .to(0.5, { value: to }, {
                onUpdate: () => {
                    this.starLabel!.string = '' + Math.floor(target.value);
                }
            })
            .call(() => {
                this.starLabel!.string = '' + to;
            })
            .start();

        Tween.stopAllByTarget(this.starLabel!.node.parent!);
        tween(this.starLabel!.node.parent!)
            .to(0.2, { scale: v3(1.3, 1.3, 1.3) })
            .delay(0.3)
            .to(0.2, { scale: Vec3.ONE })
            .call(() => {
                callback && callback();
            })
            .start();
    }

    playEnter() {
        Tween.stopAllByTarget(this.node);
        this.node.scale = v3(0.5, 0.5, 0.5);
        tween(this.node)
            .to(0.3, { scale: Vec3.ONE }, { easing: easing.backOut })
            .start();
    }
}
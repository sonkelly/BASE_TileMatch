import { _decorator, Component, Node, SpriteFrame, Sprite, Label, Button, sp, Color } from 'cc';
import { UIPrefabs } from './Prefabs';
import {AssetsCfg} from './AssetsCfg';
import {AvatarCfg} from './AvatarCfg';
import {RankNameCfg} from './RankNameCfg';
import StarLeagueCfg from './StarLeagueCfg';
import { RankNickColorSelf, outlineColor2, RankNickColorOther, RankStarColorSelf, RankStarColorOther, RankIndexColorSelf, RankIndexColorOther, RankShowSpIndex } from './RankData';
import { StarEagueRewardBox, MgrStar, StarEagleStageLevel, StarEagleRewardState, StarEagueRewardItem } from './MgrStar';
import {MgrUi} from './MgrUi';
import { MgrUser } from './MgrUser';
import { CommonAvatarFrame } from './CommonAvatarFrame';
import { CommonAvatarFrame2 } from './CommonAvatarFrame2';

const { ccclass, property } = _decorator;

@ccclass('StarEagueItemSelf')
export class StarEagueItemSelf extends Component {
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

    @property(CommonAvatarFrame)
    avatarHead: CommonAvatarFrame | null = null;

    @property(CommonAvatarFrame2)
    avatarDown: CommonAvatarFrame2 | null = null;

    private _data: any = null;

    onLoad() {
        this.rewardBoxBtn!.node.on('click', this._onRewardBoxBtn, this);
    }

    async refreshRankData(data: any) {
        this._data = data;

        if (data.me) {
            this.nameLabel!.color = Color.fromHEX(RankNickColorSelf);
            this.nameLabel!.outlineColor = Color.fromHEX(outlineColor2);
            this.avatarHead!.show();
            this.avatarDown!.show();
        } else {
            this.nameLabel!.color = Color.fromHEX(RankNickColorOther);
            this.nameLabel!.outlineColor = Color.fromHEX(outlineColor2);
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
        this.starLabel!.string = '' + data.star;
        this.starLabel!.color = data.me ? Color.fromHEX(RankStarColorSelf) : Color.fromHEX(RankStarColorOther);
        this.rankNumLabel!.color = data.me ? Color.fromHEX(RankIndexColorSelf) : Color.fromHEX(RankIndexColorOther);

        const rank = data.rank;
        if (rank <= RankShowSpIndex) {
            this.rankNumLabelNode!.active = false;
            this.rankSp!.node.active = true;
            this.rankGuaSp!.node.active = true;
            this.rankSp!.spriteFrame = this['spRankIndex' + rank];
            this.rankGuaSp!.spriteFrame = this['guaRankIndex' + rank];
        } else {
            this.rankNumLabelNode!.active = true;
            this.rankGuaSp!.node.active = false;
            this.rankSp!.node.active = false;
            this.rankNumLabel!.string = '' + data.rank;
        }

        if (data.rank <= StarEagueRewardBox) {
            this.rewardNode!.active = true;
            this.rewardSpine!.node.active = true;
            this.rewardIcon!.node.active = false;
            this.rewardLabel!.node.active = false;

            const level = Math.ceil(MgrStar.Instance.starData.level / StarEagleStageLevel);
            const animationName = MgrStar.Instance.getRewardAnimationName(level, data.rank, StarEagleRewardState.LOOP);
            this.rewardSpine!.setAnimation(0, animationName, true);
        } else if (data.rank <= StarEagueRewardItem) {
            this.rewardNode!.active = true;
            this.rewardSpine!.node.active = false;
            this.rewardIcon!.node.active = true;
            this.rewardLabel!.node.active = true;

            const level = Math.ceil(MgrStar.Instance.starData.level / StarEagleStageLevel);
            const cfg = StarLeagueCfg.Instance.get(level);
            this.rewardLabel!.string = cfg.rewards4[0].count.toString();
            this.rewardIcon!.spriteFrame = await AssetsCfg.Instance.getIconSpriteframe(cfg.rewards4[0].id);
        } else {
            this.rewardNode!.active = false;
            this.rewardSpine!.node.active = false;
            this.rewardIcon!.node.active = false;
            this.rewardLabel!.node.active = false;
        }

        this.head!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(MgrUser.Instance.userData.userHead);
    }

    private _onRewardBoxBtn() {
        if (this._data.rank > StarEagueRewardBox) return;

        const level = Math.ceil(MgrStar.Instance.starData.level / StarEagleStageLevel);
        const rewards = StarLeagueCfg.Instance.get(level)['rewards' + this._data.rank];
        
        MgrUi.Instance.openViewAsync(UIPrefabs.UIPopAssetList, {
            priority: 2,
            data: {
                assets: rewards,
                target: this.rewardBoxBtn!.node
            }
        });
    }
}
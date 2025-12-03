import { _decorator, Component, SpriteFrame, Sprite, Node, Label, Button, director, VerticalTextAlignment } from 'cc';
import { GlobalEvent } from './Events';
import {AvatarCfg} from './AvatarCfg';
import { MgrUser } from './MgrUser';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { GtRankShowSpIndex } from './MgrGoldTournament';
import {GoldRankV2Cfg} from './GoldRankV2Cfg';
import {GoldRankRewardV2Cfg} from './GoldRankRewardV2Cfg';
import {AssetsCfg} from './AssetsCfg';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentV2SelfPanel')
export class GoldTournamentV2SelfPanel extends Component {
    @property(SpriteFrame)
    spRankIndex1: SpriteFrame | null = null;

    @property(SpriteFrame)
    spRankIndex2: SpriteFrame | null = null;

    @property(SpriteFrame)
    spRankIndex3: SpriteFrame | null = null;

    @property(SpriteFrame)
    spGua1: SpriteFrame | null = null;

    @property(SpriteFrame)
    spGua2: SpriteFrame | null = null;

    @property(SpriteFrame)
    spGua3: SpriteFrame | null = null;

    @property(Sprite)
    rankSp: Sprite | null = null;

    @property(Node)
    rankNumNode: Node | null = null;

    @property(Label)
    rankNumLabel: Label | null = null;

    @property(Sprite)
    headSp: Sprite | null = null;

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    cubeLabel: Label | null = null;

    @property(Button)
    btnHead: Button | null = null;

    @property(Button)
    btnName: Button | null = null;

    @property(Sprite)
    rankGuaSp: Sprite | null = null;

    @property(Node)
    rewardNode: Node | null = null;

    @property(Node)
    rewardGoldFlower: Node | null = null;

    @property(Label)
    rewardGoldFlowerCnt: Label | null = null;

    @property(Sprite)
    rewardItemSp: Sprite | null = null;

    @property(Label)
    rewardItemCnt: Label | null = null;

    onLoad() {
        this.btnHead.node.on('click', this._openUserInfo, this);
        this.btnName.node.on('click', this._openUserInfo, this);
    }

    onEnable() {
        director.on(GlobalEvent.refreshAvatar, this._refreshSelfInfo, this);
        director.on(GlobalEvent.refreshNick, this._refreshSelfInfo, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    private _refreshSelfInfo() {
        (async () => {
            this.headSp.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(MgrUser.Instance.userData.userHead);
            this.nameLabel.string = MgrUser.Instance.userData.userName;
        })();
    }

    private _openUserInfo() {
        (async () => {
            await MgrUi.Instance.openViewAsync(UIPrefabs.UserDetailView, {
                root: MgrUi.root(1),
                data: UIPrefabs.GoldTournamentV2View.url
            });
        })();
    }

    refreshSelfRank(rankData: any) {
        this._refreshSelfInfo();
        this.cubeLabel.string = '' + rankData.cube;
        const rank = rankData.rank;

        if (rank <= GtRankShowSpIndex) {
            this.rankSp.node.active = true;
            this.rankNumNode.active = false;
            this.rankSp.spriteFrame = this['spRankIndex' + rank];
            this.rankGuaSp.node.active = true;
            this.rankGuaSp.spriteFrame = this['spGua' + rank];
        } else {
            this.rankGuaSp.node.active = false;
            this.rankSp.node.active = false;
            this.rankNumNode.active = true;
            if (rank > GoldRankV2Cfg.Instance.getRankPlayerShowCnt()) {
                this.rankNumLabel.string = '...';
                this.rankNumLabel.verticalAlign = VerticalTextAlignment.TOP;
            } else {
                this.rankNumLabel.string = '' + rank;
                this.rankNumLabel.verticalAlign = VerticalTextAlignment.CENTER;
            }
        }

        const reward = GoldRankRewardV2Cfg.Instance.getRewardById(rank);
        if (reward) {
            this.rewardGoldFlowerCnt.string = reward.flower > 0 ? 'x' + reward.flower : 'x0';
            this.rewardItemSp.node.active = reward.itemId >= 0;
            this.rewardItemCnt.string = reward.itemId >= 0 ? 'x' + reward.itemCount : 'x0';
            if (reward.itemId >= 0) {
                this.rewardItemSp.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(reward.itemId);
            }
        } else {
            this.rewardGoldFlowerCnt.string = 'x0';
            this.rewardItemSp.node.active = false;
        }
    }
}
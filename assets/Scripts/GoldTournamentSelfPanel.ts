import { _decorator, Component, Node, Sprite, SpriteFrame, Label, Button, director, VerticalTextAlignment } from 'cc';
import { GlobalEvent } from './Events';
import {AvatarCfg} from './AvatarCfg';
import { MgrUser } from './MgrUser';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { GtRankShowSpIndex } from './MgrGoldTournament';
import {GoldRankCfg} from './GoldRankCfg';
import {GoldRankRewardCfg} from './GoldRankRewardCfg';
import {AssetsCfg} from './AssetsCfg';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentSelfPanel')
export class GoldTournamentSelfPanel extends Component {
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

    @property(Sprite)
    rewardGoldFlower: Sprite | null = null;

    @property(Label)
    rewardGoldFlowerCnt: Label | null = null;

    @property(Sprite)
    rewardItemSp: Sprite | null = null;

    @property(Label)
    rewardItemCnt: Label | null = null;

    onLoad() {
        this.btnHead!.node.on('click', this._openUserInfo, this);
        this.btnName!.node.on('click', this._openUserInfo, this);
    }

    onEnable() {
        director.on(GlobalEvent.refreshAvatar, this._refreshSelfInfo, this);
        director.on(GlobalEvent.refreshNick, this._refreshSelfInfo, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    private async _refreshSelfInfo() {
        this.nameLabel!.string = MgrUser.Instance.userData.userName;
        this.headSp!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(MgrUser.Instance.userData.userHead);
    }

    private async _openUserInfo() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.UserDetailView, {
            root: MgrUi.root(1),
            data: UIPrefabs.GoldTournamentView.url
        });
    }

    refreshSelfRank(rankData: any) {
        this._refreshSelfInfo();
        this.cubeLabel!.string = '' + rankData.cube;

        const rank = rankData.rank;
        if (rank <= GtRankShowSpIndex) {
            this.rankSp!.node.active = true;
            this.rankNumNode!.active = false;
            this.rankSp!.spriteFrame = this['spRankIndex' + rank] as SpriteFrame;
            this.rankGuaSp!.node.active = true;
            this.rankGuaSp!.spriteFrame = this['spGua' + rank] as SpriteFrame;
        } else {
            this.rankGuaSp!.node.active = false;
            this.rankSp!.node.active = false;
            this.rankNumNode!.active = true;
            
            if (rank > GoldRankCfg.Instance.getRankPlayerShowCnt()) {
                this.rankNumLabel!.string = '...';
                this.rankNumLabel!.verticalAlign = VerticalTextAlignment.TOP;
            } else {
                this.rankNumLabel!.string = '' + rankData.rank;
                this.rankNumLabel!.verticalAlign = VerticalTextAlignment.CENTER;
            }
        }

        const reward = GoldRankRewardCfg.Instance.getRewardById(rankData.rank);
        if (reward) {
            this.rewardGoldFlowerCnt!.string = reward.flower > 0 ? 'x' + reward.flower : 'x0';
            this.rewardItemSp!.node.active = reward.itemId >= 0;
            this.rewardItemCnt!.string = reward.itemId >= 0 ? 'x' + reward.itemCount : 'x0';
            
            if (reward.itemId >= 0) {
                this.rewardItemSp!.spriteFrame = AssetsCfg.Instance.getIconSpriteframe(reward.itemId);
            }
        } else {
            this.rewardGoldFlowerCnt!.string = 'x0';
            this.rewardItemSp!.node.active = false;
        }
    }
}
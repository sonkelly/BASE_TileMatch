import { _decorator, Component, Node, Sprite, SpriteFrame, Label, Color } from 'cc';
import { MgrGoldTournament } from './MgrGoldTournament';
import { AvatarCfg } from './AvatarCfg';
import { MgrUser } from './MgrUser';
import { RankAiNameCfg } from './RankAiNameCfg';
import { GoldRankCfg } from './GoldRankCfg';
import { GoldRankRewardCfg } from './GoldRankRewardCfg';
import { AssetsCfg } from './AssetsCfg';

const { ccclass, property } = _decorator;

@ccclass('GoldTournamentViewItem')
export class GoldTournamentViewItem extends Component {
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

    @property(SpriteFrame)
    avatarBgSelf: SpriteFrame | null = null;

    @property(SpriteFrame)
    avatarBgOther: SpriteFrame | null = null;

    @property(SpriteFrame)
    rankBgSelf: SpriteFrame | null = null;

    @property(SpriteFrame)
    rankBgOther: SpriteFrame | null = null;

    @property(Sprite)
    rankSp: Sprite | null = null;

    @property(Sprite)
    rankGuaSp: Sprite | null = null;

    @property(Node)
    rankNumNode: Node | null = null;

    @property(Label)
    rankNumLabel: Label | null = null;

    @property(Sprite)
    headBg: Sprite | null = null;

    @property(Sprite)
    headSp: Sprite | null = null;

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    cubeLabel: Label | null = null;

    @property(Sprite)
    rankBgSp: Sprite | null = null;

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

    @property(Node)
    avatarFrame1: Node | null = null;

    @property(Node)
    avatarFrame2: Node | null = null;

    async updateHead(head: string) {
        this.headSp!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(head);
    }

    refreshRankData(data: any) {
        this.updateHead(data.head);
        this.headBg!.spriteFrame = data.me ? this.avatarBgSelf : this.avatarBgOther;
        this.nameLabel!.color = data.me ? Color.fromHEX(MgrGoldTournament.GtRankNickColorSelf) : Color.fromHEX(MgrGoldTournament.GtRankNickColorOther);

        let name = '';
        if (data.me) {
            name = MgrUser.Instance.userData.userName;
        } else {
            name = RankAiNameCfg.Instance.get(data.id).AllName;
        }
        this.nameLabel!.string = name;

        this.rankBgSp!.spriteFrame = data.me ? this.rankBgSelf : this.rankBgOther;
        this.cubeLabel!.string = '' + data.cube;

        const rank = data.rank;
        if (rank <= MgrGoldTournament.GtRankShowSpIndex) {
            this.rankNumNode!.active = false;
            this.rankNumLabel!.node.active = false;
            this.rankSp!.node.active = true;
            this.rankSp!.spriteFrame = this[`spRankIndex${rank}` as keyof GoldTournamentViewItem] as SpriteFrame;
            this.rankGuaSp!.node.active = true;
            this.rankGuaSp!.spriteFrame = this[`spGua${rank}` as keyof GoldTournamentViewItem] as SpriteFrame;
        } else {
            this.rankSp!.node.active = false;
            this.rankGuaSp!.node.active = false;
            this.rankNumNode!.active = true;
            this.rankNumNode!.active = data.me;
            this.rankNumLabel!.node.active = true;
            this.rankNumLabel!.color = data.me ? Color.fromHEX(MgrGoldTournament.GtRankIndexColorSelf) : Color.fromHEX(MgrGoldTournament.GtRankIndexColorOther);

            const showCnt = GoldRankCfg.Instance.getRankPlayerShowCnt();
            this.rankNumLabel!.string = rank > showCnt ? '...' : '' + data.rank;
        }

        const reward = GoldRankRewardCfg.Instance.getRewardById(data.rank);
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

        if (data.me) {
            this.avatarFrame1!.active = true;
            this.avatarFrame2!.active = true;
        } else {
            this.avatarFrame1!.active = false;
            this.avatarFrame2!.active = false;
        }
    }
}
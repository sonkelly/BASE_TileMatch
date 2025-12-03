import { _decorator, Component, SpriteFrame, Sprite, Node, Label, Button, director, VerticalTextAlignment } from 'cc';
const { ccclass, property } = _decorator;

import { MgrRank } from './MgrRank';
import { RankShowSpIndex } from './RankData';
import {RankCfg} from './RankCfg';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { GlobalEvent } from './Events';
import {UIUtil} from './UIUtil';
import { SdkBridge } from './SdkBridge';

@ccclass('RankViewSelfPanel')
export class RankViewSelfPanel extends Component {
    @property(SpriteFrame)
    spRankIndex1: SpriteFrame | null = null;

    @property(SpriteFrame)
    spRankIndex2: SpriteFrame | null = null;

    @property(SpriteFrame)
    spRankIndex3: SpriteFrame | null = null;

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
    wisdomLabel: Label | null = null;

    @property(Button)
    btnHead: Button | null = null;

    @property(Button)
    btnName: Button | null = null;

    @property(SpriteFrame)
    spGua1: SpriteFrame | null = null;

    @property(SpriteFrame)
    spGua2: SpriteFrame | null = null;

    @property(SpriteFrame)
    spGua3: SpriteFrame | null = null;

    @property(Sprite)
    rankGuaSp: Sprite | null = null;

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

    async _refreshSelfInfo() {
        if (this.nameLabel) {
            this.nameLabel.string = SdkBridge.getPlayerName();
        }
        // loadHead may be async, await to ensure avatar updated
        await UIUtil.loadHead(SdkBridge.getPlayerPhotoUrl(), this.headSp || undefined);
    }

    async _openUserInfo() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.UserDetailView, {
            root: MgrUi.root(1),
            data: UIPrefabs.RankView.url
        });
    }

    refreshSelfRank(data: { wisdom: number; rank: number; }) {
        this._refreshSelfInfo();
        if (this.wisdomLabel) {
            this.wisdomLabel.string = '' + data.wisdom;
        }

        const rank = data.rank;
        if (rank <= RankShowSpIndex) {
            if (this.rankSp) {
                this.rankSp.node.active = true;
                // dynamic access to spRankIndexN
                const sf = (this as any)['spRankIndex' + rank] as SpriteFrame | null;
                this.rankSp.spriteFrame = sf || null;
            }
            if (this.rankNumNode) {
                this.rankNumNode.active = false;
            }
            if (this.rankGuaSp) {
                this.rankGuaSp.node.active = true;
                const guaSf = (this as any)['spGua' + rank] as SpriteFrame | null;
                this.rankGuaSp.spriteFrame = guaSf || null;
            }
        } else {
            if (this.rankGuaSp) {
                this.rankGuaSp.node.active = false;
            }
            if (this.rankSp) {
                this.rankSp.node.active = false;
            }
            if (this.rankNumNode) {
                this.rankNumNode.active = true;
            }
            const showCnt = RankCfg.Instance.getRankPlayerShowCnt(MgrRank.Instance.rankType);
            if (rank > showCnt) {
                if (this.rankNumLabel) {
                    this.rankNumLabel.string = '...';
                    this.rankNumLabel.verticalAlign = VerticalTextAlignment.TOP;
                }
            } else {
                if (this.rankNumLabel) {
                    this.rankNumLabel.string = '' + rank;
                    this.rankNumLabel.verticalAlign = VerticalTextAlignment.CENTER;
                }
            }
        }
    }
}
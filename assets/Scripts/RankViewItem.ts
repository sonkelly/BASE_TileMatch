import { _decorator, Component, Node, Sprite, SpriteFrame, Label, Button, Tween, Vec3, tween, easing, director, Color } from 'cc';
import { RankNickColorSelf, RankNickColorOther, RankType, RankShowSpIndex, RankIndexColorSelf, RankIndexColorOther } from './RankData';
import {AvatarCfg} from './AvatarCfg';
import { MgrUser } from './MgrUser';
import { MgrRank } from './MgrRank';
import {RankCfg} from './RankCfg';
import {RankAiNameCfg} from './RankAiNameCfg';
import {UIUtil} from './UIUtil';
import { SdkBridge } from './SdkBridge';
import { GlobalEvent } from './Events';
import { GameConst, ITEM } from './GameConst';
import { NativeBridge } from './NativeBridge';
import { UIPrefabs } from './Prefabs';
import { MgrGame } from './MgrGame';
import {MgrUi} from './MgrUi';
import { SocialManager, SocialMgr } from './SocialManager';
import { AppGame } from './AppGame';
import { MgrBattleLevel } from './MgrBattleLevel';
import { InviteReportPoint } from './ReportEventEnum';

const { ccclass, property } = _decorator;

@ccclass('RankViewItem')
export class RankViewItem extends Component {
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
    wisdomBgSelf: SpriteFrame | null = null;

    @property(SpriteFrame)
    wisdomBgOther: SpriteFrame | null = null;

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

    @property(Sprite)
    wisdomBg: Sprite | null = null;

    @property(Label)
    wisdomLabel: Label | null = null;

    @property(Sprite)
    rankBgSp: Sprite | null = null;

    @property(Node)
    avatarFrame: Node | null = null;

    @property(Node)
    avatarFrame2: Node | null = null;

    @property(Button)
    shareBtn: Button | null = null;

    @property(Button)
    playBtn: Button | null = null;

    private _playClickHandle() {
        const action = async () => {
            AppGame.topUI.clearBackFunc();
            MgrUi.Instance.closeAll();
            MgrGame.Instance.enterLevel(null);
            director.emit(GlobalEvent.closeRankView);
            NativeBridge.Instance.showInterstitialIfCooldown({ OpenUi: 'MainLevel' });
        };

        const curLv = MgrGame.Instance.gameData.curLv;
        if (MgrBattleLevel.Instance.checkIsBattleLevel(curLv)) {
            action();
        } else {
            const condition = (curLv - GameConst.FriendListOpenLevel) % (GameConst.FriendListIntervalLevel + 1) != 0;
            if (curLv > GameConst.FriendListOpenLevel && condition) {
                if (SocialManager.shareNums % 2 == 0) {
                    SocialMgr.showShcialPop(async () => {
                        action();
                    });
                } else {
                    SocialMgr.showSocialList(async () => {
                        action();
                    }, null, InviteReportPoint.Rank);
                }
            } else {
                action();
            }
        }
    }

    private _shareClickHandle() {
        MgrUi.Instance.openViewAsync(UIPrefabs.UIShareSelf, {
            data: {
                icon: SdkBridge.getPlayerPhotoUrl(),
                score: MgrUser.Instance.userData.getItem(ITEM.Wisdom),
                shareType: 'Rank'
            }
        });
    }

    async updateHead(head: any, isMe: boolean = false) {
        if (isMe) {
            UIUtil.loadHead(SdkBridge.getPlayerPhotoUrl(), this.headSp!);
        } else if (typeof head === 'string') {
            UIUtil.loadHead(head, this.headSp!);
        } else {
            this.headSp!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(head);
        }
    }

    async refreshRankData(data: any, index: number) {
        await this.updateHead(data.head, data.me);
        
        this.headBg!.spriteFrame = data.me ? this.avatarBgSelf : this.avatarBgOther;
        this.nameLabel!.color = data.me ? Color.fromHEX(RankNickColorSelf) : Color.fromHEX(RankNickColorOther);
        
        let name: string;
        if (data.me) {
            name = MgrUser.Instance.userData.userName;
        } else {
            if (data.name) {
                name = data.name;
            } else {
                const aiCfg = RankAiNameCfg.Instance.get(data.id);
                name = MgrRank.Instance.rankType == RankType.Month ? aiCfg.MonthName : aiCfg.AllName;
            }
        }
        this.nameLabel!.string = name;
        
        this.rankBgSp!.spriteFrame = data.me ? this.rankBgSelf : this.rankBgOther;
        this.wisdomLabel!.string = '' + data.wisdom;
        this.wisdomBg!.spriteFrame = data.me ? this.wisdomBgSelf : this.wisdomBgOther;
        
        const rank = data.rank;
        if (rank <= RankShowSpIndex) {
            this.rankNumNode!.active = false;
            this.rankNumLabel!.node.active = false;
            this.rankSp!.node.active = true;
            this.rankSp!.spriteFrame = (this as any)[`spRankIndex${rank}`];
            this.rankGuaSp!.node.active = true;
            this.rankGuaSp!.spriteFrame = (this as any)[`spGua${rank}`];
        } else {
            this.rankSp!.node.active = false;
            this.rankGuaSp!.node.active = false;
            this.rankNumNode!.active = data.me;
            
            const showCnt = RankCfg.Instance.getRankPlayerShowCnt(MgrRank.Instance.rankType);
            this.rankNumLabel!.node.active = true;
            this.rankNumLabel!.color = data.me ? Color.fromHEX(RankIndexColorSelf) : Color.fromHEX(RankIndexColorOther);
            this.rankNumLabel!.string = rank > showCnt ? '...' : '' + data.rank;
        }
        
        if (data.me) {
            this.avatarFrame!.active = true;
            this.avatarFrame2!.active = true;
        } else {
            this.avatarFrame!.active = false;
            this.avatarFrame2!.active = false;
        }
        
        const isFriendRank = MgrRank.Instance.rankType == RankType.Friend;
        this.playBtn!.node.active = !data.me && isFriendRank;
        this.shareBtn!.node.active = data.me && isFriendRank;
    }

    playEnter() {
        Tween.stopAllByTarget(this.node);
        this.node.scale = Vec3.ZERO;
        tween(this.node)
            .to(0.5, { scale: Vec3.ONE }, { easing: easing.backOut })
            .start();
    }

    onEnable() {
        this.playBtn!.node.on('click', this._playClickHandle, this);
        this.shareBtn!.node.on('click', this._shareClickHandle, this);
    }

    onDisable() {
        this.playBtn!.node.off('click', this._playClickHandle, this);
        this.shareBtn!.node.off('click', this._shareClickHandle, this);
    }
}
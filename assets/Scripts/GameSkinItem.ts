import { _decorator, Component, Sprite, Label, SpriteFrame, Node, Button, ProgressBar, UITransform, director, instantiate, Vec3, cclegacy } from 'cc';
import { MgrSkin } from './MgrSkin';
import { SKIN_STATUS } from './SkinData';
import { ITEM } from './GameConst';
import { MgrUser } from './MgrUser';
import {Toast} from './Toast';
import {Language} from './Language';
import { GlobalEvent } from './Events';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { SkinBreviaryPath } from './Const';
import { ButtonAudio } from './ButtonAudio';
import { MgrGame } from './MgrGame';
import { AppGame } from './AppGame';
import {MgrUi} from './MgrUi';
import { AdsManager } from './AdsManager';

const { ccclass, property } = _decorator;

@ccclass('GameSkinItem')
export class GameSkinItem extends Component {
    @property(Sprite)
    skinSprite: Sprite | null = null;

    @property(Label)
    skinLabel: Label | null = null;

    @property(Sprite)
    background: Sprite | null = null;

    @property(SpriteFrame)
    closeSpriteFrame: SpriteFrame | null = null;

    @property(Node)
    lockNode: Node | null = null;

    @property(Node)
    unlockNode: Node | null = null;

    @property(Node)
    chooseNode: Node | null = null;

    @property(Button)
    adBtn: Button | null = null;

    @property(Label)
    adLabel: Label | null = null;

    @property(ProgressBar)
    adProgress: ProgressBar | null = null;

    @property(UITransform)
    adLineList: UITransform | null = null;

    @property(Node)
    line: Node | null = null;

    @property(Button)
    goldBtn: Button | null = null;

    @property(Label)
    goldCost: Label | null = null;

    @property(Label)
    unlockLvTips: Label | null = null;

    @property(Button)
    gotoBtn: Button | null = null;

    @property(Label)
    newSkinTip: Label | null = null;

    private skinCfg: any = null;
    private openSpriteFrame: SpriteFrame | null = null;

    onLoad() {
        this.openSpriteFrame = this.background!.spriteFrame;
        this.adBtn!.node.on('click', this.onAdBtn, this);
        this.goldBtn!.node.on('click', this.onCostBtn, this);
        this.gotoBtn!.node.on('click', this.onGotoBtn, this);
        this.node.on('click', this.onItemClick, this);
    }

    onEnable() {
        director.on(GlobalEvent.ChangeGameSkin, this.showItem, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    setCfg(cfg: any) {
        this.skinCfg = cfg;
        this.checkLevelUnlock();
        this.showIcon();
        this.showItem();
        this.checkShowLines();
    }

    checkLevelUnlock() {
        if (this.skinCfg.item === ITEM.LEVEL && MgrGame.Instance.gameData.maxLv > this.skinCfg.price) {
            const skinData = MgrSkin.Instance.data.getSkinData(this.skinCfg.id);
            if (!skinData || skinData.status !== SKIN_STATUS.UNLOCKED) {
                MgrSkin.Instance.unlock(this.skinCfg.id);
            }
        }
    }

    async showIcon() {
        this.skinSprite!.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(
            BUNDLE_NAMES.Game, 
            SkinBreviaryPath + this.skinCfg.icon
        );
    }

    showItem() {
        this.skinLabel!.string = Language.Instance.getLangByID(this.skinCfg.name);
        const skinData = MgrSkin.Instance.data.getSkinData(this.skinCfg.id);

        this.setStatus(skinData?.status === SKIN_STATUS.UNLOCKED);
        this.chooseNode!.active = MgrSkin.Instance.data.currSkinId === this.skinCfg.id;
        
        this.lockNode!.active = false;
        this.unlockNode!.active = false;
        this.unlockLvTips!.node.active = false;
        this.adBtn!.node.active = false;
        this.goldBtn!.node.active = false;
        this.gotoBtn!.node.active = false;

        if (skinData) {
            if (skinData.status === SKIN_STATUS.UNLOCKED) {
                this.lockNode!.active = false;
                this.unlockNode!.active = true;
            } else {
                this.lockNode!.active = true;
                if (this.skinCfg.item === ITEM.Ad) {
                    this.adBtn!.node.active = true;
                    this.adLabel!.string = 'X' + this.skinCfg.price;
                    this.freshAdProgress(skinData.progress || 0, this.skinCfg.price);
                } else if (this.skinCfg.item === ITEM.Coin) {
                    this.goldBtn!.node.active = true;
                    this.goldCost!.string = '' + this.skinCfg.price;
                } else if (this.skinCfg.item === ITEM.LEVEL) {
                    this.gotoBtn!.node.active = true;
                    this.unlockLvTips!.node.active = true;
                    this.unlockLvTips!.string = Language.Instance.getLangByID('skin_unlock_level')
                        .replace('{}', '' + this.skinCfg.price);
                }
            }
        } else {
            this.lockNode!.active = true;
            if (this.skinCfg.item === ITEM.Ad) {
                this.adBtn!.node.active = true;
                this.adLabel!.string = 'X' + this.skinCfg.price;
                this.freshAdProgress(0, this.skinCfg.price);
            } else if (this.skinCfg.item === ITEM.Coin) {
                this.goldBtn!.node.active = true;
                this.goldCost!.string = '' + this.skinCfg.price;
            } else if (this.skinCfg.item === ITEM.LEVEL) {
                this.gotoBtn!.node.active = true;
                this.unlockLvTips!.node.active = true;
                this.unlockLvTips!.string = Language.Instance.getLangByID('skin_unlock_level')
                    .replace('{}', '' + this.skinCfg.price);
            }
        }

        this.node.getComponent(ButtonAudio)!.enabled = skinData && skinData.status === SKIN_STATUS.UNLOCKED;
        this.newSkinTip!.active = MgrSkin.Instance.isShowTipById(this.skinCfg.id);
    }

    freshAdProgress(current: number, total: number) {
        this.adProgress!.progress = current / total;
    }

    checkShowLines() {
        this.adLineList!.node.removeAllChildren();
        
        if (this.skinCfg.item === ITEM.Ad) {
            const total = this.skinCfg.price;
            const spacing = this.adLineList!.width / total;
            
            for (let i = 1; i < total; i++) {
                const lineNode = instantiate(this.line!);
                const position = new Vec3(spacing * i, 0, 0);
                
                lineNode.setPosition(position);
                lineNode.active = true;
                lineNode.parent = this.adLineList!.node;
            }
        }
    }

    setStatus(isUnlocked: boolean) {
        this.background!.spriteFrame = isUnlocked ? this.openSpriteFrame : this.closeSpriteFrame;
    }

    onCostBtn() {
        if (this.skinCfg.item === ITEM.Coin) {
            if (MgrUser.Instance.userData.judgeItem(ITEM.Coin, this.skinCfg.price)) {
                MgrUser.Instance.userData.subItem(ITEM.Coin, this.skinCfg.price);
                MgrSkin.Instance.unlock(this.skinCfg.id);
                this.showItem();
            } else {
                Toast.tip('token is not enough !');
            }
        } else {
            console.error('未知消耗物品: ', this.skinCfg.item);
        }
    }

    onAdBtn() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'Skin',
            AdsType: 'GetSkin',
            onSucceed: () => {
                MgrSkin.Instance.data.addProgress(this.skinCfg.id);
                const skinData = MgrSkin.Instance.data.getSkinData(this.skinCfg.id);
                if (skinData!.progress >= this.skinCfg.price) {
                    MgrSkin.Instance.unlock(this.skinCfg.id);
                }
                this.showItem();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    onGotoBtn() {
        AppGame.topUI.clearBackFunc();
        MgrUi.Instance.closeAll();
        MgrGame.Instance.gameData.curLv = MgrGame.Instance.gameData.maxLv;
        MgrGame.Instance.enterLevel();
    }

    onItemClick() {
        if (this.skinCfg.id !== MgrSkin.Instance.data.currSkinId) {
            const skinData = MgrSkin.Instance.data.getSkinData(this.skinCfg.id);
            if (skinData && skinData.status === SKIN_STATUS.UNLOCKED) {
                MgrSkin.Instance.setCurrSkin(this.skinCfg.id);
            }
        }
    }
}
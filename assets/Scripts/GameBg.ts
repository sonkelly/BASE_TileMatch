import { _decorator, Component, Sprite, UIOpacity, tween, director, cclegacy } from 'cc';
import { MgrGame } from './MgrGame';
import {LevelCfg} from './LevelCfg';
import { BgPath } from './Const';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { GameConst } from './GameConst';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('GameBg')
export class GameBg extends Component {
    @property(Sprite)
    bg_Buttom: Sprite | null = null;

    @property(Sprite)
    bg_Top: Sprite | null = null;

    private currSprite: any = null;

    onEnable() {
        this.bg_Buttom!.node.active = false;
        const bgName = LevelCfg.Instance.getLevelBg(MgrGame.Instance.gameData.curLv);
        this.showTop(bgName);
    }

    showChallengeBg(callback: Function) {
        this.playChange('bg' + GameConst.CHALLENGE_BG_ID, this.currSprite?.name || null, callback);
    }

    showNormalBg() {
        this.bg_Buttom!.node.active = false;
        const bgName = LevelCfg.Instance.getLevelBg(MgrGame.Instance.gameData.curLv);
        this.showTop(bgName);
    }

    tryChange(callback: Function) {
        const curLv = MgrGame.Instance.gameData.curLv;
        const bgName = LevelCfg.Instance.getLevelBg(curLv);
        
        if (curLv > 1) {
            if (this.currSprite && bgName === this.currSprite.name) {
                callback();
                return;
            }
            
            const prevBgName = LevelCfg.Instance.getLevelBg(curLv - 1);
            if (bgName !== prevBgName) {
                this.playChange(bgName, prevBgName, callback);
                return;
            }
        }
        
        if (this.currSprite && bgName !== this.currSprite.name) {
            this.playChange(bgName, this.currSprite.name, callback);
        } else {
            callback();
        }
    }

    private async playChange(newBg: string, oldBg: string | null, callback: Function) {
        await this.showButtom(oldBg);
        
        const opacityComp = this.bg_Top!.getComponent(UIOpacity)!;
        opacityComp.opacity = 0;
        
        await this.showTop(newBg);
        
        tween(opacityComp)
            .to(0.2, { opacity: 255 })
            .call(() => {
                this.bg_Buttom!.node.active = false;
                callback();
            })
            .start();
            
        director.emit(GlobalEvent.ChangeGameBackground);
    }

    private async showTop(bgName: string) {
        this.bg_Top!.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(
            BUNDLE_NAMES.Game, 
            BgPath + bgName
        );
        this.currSprite = this.bg_Top!.spriteFrame;
    }

    private async showButtom(bgName: string | null) {
        if (bgName) {
            this.bg_Buttom!.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(
                BUNDLE_NAMES.Game, 
                BgPath + bgName
            );
            this.bg_Buttom!.node.active = true;
        }
    }
}
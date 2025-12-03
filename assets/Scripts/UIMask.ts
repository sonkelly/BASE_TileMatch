import { _decorator, Component, Sprite, director, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { MgrGame } from './MgrGame';
import { LevelCfg } from './LevelCfg';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { BgPath } from './Const';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('UIMask')
export class UIMask extends Component {
    @property([Sprite])
    public maskSprite: Sprite[] = [];

    private spriteName: string | null = null;

    protected onEnable(): void {
        this.changeBg();
        director.on(GlobalEvent.ChangeGameBackground, this.onChangeBackground, this);
    }

    protected onChangeBackground(): void {
        this.changeBg();
    }

    private changeBg(): void {
        const curLv = MgrGame.Instance.gameData.curLv;
        const bgName = LevelCfg.Instance.getCfg(curLv).bg;
        
        if (this.spriteName && this.spriteName === bgName) return;
        this.changeSprite(bgName);
    }

    private async changeSprite(bgName: string): Promise<void> {
        const spriteName = bgName + '_glass';
        this.spriteName = bgName;
        
        const spriteFrame = await AssetMgr.Instance.loadSpriteFrame(
            BUNDLE_NAMES.Game, 
            BgPath + spriteName
        );
        
        each(this.maskSprite, (sprite: Sprite) => {
            sprite.spriteFrame = spriteFrame;
        });
    }
}
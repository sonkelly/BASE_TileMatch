import { _decorator, CCBoolean, Color, Component, Sprite, error, cclegacy } from 'cc';
import {LevelCfg} from './LevelCfg';
import { MgrGame } from './MgrGame';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { BgPath } from './Const';

const { ccclass, property } = _decorator;

@ccclass('GameStaticBg')
export class GameStaticBg extends Component {
    @property(CCBoolean)
    private isGlass: boolean = false;

    @property(CCBoolean)
    private isLated: boolean = true;

    @property(CCBoolean)
    private auto: boolean = false;

    private _spriteName: string | null = null;
    private _color: Color = new Color();

    public get spriteName(): string | null {
        return this._spriteName;
    }

    public set spriteName(value: string | null) {
        this._spriteName = value;
    }

    protected onEnable(): void {
        if (this.auto) {
            this.changeBg();
        }
    }

    public changeBg(): void {
        const level = this.isLated ? MgrGame.Instance.gameData.curLv - 1 : MgrGame.Instance.gameData.curLv;
        const bgName = LevelCfg.Instance.getLevelBg(level);
        
        if (!this.spriteName || this.spriteName !== bgName) {
            this.changeSprite(bgName);
        }
    }

    private async changeSprite(name: string): Promise<void> {
        const spriteName = this.isGlass ? name + '_glass' : name;
        const sprite = this.node.getComponent(Sprite);
        
        if (sprite) {
            sprite.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, BgPath + spriteName);
            this.spriteName = name;
        } else {
            error('缺少sprite组件: ', this.node.name);
        }
    }
}
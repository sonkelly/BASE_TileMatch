import { _decorator, Color, Sprite, SpriteFrame, Label, Node, tween, Tween, Vec3, Component, cclegacy } from 'cc';
import { GameMode } from './Const';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {Language} from './Language';

const { ccclass, property } = _decorator;

let ORANGE_COLOR = new Color();
Color.fromHEX(ORANGE_COLOR, '#FF9B00');

@ccclass('GameLevelType')
export class GameLevelType extends Component {
    @property(Sprite)
    headSprite: Sprite | null = null;

    @property(SpriteFrame)
    hardSpriteFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    bonusSpriteFrame: SpriteFrame | null = null;

    @property(Label)
    descLabel: Label | null = null;

    @property(Node)
    lightNode: Node | null = null;

    private _gameMode: GameMode | null = null;

    public reuse(gameMode: GameMode): void {
        this._gameMode = gameMode;
    }

    protected onEnable(): void {
        if (this._gameMode === GameMode.Bonus) {
            this.headSprite!.spriteFrame = this.bonusSpriteFrame;
            this.descLabel!.string = Language.Instance.getLangByID('bonus_level');
            this.descLabel!.color = ORANGE_COLOR;
        } else {
            this.headSprite!.spriteFrame = this.hardSpriteFrame;
            this.descLabel!.string = Language.Instance.getLangByID('hard_level');
            this.descLabel!.color = Color.RED;
        }

        this.playAnim();
        this.playLight();
    }

    private playLight(): void {
        tween(this.lightNode)
            .by(10, { angle: 360 })
            .repeatForever()
            .start();
    }

    private playAnim(): void {
        this.playNode(this.lightNode!, 2);
        this.playNode(this.headSprite!.node, 2);
        this.playNode(this.descLabel!.node, 2);
    }

    private playNode(node: Node, delay: number): void {
        Tween.stopAllByTarget(node);
        node.scale = Vec3.ZERO;
        
        tween(node)
            .to(0.35, { scale: Vec3.ONE })
            .delay(0.7)
            .call(() => {
                this.onClose();
            })
            .to(0.3, { scale: Vec3.ZERO })
            .start();
    }

    private onClose(): void {
        this.node.emit(VIEW_ANIM_EVENT.Close, this);
    }
}
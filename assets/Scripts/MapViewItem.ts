import { _decorator, Component, Node, Label, Sprite, Button, Tween, tween, Vec3, easing } from 'cc';
import { Language } from './Language';
import { MgrGame } from './MgrGame';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { MAP_GROUP_PATH } from './Prefabs';

const { ccclass, property } = _decorator;

@ccclass('MapViewItem')
export class MapViewItem extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    levelsLabel: Label | null = null;

    @property(Node)
    lockNode: Node | null = null;

    @property(Sprite)
    background: Sprite | null = null;

    public delegate: any = null;
    private _config: any = undefined;

    onLoad() {
        this.node.on('click', this.onClick, this);
    }

    onEnable() {}

    async setConfig(config: any) {
        this._config = config;
        this.setName(config.name);
        this.setLevels(config.start, config.end);

        const isLocked = config.start > MgrGame.Instance.gameData.maxLv;
        this.lockNode!.active = isLocked;
        this.getComponent(Button)!.interactable = config.start <= MgrGame.Instance.gameData.maxLv;

        let roadIndex = this._config.id % 12;
        if (roadIndex === 0) {
            roadIndex = 12;
        }
        this.background!.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MAP_GROUP_PATH + '/road' + roadIndex);
    }

    setName(nameId: string) {
        this.nameLabel!.string = Language.Instance.getLangByID(nameId);
    }

    setLevels(start: number, end: number) {
        this.levelsLabel!.string = Language.Instance.getLangByID('Language1').replace('{0}', `${start}-${end}`);
    }

    onClick() {
        this.delegate.selectItemEvent(this._config);
    }

    playEnter() {
        Tween.stopAllByTarget(this.node);
        this.node.scale = Vec3.ZERO;
        tween(this.node)
            .to(0.5, { scale: Vec3.ONE }, { easing: easing.backOut })
            .start();
    }
}
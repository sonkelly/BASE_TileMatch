import { _decorator, Component, Node, Sprite, SpriteFrame, sp, UIOpacity, Color, Vec3, v3, Tween, tween, easing, color } from 'cc';
import { UIPool } from './UIPool';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { MINE_WALL_PATH } from './Prefabs';
import { MgrMine, GemStageCfg, MINE_ANIMATION_OPEN_DOOR } from './MgrMine';
import { StageGemItem } from './StageGemItem';

const { ccclass, property } = _decorator;

@ccclass('StageItem')
export class StageItem extends Component {
    @property(Node)
    stageNode: Node = null!;

    @property(Node)
    gemNode: Node = null!;

    @property(Node)
    wallDoorNode: Node = null!;

    @property(Sprite)
    doorSp: Sprite = null!;

    @property([Sprite])
    doorPieces: Sprite[] = [];

    @property([Node])
    piecesNode: Node[] = [];

    @property(Node)
    stageGem: Node = null!;

    @property(UIPool)
    stageGemPool: UIPool = null!;

    @property([Sprite])
    wallSp: Sprite[] = [];

    @property([Sprite])
    wallDoorSp: Sprite[] = [];

    @property([Sprite])
    towerSp: Sprite[] = [];

    @property([Sprite])
    groundSp: Sprite[] = [];

    @property(Sprite)
    deskSp: Sprite = null!;

    @property(Node)
    deskNode: Node = null!;

    @property(sp.Skeleton)
    boxSpine: sp.Skeleton = null!;

    @property(Node)
    boxSpineNode: Node = null!;

    @property(sp.Skeleton)
    doorSpine: sp.Skeleton = null!;

    @property(UIOpacity)
    doorBlackOpacity: UIOpacity = null!;

    @property(UIOpacity)
    wallMaskOpacity: UIOpacity = null!;

    @property(UIOpacity)
    stageBlackOpacity: UIOpacity = null!;

    @property(UIOpacity)
    deskBlackOpacity: UIOpacity = null!;

    private _mineCfg: any = null;
    private _resType: string = '';
    private _towerType: string = '';
    private _gemStageData: any = null;
    private _tempColor: Color = new Color();
    private _stageGemCmps: StageGemItem[] = [];
    private _orignPos: Vec3 = new Vec3();

    onLoad() {
        this._orignPos.set(this.node.position);
    }

    onEnable() {
        this.doorSpine.clearAnimations();
    }

    onDisable() {}

    refreshStage(cfg: any) {
        this._mineCfg = cfg;
        this._mineCfg ? this._refreshNormalStage() : this._refreshEmptyStage();
    }

    private _refreshEmptyStage() {
        this._checkEmptyShow(true);
        this._resetUI();
        this._refreshEmptyStageUI();
    }

    private _refreshNormalStage() {
        this._resType = MgrMine.Instance.getNormalSuffixByStage(this._mineCfg.id);
        this._towerType = MgrMine.Instance.getTowerSuffixByStage(this._mineCfg.id);
        this._gemStageData = GemStageCfg[this._mineCfg.id];
        this._checkEmptyShow(false);
        this._resetUI();
        this._refreshNormalStageUI();
        this._refreshStageGem();
    }

    private _checkEmptyShow(isEmpty: boolean) {
        this.towerSp.forEach(sp => {
            sp.node.active = !isEmpty;
        });
    }

    private _resetUI() {
        this.stageNode.setScale(v3(1, 1, 1));
        this.gemNode.setScale(v3(1, 1, 1));
        this.gemNode.setPosition(v3(0, 0, 0));
        this.doorBlackOpacity.opacity = 0;
        this.stageBlackOpacity.opacity = 0;
        this.deskBlackOpacity.opacity = 0;
        this.wallMaskOpacity.opacity = 0;
        this.deskNode.setScale(v3(0.7, 0.7, 1));
        this.deskNode.setPosition(v3(0, -54, 0));
        this.deskNode.active = false;
        this.boxSpineNode.active = false;
    }

    private async _refreshEmptyStageUI() {
        const wallResName = MgrMine.Instance.getFinishWallResName();
        for (let i = 0; i < this.wallSp.length; i++) {
            this.wallSp[i].spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/' + wallResName);
        }

        const wallDoorResName = MgrMine.Instance.getFinishWallDoorResName();
        for (let i = 0; i < this.wallDoorSp.length; i++) {
            this.wallDoorSp[i].spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/' + wallDoorResName);
        }

        let prevStage = 0;
        if (0 !== (prevStage = this._mineCfg ? this._mineCfg.id - 1 : MgrMine.Instance.data.stage)) {
            const animaName = MgrMine.Instance.getBoxAnimaNameLoop(prevStage);
            this.boxSpine.clearAnimations();
            this.boxSpine.setAnimation(0, animaName, true);
            
            const resType = MgrMine.Instance.getNormalSuffixByStage(prevStage);
            this.deskSp.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/desk' + resType);
        }
    }

    private async _refreshNormalStageUI() {
        this.doorSp.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/door' + this._resType);
        
        for (let i = 0; i < this.doorPieces.length; i++) {
            const idx = i + 1;
            const partName = MgrMine.Instance.getPartStageSpNameByIdx(idx);
            const path = MINE_WALL_PATH + '/' + partName + this._resType;
            this.doorPieces[i].spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, path);
        }

        for (let i = 0; i < this.wallSp.length; i++) {
            this.wallSp[i].spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/wall' + this._resType);
        }

        for (let i = 0; i < this.wallDoorSp.length; i++) {
            this.wallDoorSp[i].spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/walldoor' + this._resType);
        }

        for (let i = 0; i < this.towerSp.length; i++) {
            this.towerSp[i].spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/ta' + this._towerType);
        }

        for (let i = 0; i < this.groundSp.length; i++) {
            this.groundSp[i].spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/ground' + this._resType);
        }

        let prevStage = 0;
        if (0 !== (prevStage = this._mineCfg ? this._mineCfg.id - 1 : MgrMine.Instance.data.stage)) {
            const animaName = MgrMine.Instance.getBoxAnimaNameLoop(prevStage);
            this.boxSpine.clearAnimations();
            this.boxSpine.setAnimation(0, animaName, true);
            
            const resType = MgrMine.Instance.getNormalSuffixByStage(prevStage);
            this.deskSp.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, MINE_WALL_PATH + '/desk' + resType);
        }
    }

    private _refreshStageGem() {
        this._stageGemCmps.length = 0;
        this.stageGemPool.clear();
        
        const gems = this._gemStageData.gems;
        for (let i = 0; i < gems.length; i++) {
            const gemData = gems[i];
            const gemNode = this.stageGemPool.get();
            const gemCmp = gemNode.getComponent(StageGemItem);
            
            gemCmp.refresh(gemData, this._mineCfg.id);
            gemCmp.refreshGemShowState();
            this._stageGemCmps.push(gemCmp);
            gemNode.parent = this.stageGem;
            gemNode.position = MgrMine.Instance.getStageGemPositon(gemData.idx);
        }
    }

    playOpenDoor() {
        this.node.setPosition(this._orignPos);
        Tween.stopAllByTarget(this.node);
        
        tween(this.node)
            .by(0.03, { position: v3(10, 8, 0) }, { easing: easing.linear })
            .by(0.06, { position: v3(-17, -10, 0) }, { easing: easing.linear })
            .by(0.04, { position: v3(7, 2, 0) }, { easing: easing.linear })
            .by(0.04, { position: v3(4, -4, 0) }, { easing: easing.linear })
            .by(0.04, { position: v3(-4, 4, 0) }, { easing: easing.linear })
            .by(0.04, { position: v3(-3, 3, 0) }, { easing: easing.linear })
            .by(0.04, { position: v3(3, -3, 0) }, { easing: easing.linear })
            .by(0.04, { position: v3(2, -2, 0) }, { easing: easing.linear })
            .by(0.04, { position: v3(-2, 2, 0) }, { easing: easing.linear })
            .call(() => {
                this.node.position = this._orignPos;
            })
            .start();
            
        this.doorSpine.setAnimation(0, MINE_ANIMATION_OPEN_DOOR, false);
    }

    playDoorScaleDark() {
        this.gemNode.setScale(v3(1, 1, 1));
        Tween.stopAllByTarget(this.gemNode);
        tween(this.gemNode)
            .to(0.32, { scale: v3(0.95, 0.95, 1) }, { easing: easing.linear })
            .start();
            
        this.doorBlackOpacity.opacity = 0;
        Tween.stopAllByTarget(this.doorBlackOpacity);
        tween(this.doorBlackOpacity)
            .to(0.32, { opacity: 55 }, { easing: easing.linear })
            .start();
    }

    playDoorUp() {
        this.gemNode.setPosition(v3(0, 0, 0));
        Tween.stopAllByTarget(this.gemNode);
        tween(this.gemNode)
            .to(2, { position: v3(0, 400, 0) }, { easing: easing.linear })
            .start();
    }

    setPeady() {
        this.stageNode.setScale(v3(0.4, 0.4, 1));
        this.deskBlackOpacity.opacity = 75;
        this.stageBlackOpacity.opacity = 115;
        this.wallMaskOpacity.opacity = 255;
        this.boxSpineNode.setScale(v3(0.3, 0.3, 1));
        this.boxSpine.color = color(180, 180, 180, 255);
        this.deskNode.active = true;
        this.boxSpineNode.active = true;
    }

    playWallScale() {
        this.stageNode.setScale(v3(1, 1, 1));
        Tween.stopAllByTarget(this.stageNode);
        tween(this.stageNode)
            .to(2, { scale: v3(3, 3, 1) }, { easing: easing.linear })
            .start();
    }

    playStepInto1() {
        this.deskNode.active = true;
        this.deskNode.setScale(v3(0.7, 0.7, 1));
        Tween.stopAllByTarget(this.deskNode);
        tween(this.deskNode)
            .to(2, { scale: v3(1, 1, 1) }, { easing: easing.linear })
            .start();
            
        this.deskBlackOpacity.opacity = 75;
        Tween.stopAllByTarget(this.deskBlackOpacity);
        tween(this.deskBlackOpacity)
            .to(2, { opacity: 0 }, { easing: easing.linear })
            .start();
            
        this.boxSpineNode.setScale(v3(0.3, 0.3, 1));
        Tween.stopAllByTarget(this.boxSpineNode);
        tween(this.boxSpineNode)
            .to(2, { scale: v3(0.5, 0.5, 1) }, { easing: easing.linear })
            .start();
            
        this.boxSpine.color = color(180, 180, 180);
        Tween.stopAllByTarget(this._tempColor);
        this._tempColor.set(this.boxSpine.color);
        
        tween(this._tempColor)
            .to(2, { r: 255, g: 255, b: 255 }, {
                onUpdate: (target: Color) => {
                    this.boxSpine.color = target;
                },
                easing: easing.linear
            })
            .start();
            
        this.stageNode.setScale(v3(0.4, 0.4, 1));
        Tween.stopAllByTarget(this.stageNode);
        tween(this.stageNode)
            .to(2, { scale: v3(0.6, 0.6, 1) }, { easing: easing.linear })
            .start();
            
        this.stageBlackOpacity.opacity = 115;
        Tween.stopAllByTarget(this.stageBlackOpacity);
        tween(this.stageBlackOpacity)
            .to(2, { opacity: 75 }, { easing: easing.linear })
            .start();
    }

    playBoxOpen() {
        let prevStage = 0;
        if (0 !== (prevStage = this._mineCfg ? this._mineCfg.id - 1 : MgrMine.Instance.data.stage)) {
            const animaName = MgrMine.Instance.getBoxAnimaNameOpen(prevStage);
            this.boxSpine.clearAnimations();
            this.boxSpine.setAnimation(0, animaName, false);
        }
    }

    playStepInto2() {
        this.boxSpineNode.active = false;
        this.deskNode.active = true;
        this.deskNode.setScale(v3(1, 1, 1));
        this.deskNode.setPosition(v3(0, -54, 0));
        
        Tween.stopAllByTarget(this.deskNode);
        tween(this.deskNode)
            .to(1, { position: v3(0, -154, 0) }, { easing: easing.linear })
            .start();
            
        this.stageNode.setScale(v3(0.6, 0.6, 1));
        Tween.stopAllByTarget(this.stageNode);
        tween(this.stageNode)
            .to(1, { scale: v3(1, 1, 1) }, { easing: easing.linear })
            .start();
            
        this.stageBlackOpacity.opacity = 75;
        Tween.stopAllByTarget(this.stageBlackOpacity);
        tween(this.stageBlackOpacity)
            .to(1, { opacity: 0 }, { easing: easing.linear })
            .start();
            
        this.wallMaskOpacity.opacity = 255;
        Tween.stopAllByTarget(this.wallMaskOpacity);
        tween(this.wallMaskOpacity)
            .to(1, { opacity: 0 }, { easing: easing.linear })
            .start();
    }

    get stageGemCmps(): StageGemItem[] {
        return this._stageGemCmps;
    }
}
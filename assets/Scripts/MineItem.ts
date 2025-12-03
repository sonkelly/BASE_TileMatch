import { _decorator, Node, Tween, v3, tween, easing, UITransform, Size, Component, cclegacy } from 'cc';
import { MgrMine, GemMapCfg } from './MgrMine';
import { BrickItem } from './BrickItem';
import {UIPool} from './UIPool';
import { GemItem } from './GemItem';

const { ccclass, property } = _decorator;

export const BrickItemSize = 138;
const BrickItemSpacing = BrickItemSize - 10;

@ccclass('MineItem')
export class MineItem extends Component {
    @property(Node)
    mineNode: Node = null!;

    @property(Node)
    brickBoxBg: Node = null!;

    @property(Node)
    brickContent: Node = null!;

    @property(UIPool)
    brickPool: UIPool = null!;

    @property(Node)
    gemContent: Node = null!;

    @property(UIPool)
    gemPool: UIPool = null!;

    private _mineCfg: any = null;
    private _gemMapCfg: any = null;
    private _targetRowcol: number = 0;
    private _targetBoxSize: number = 0;
    private _targetContentSize: number = 0;
    private _targetBoxPosY: number = 0;
    private _targetScale: number = 0;
    private _brickItems: BrickItem[] = [];
    private _gemItems: GemItem[] = [];

    get targetScale(): number {
        return this._targetScale;
    }

    get brickItems(): BrickItem[] {
        return this._brickItems;
    }

    get gemItems(): GemItem[] {
        return this._gemItems;
    }

    onEnable() {}

    onDisable() {}

    refreshMine(mineCfg: any) {
        this._mineCfg = mineCfg;
        this._brickItems.length = 0;
        this.brickPool.clear();
        this._gemItems.length = 0;
        this.gemPool.clear();
        
        if (this._mineCfg) {
            this._refreshNormalMine();
        } else {
            this._refreshEmptyMine();
        }
    }

    playHide() {
        Tween.stopAllByTarget(this.mineNode);
        this.mineNode.setScale(v3(this._targetScale, this._targetScale, 1));
        tween(this.mineNode)
            .to(0.36, { scale: v3(0, 0, 1) }, { easing: easing.linear })
            .start();
    }

    playShow() {
        Tween.stopAllByTarget(this.mineNode);
        this.mineNode.setScale(v3(0, 0, 1));
        
        if (this._mineCfg) {
            tween(this.mineNode)
                .delay(0.36)
                .to(0.36, { scale: v3(this._targetScale, this._targetScale, 1) }, { easing: easing.linear })
                .start();
        }
    }

    private _refreshEmptyMine() {
        this.brickBoxBg.active = false;
        this.brickContent.active = false;
        this.gemContent.active = false;
    }

    private _refreshNormalMine() {
        this.brickBoxBg.active = true;
        this.brickContent.active = true;
        this.gemContent.active = true;

        this._targetRowcol = this._mineCfg.rowcol;
        this._targetBoxSize = BrickItemSize * this._targetRowcol - 10 * (this._targetRowcol - 1) + 12;
        this._targetContentSize = BrickItemSize * this._targetRowcol - 10 * (this._targetRowcol - 1);
        this._targetBoxPosY = this._targetBoxSize / 2;
        this._targetScale = 534 / this._targetBoxSize;

        this.mineNode.getComponent(UITransform)!.setContentSize(new Size(this._targetBoxSize, this._targetBoxSize));
        this.brickBoxBg.getComponent(UITransform)!.setContentSize(new Size(this._targetBoxSize, this._targetBoxSize));
        this.brickContent.getComponent(UITransform)!.setContentSize(new Size(this._targetContentSize, this._targetContentSize));
        this.gemContent.getComponent(UITransform)!.setContentSize(new Size(this._targetContentSize, this._targetContentSize));

        console.log(`gemMapId: ${MgrMine.Instance.data.gemMapId}, mineCfgId: ${this._mineCfg.id}, Rowcol:${this._targetRowcol}, BoxSize: ${this._targetBoxSize}, ContentSize: ${this._targetContentSize}, scale: ${this._targetScale}`);

        this.mineNode.setScale(v3(this._targetScale, this._targetScale, 1));
        this.brickBoxBg.setPosition(v3(0, this._targetBoxPosY, 0));
        this.brickContent.setPosition(v3(0, this._targetBoxPosY - 6, 0));
        this.gemContent.setPosition(v3(0, this._targetBoxPosY - 6, 0));

        this._createBricks();
        this._createGems();
    }

    private _createBricks() {
        const totalBricks = this._targetRowcol * this._targetRowcol;
        
        for (let i = 1; i <= totalBricks; i++) {
            const brickNode = this.brickPool.get();
            brickNode.name = i.toString();
            
            const brickItem = brickNode.getComponent(BrickItem)!;
            brickItem.refresh(i);
            brickNode.parent = this.brickContent;
            this._brickItems.push(brickItem);

            const col = i % this._targetRowcol === 0 ? this._targetRowcol : i % this._targetRowcol;
            const row = Math.floor((i - 1) / this._targetRowcol);
            
            const posX = -BrickItemSpacing / 2 * (this._targetRowcol - 1) + (col - 1) * BrickItemSpacing;
            const posY = -BrickItemSize / 2 - row * BrickItemSpacing;
            
            brickNode.setPosition(v3(posX, posY, 0));
        }
    }

    private _createGems() {
        const gemMapId = MgrMine.Instance.data.gemMapId;
        this._gemMapCfg = GemMapCfg[gemMapId];
        
        for (const gemCfg of this._gemMapCfg.gems) {
            const gemNode = this.gemPool.get();
            gemNode.name = gemCfg.id.toString();
            
            const gemItem = gemNode.getComponent(GemItem)!;
            gemItem.reset();
            gemItem.refresh(gemCfg);
            gemItem.refreshGemShowState();
            
            gemNode.parent = this.gemContent;
            this._gemItems.push(gemItem);
            
            const worldPos = this._getGemWorldPos(gemCfg);
            gemNode.worldPosition = worldPos;
        }
    }

    private _getGemWorldPos(gemCfg: any) {
        const brickPositions: any[] = [];
        
        for (const posIndex of gemCfg.pos) {
            const brickItem = this._brickItems[posIndex - 1];
            brickPositions.push(brickItem.node.worldPosition);
        }
        
        return MgrMine.Instance.getGemPosById(gemCfg.gemId, brickPositions);
    }
}
import { _decorator, Component, Vec3, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MapListTile')
export class MapListTile extends Component {
    private _viewScale: number = 1;
    private _tilePos: Vec3 | null = null;

    public setViewScale(scale: number): void {
        this._viewScale = scale;
    }

    public get tilePos(): Vec3 | null {
        return this._tilePos;
    }

    public set tilePos(pos: Vec3 | null) {
        this._tilePos = pos;
    }

    protected onEnable(): void {
        const scaleVec = new Vec3(this._viewScale, this._viewScale, this._viewScale);
        this.node.scale = scaleVec;

        if (this._tilePos) {
            const posX = this._tilePos.x;
            const posY = this._tilePos.y;
            const position = new Vec3(
                40 * posX * this._viewScale,
                40 * posY * this._viewScale,
                0
            );
            this.node.position = position;
        }
    }
}
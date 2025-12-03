import { _decorator, Component, Node, UITransform, cclegacy } from 'cc';
import { MgrMine, EBrickState } from './MgrMine';

const { ccclass, property } = _decorator;

@ccclass('BrickItem')
export class BrickItem extends Component {
    @property(Node)
    brickNode: Node | null = null;

    private _brickInfo: any = null;

    public refresh(uU: any): void {
        this._brickInfo = MgrMine.Instance.data.getMapBrickInfo(uU);
        this.refreshBrickShowState();
    }

    public checkDig(uV: any): boolean {
        const uW = this.node.getComponent(UITransform)!.getBoundingBoxToWorld().contains(uV);
        const uX = this._brickInfo.state == EBrickState.Idle;
        return uW && uX;
    }

    public refreshBrickShowState(): void {
        if (!this._brickInfo) {
            console.error('no brickInfo!');
            this.brickNode!.active = false;
            return;
        }
        this.brickNode!.active = this._brickInfo.state == EBrickState.Idle;
    }

    public get brickInfo(): any {
        return this._brickInfo;
    }
}
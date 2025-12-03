import { _decorator, Component, Sprite, v3 } from 'cc';
import { EGemState, MgrMine } from './MgrMine';
import {MineGemCfg} from './MineGemCfg';

const { ccclass, property } = _decorator;

@ccclass('GemItem')
class GemItem extends Component {
    @property(Sprite)
    gemSp: Sprite | null = null;

    private _gemMapData: any = null;
    private _mapGemInfo: any = null;

    get gemMapData() {
        return this._gemMapData;
    }

    refresh(gemMapData: any) {
        return (async () => {
            this._gemMapData = gemMapData;
            this._mapGemInfo = MgrMine.Instance.data.getMapGemInfo(gemMapData.id);
            this.gemSp!.spriteFrame = await MineGemCfg.Instance.loadGemSpriteframe(this._gemMapData.gemId);
        })();
    }

    refreshGemShowState() {
        this.gemSp!.node.active = this._mapGemInfo && this._mapGemInfo.state !== EGemState.Collect;
    }

    reset() {
        this.gemSp!.spriteFrame = null;
        this.gemSp!.node.active = true;
        this.node.setWorldScale(v3(1, 1, 1));
    }
}

export { GemItem };
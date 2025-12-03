import { _decorator, Component, Sprite, v3 } from 'cc';
import { MineGemCfg } from './MineGemCfg';
import { MgrMine, EGemState } from './MgrMine';

const { ccclass, property } = _decorator;

@ccclass('StageGemItem')
export class StageGemItem extends Component {
    @property(Sprite)
    gemBg: Sprite | null = null;

    @property(Sprite)
    gem: Sprite | null = null;

    private _gemStageData: any = null;
    private _mapGemInfo: any = null;
    private _mineGemCfg: any = null;

    get gemStageData(): any {
        return this._gemStageData;
    }

    async refresh(gemStageData: any, state: any): Promise<void> {
        this._gemStageData = gemStageData;
        this._mineGemCfg = MineGemCfg.Instance.get(this._gemStageData.gemId);
        this._mapGemInfo = MgrMine.Instance.data.getMapGemInfo(this._gemStageData.id);
        
        this.node.setScale(v3(this._mineGemCfg.stageScale, this._mineGemCfg.stageScale, 1));
        this.gemBg!.spriteFrame = await MineGemCfg.Instance.loadGemBgSpriteframe(this._gemStageData.gemId, state);
        this.gem!.spriteFrame = await MineGemCfg.Instance.loadGemSpriteframe(this._gemStageData.gemId);
    }

    refreshGemShowState(): void {
        this.gem!.node.active = this._mapGemInfo && this._mapGemInfo.state === EGemState.Collect;
    }
}
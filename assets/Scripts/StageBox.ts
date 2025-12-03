import { _decorator, Component, Node, Sprite, NodeEventType, cclegacy } from 'cc';
import { MgrMine, EStageBoxState } from './MgrMine';
import { UIPrefabs, MINE_BOX_PATH } from './Prefabs';
import { BUNDLE_NAMES } from './AssetRes';
import { AssetMgr } from './AssetMgr';
import { MgrUi } from './MgrUi';
import { MineCfg } from './MineCfg';

const { ccclass, property } = _decorator;

@ccclass('StageBox')
export class StageBox extends Component {
    @property(Sprite)
    boxSprite: Sprite | null = null;

    @property(Node)
    getNode: Node | null = null;

    private _stageBoxInfo: any = null;

    onEnable() {
        this.node.on(NodeEventType.TOUCH_END, this._touchEnd, this);
    }

    onDisable() {
        this.node.off(NodeEventType.TOUCH_END, this._touchEnd, this);
    }

    setStageId(stageId: any) {
        this._stageBoxInfo = MgrMine.Instance.data.getStageBoxInfo(stageId);
    }

    private _touchEnd() {
        if (!MgrMine.Instance.checkInGuide() && 
            MgrMine.Instance.data.getStageBoxInfo(this._stageBoxInfo.id).state != EStageBoxState.Open) {
            const config = MineCfg.Instance.get(this._stageBoxInfo.id);
            MgrUi.Instance.openViewAsync(UIPrefabs.MineBoxDetailView, {
                priority: 2,
                data: {
                    reward: config.rewardInfo,
                    target: this.node
                }
            });
        }
    }

    async refreshBox() {
        if (this._stageBoxInfo.state == EStageBoxState.Idle) {
            this.getNode!.active = false;
            this.boxSprite!.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(
                BUNDLE_NAMES.Game, 
                MINE_BOX_PATH + '/box_stage' + this._stageBoxInfo.id
            );
        } else {
            this.getNode!.active = true;
            this.boxSprite!.spriteFrame = await AssetMgr.Instance.loadSpriteFrame(
                BUNDLE_NAMES.Game, 
                MINE_BOX_PATH + '/box_stage' + this._stageBoxInfo.id + '_open'
            );
        }
    }
}
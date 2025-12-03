import { _decorator, cclegacy } from 'cc';
import { LogicLevel } from './LogicLevel';
import { GameConst, ITEM } from './GameConst';
import { AppGame } from './AppGame';
import { UIPrefabs } from './Prefabs';
import { MgrUser } from './MgrUser';
import { MgrUi } from './MgrUi';
import { GameMode } from './Const';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';

const { ccclass, property } = _decorator;

@ccclass('LogicBonus')
export class LogicBonus extends LogicLevel {
    getElementCnt(element: any): number {
        return 1;
    }

    getAlgorithm(element: any): { algorithm: number; algorithmParam: number } {
        return {
            algorithm: GameConst.BONUS_ALGORUTHM,
            algorithmParam: GameConst.BONUS_PARAM
        };
    }

    restoreExtraToFlows(flows: Function[]): void {
        flows.push((next: Function) => {
            const tileCoins = this._collectedAttachs[ITEM.TileCoin] || 0;
            AppGame.topUI.tileCoinBtn.showTileCoins(tileCoins);
            next();
        });
    }

    createExtraToFlows(flows: Function[]): void {
        flows.push((next: Function) => {
            const tileCoins = this._collectedAttachs[ITEM.TileCoin] || 0;
            AppGame.topUI.tileCoinBtn.showTileCoins(tileCoins);
            next();
        });
    }

    createBuildAfterToFlows(flows: Function[]): void {
        flows.push((next: Function) => {
            MgrUi.Instance.openViewAsync(UIPrefabs.GameLevelType, {
                data: GameMode.Bonus,
                callback: (view: any) => {
                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                        next();
                    });
                }
            });
        });
    }

    collectItemOne(sourcePos: any, itemId: number, count: number): void {
        if (itemId === ITEM.TileCoin) {
            const addCount = Math.floor(GameConst.BONUS_TILE_COIN / 3 * count);
            const result = this.addAttachCount(itemId, addCount);
            
            const itemData = {
                sourcePos: sourcePos,
                itemId: ITEM.TileCoin,
                change: count,
                result: result,
                notify: false
            };
            
            MgrUser.Instance.userData.flyAddItem(itemData);
        }
    }
}
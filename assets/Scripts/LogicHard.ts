import { _decorator, cclegacy } from 'cc';
import { LogicLevel } from './LogicLevel';
import { GameMode } from './Const';
import { UIPrefabs } from './Prefabs';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrUi } from './MgrUi';
import { HardLevelCfg } from './HardLevelCfg';

const { ccclass, property } = _decorator;

@ccclass('LogicHard')
export class LogicHard extends LogicLevel {
    getAlgorithm(level: number): { algorithm: any; algorithmParam: any } {
        const config = HardLevelCfg.Instance.get(level);
        if (config) {
            return {
                algorithm: config.algorithm,
                algorithmParam: config.param
            };
        }
    }

    createBuildAfterToFlows(flows: Function[]): void {
        flows.push((complete: Function) => {
            MgrUi.Instance.openViewAsync(UIPrefabs.GameLevelType, {
                data: GameMode.Hard,
                callback: (view: any) => {
                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                        complete();
                    });
                }
            });
        });
    }
}
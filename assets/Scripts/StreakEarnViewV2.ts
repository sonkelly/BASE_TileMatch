import { _decorator, Node, Button, isValid, Vec3, instantiate, Label, Component, cclegacy } from 'cc';
import { AssetsCfg } from './AssetsCfg';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { Toast } from './Toast';
import { UIIcon } from './UIIcon';
import { Language } from './Language';
import { MgrUser } from './MgrUser';
import { AdsManager } from './AdsManager';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { GameConst } from './GameConst';
import { TASK_TYPE } from './Const';
import { MgrTask } from './MgrTask';
import { each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('StreakEarnViewV2')
export class StreakEarnViewV2 extends Component {
    @property(Node)
    list: Node | null = null;

    @property(Node)
    item: Node | null = null;

    @property(Button)
    normalBtn: Button | null = null;

    @property(Button)
    doubleBtn: Button | null = null;

    private _cfg: any = null;
    private _rewardStr: string | null = null;
    private _delegate: any = null;
    private fourItems: number = 105;
    private twoItems: number = 30;

    reuse(data: { reward: string, cfg: any, delegate: any }) {
        this._rewardStr = data.reward;
        this._cfg = data.cfg;
        this._delegate = data.delegate;
    }

    onLoad() {
        this.normalBtn!.node.on('click', this.onNormalGet, this);
        this.doubleBtn!.node.on('click', this.onDoubleGet, this);
    }

    onEnable() {
        this.showItem();
        this.normalBtn!.node.active = false;
        
        this.scheduleOnce(() => {
            if (isValid(this.node)) {
                this.normalBtn!.node.active = true;
            }
        }, GameConst.AdNext_Delay_Time);
    }

    showItem() {
        this.list!.removeAllChildren();
        const rewardList = MgrWinStreakV2.Instance.getRewardList(this._rewardStr!);
        const yPos = rewardList.length > 2 ? this.fourItems : this.twoItems;
        
        this.list!.setPosition(new Vec3(0, yPos, 0));
        
        each(rewardList, (reward: any[]) => {
            const itemNode = instantiate(this.item!);
            const iconComp = itemNode.getChildByName('icon')!.getComponent(UIIcon)!;
            const labelComp = itemNode.getChildByName('label')!.getComponent(Label)!;
            
            iconComp.icon = AssetsCfg.Instance.get(Number(reward[0])).icon;
            labelComp.string = 'x' + reward[1];
            itemNode.active = true;
            itemNode.parent = this.list!;
            
            MgrWinStreakV2.Instance.streakEarn(this._cfg.winnum);
            MgrUser.Instance.userData.addMemItem(
                Number(reward[0]), 
                Number(reward[1]), 
                MgrWinStreakV2.Instance.getItemAddType()
            );
        });
        
        MgrTask.Instance.data.addTaskData(TASK_TYPE.RECEIVE_JOINWINSTREAK_REWARD, 1);
    }

    onNormalGet() {
        const rewardList = MgrWinStreakV2.Instance.getRewardList(this._rewardStr!);
        
        each(rewardList, (reward: any[]) => {
            const itemId = Number(reward[0]);
            const count = Number(reward[1]);
            this.showFlyAnim(itemId, count);
        });
        
        MgrWinStreakV2.Instance.reportStreakEarn({
            WinStreak_Num: this._cfg.winnum,
            WinStreak_Max: MgrWinStreakV2.Instance.getMaxStreak(),
            Reward: this._cfg.rewards
        });
        
        this._delegate.showItem();
        this.onClose();
    }

    onDoubleGet() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'WinStreak',
            AdsType: 'AdWinStreak',
            onSucceed: () => {
                const rewardList = MgrWinStreakV2.Instance.getRewardList(this._rewardStr!);
                const rewards: string[] = [];
                
                each(rewardList, (reward: any[]) => {
                    const itemId = Number(reward[0]);
                    const count = Number(reward[1]);
                    rewards.push(itemId + '|' + 2 * count);
                    
                    MgrUser.Instance.userData.addItem(itemId, count, {
                        sourcePos: this.list!.getWorldPosition(),
                        type: MgrWinStreakV2.Instance.getItemAddType()
                    });
                });
                
                MgrWinStreakV2.Instance.reportStreakEarn({
                    WinStreak_Num: this._cfg.winnum,
                    WinStreak_Max: MgrWinStreakV2.Instance.data.maxTime,
                    Reward: rewards.join(',')
                });
                
                this._delegate.showItem();
                this.onClose();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    onClose() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    showFlyAnim(itemId: number, count: number) {
        const currentCount = MgrUser.Instance.userData.getItem(itemId);
        MgrUser.Instance.userData.flyAddItem({
            itemId: itemId,
            change: count,
            result: currentCount,
            sourcePos: this.list!.getWorldPosition()
        });
    }
}
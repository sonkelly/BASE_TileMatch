import { _decorator, Node, Button, isValid, Vec3, instantiate, Label, Component, cclegacy } from 'cc';
import { MgrWinStreak } from './MgrWinStreak';
import { AssetsCfg } from './AssetsCfg';
import { UIIcon } from './UIIcon';
import { MgrUser } from './MgrUser';
import { AdsManager } from './AdsManager';
import { Toast } from './Toast';
import { Language } from './Language';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { GameConst } from './GameConst';
import { TASK_TYPE } from './Const';
import { MgrTask } from './MgrTask';
import {each } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('StreakEarnView')
export class StreakEarnView extends Component {
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

    public reuse(data: { reward: string, cfg: any, delegate: any }): void {
        this._rewardStr = data.reward;
        this._cfg = data.cfg;
        this._delegate = data.delegate;
    }

    protected onLoad(): void {
        this.normalBtn!.node.on('click', this.onNormalGet, this);
        this.doubleBtn!.node.on('click', this.onDoubleGet, this);
    }

    protected onEnable(): void {
        this.showItem();
        this.normalBtn!.node.active = false;
        
        this.scheduleOnce(() => {
            if (isValid(this.node)) {
                this.normalBtn!.node.active = true;
            }
        }, GameConst.AdNext_Delay_Time);
    }

    private showItem(): void {
        this.list!.removeAllChildren();
        const rewardList = MgrWinStreak.Instance.getRewardList(this._rewardStr!);
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
            
            MgrWinStreak.Instance.streakEarn(this._cfg.winnum);
            MgrUser.Instance.userData.addMemItem(
                Number(reward[0]), 
                Number(reward[1]), 
                MgrWinStreak.Instance.getItemAddType()
            );
        });
        
        MgrTask.Instance.data.addTaskData(TASK_TYPE.RECEIVE_JOINWINSTREAK_REWARD, 1);
    }

    private onNormalGet(): void {
        const rewardList = MgrWinStreak.Instance.getRewardList(this._rewardStr!);
        
        each(rewardList, (reward: any[]) => {
            const itemId = Number(reward[0]);
            const count = Number(reward[1]);
            this.showFlyAnim(itemId, count);
        });
        
        MgrWinStreak.Instance.reportStreakEarn({
            WinStreak_Num: this._cfg.winnum,
            WinStreak_Max: MgrWinStreak.Instance.getMaxStreak(),
            Reward: this._cfg.rewards
        });
        
        this._delegate.showItem();
        this.onClose();
    }

    private onDoubleGet(): void {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'WinStreak',
            AdsType: 'AdWinStreak',
            onSucceed: () => {
                const rewardList = MgrWinStreak.Instance.getRewardList(this._rewardStr!);
                const rewards: string[] = [];
                
                each(rewardList, (reward: any[]) => {
                    const itemId = Number(reward[0]);
                    const count = Number(reward[1]) * 2;
                    rewards.push(itemId + '|' + count);
                    
                    MgrUser.Instance.userData.addItem(itemId, count, {
                        sourcePos: this.list!.getWorldPosition(),
                        type: MgrWinStreak.Instance.getItemAddType()
                    });
                });
                
                MgrWinStreak.Instance.reportStreakEarn({
                    WinStreak_Num: this._cfg.winnum,
                    WinStreak_Max: MgrWinStreak.Instance.data.maxTime,
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

    private onClose(): void {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private showFlyAnim(itemId: number, count: number): void {
        const currentCount = MgrUser.Instance.userData.getItem(itemId);
        MgrUser.Instance.userData.flyAddItem({
            itemId: itemId,
            change: count,
            result: currentCount,
            sourcePos: this.list!.getWorldPosition()
        });
    }
}
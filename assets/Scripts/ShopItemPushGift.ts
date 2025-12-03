import { _decorator } from 'cc';
import {ShopItemLimited} from './ShopItemLimited';
import { MgrShop } from './MgrShop';
import {Tools} from './Tools';
import {Language} from './Language';
import {Utils} from './Utils';
const { ccclass } = _decorator;

@ccclass('ShopItemPushGift')
export default class ShopItemPushGift extends ShopItemLimited {
    public _refreshRemainTime(): void {
        const remaining = MgrShop.Instance.getPackageCloseTime(this._cfg.id) - Tools.GetNowTime();
        if (remaining <= 0) {
            this.timeLabel.string = '';
        } else {
            const prefix = Language.Instance.getLangByID('Pass_Time');
            const t = Utils.timeConvertToDDHHOrHHMM(remaining);
            this.timeLabel.string = prefix + t;
        }
    }
}
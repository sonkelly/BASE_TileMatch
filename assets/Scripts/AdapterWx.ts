import { _decorator, view, Widget, cclegacy } from 'cc';
const { ccclass, property } = _decorator;
declare const wx : any;

@ccclass('AdapterWx')
export default class AdapterWx {
    public static top(ay: any, aA: any) {
        if (wx && wx.getMenuButtonBoundingClientRect) {
            const aB = wx.getMenuButtonBoundingClientRect();
            const aC = wx.getSystemInfoSync();
            let aD = view.getVisibleSize().height * (aB.bottom / aC.screenHeight);
            if (aA) {
                aD -= aA.getComponent(Widget).top;
            }
            ay.top = Math.max(ay.top, aD + 5);
        }
    }

    public static right(aE: any, aF: any) {
        if (wx && wx.getMenuButtonBoundingClientRect) {
            const aG = aF?.getComponent(Widget);
            const aH = wx.getMenuButtonBoundingClientRect();
            const aI = wx.getSystemInfoSync();
            let aJ = view.getVisibleSize().height * (aH.bottom / aI.screenHeight);
            aG && (aJ -= aG.top);
            let aK = view.getVisibleSize().width * (1 - aH.left / aI.screenWidth);
            aG && (aK -= aG.right);
            if (aJ > 0) {
                aE.right = Math.max(aE.right, aK + 5);
            }
            console.log('widget.right', aE.right);
        }
    }

    public static setKeepScreenOn(aw: boolean) {
        wx && wx.setKeepScreenOn && wx.setKeepScreenOn({
            keepScreenOn: aw
        });
    }
}
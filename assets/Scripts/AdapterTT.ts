import { _decorator, view, Widget, cclegacy } from 'cc';
const { ccclass, property } = _decorator;
declare const tt : any;
@ccclass('AdapterTT')
export default class AdapterTT {
    public static top(ad: any, af: any) {
        if (tt && tt.getMenuButtonBoundingClientRect) {
            const ag = tt.getMenuButtonBoundingClientRect();
            const ah = tt.getSystemInfoSync();
            let ai = view.getVisibleSize().height * (ag.bottom / ah.screenHeight);
            if (af) {
                ai -= af.getComponent(Widget).top;
            }
            ad.top = Math.max(ad.top, ai + 5);
        }
    }

    public static right(aj: any, ak: any) {
        if (tt && tt.getMenuButtonBoundingClientRect) {
            const al = ak?.getComponent(Widget);
            const am = tt.getMenuButtonBoundingClientRect();
            const an = tt.getSystemInfoSync();
            let ao = view.getVisibleSize().height * (am.bottom / an.screenHeight);
            al && (ao -= al.top);
            let ap = view.getVisibleSize().width * (1 - am.left / an.screenWidth);
            al && (ap -= al.right);
            ao > 0 && (aj.right = Math.max(aj.right, ap + 5));
            console.log('widget.right', aj.right);
        }
    }

    public static setKeepScreenOn(ab: boolean) {
        tt && tt.setKeepScreenOn && tt.setKeepScreenOn({
            keepScreenOn: ab
        });
    }
}
import { _decorator, cclegacy, sys } from 'cc';
import { each } from 'lodash-es';
import { ShopPackageType } from './Const';
import { IMAGE_SHOP_ICON } from './Prefabs';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import { ChannelType, channelManager } from './ChannelManager';
import { ICfgParse } from './ICfgParse';

const { ccclass } = _decorator;

@ccclass('ShopCfg')
export class ShopCfg extends ICfgParse {
    private static _instance: ShopCfg;
    private _allPackages: any[] = [];
    private _limitedPackages: any[] = [];
    private _turnPackages: any[] = [];
    private _currencyPackages: any[] = [];
    private _normalPackages: any[] = [];
    private _pushGiftPackages: any[] = [];

    constructor() {
        super();
        this.jsonFileName = 'shop';
    }

    public loaded(): void {
        const self = this;
        each(this._cfg, (cfgItem: any) => {
            self._allPackages.push(cfgItem);
            switch (cfgItem.type) {
                case ShopPackageType.Limited:
                    self._limitedPackages.push(cfgItem.id);
                    break;
                case ShopPackageType.PushGift:
                    self._pushGiftPackages.push(cfgItem.id);
                    break;
                case ShopPackageType.Currency:
                    self._currencyPackages.push(cfgItem.id);
                    break;
                case ShopPackageType.Turn:
                    self._turnPackages.push(cfgItem.id);
                    break;
                default:
                    self._normalPackages.push(cfgItem.id);
            }
        });
    }

    public get(id: any): any {
        return this.cfg[id];
    }

    public loadPackageIcon(packageId: any): Promise<any> | null {
        const cfg = this.get(packageId);
        if (cfg) {
            return AssetMgr.Instance.loadSpriteFrame(BUNDLE_NAMES.Game, `${IMAGE_SHOP_ICON}/${cfg.icon}`);
        } else {
            console.error('no cfg by packageId:', packageId);
            return null;
        }
    }

    public getCfgByProductId(productId: string): any {
        for (let i = 0; i < this._allPackages.length; i++) {
            const cfgItem = this._allPackages[i];
            if (cfgItem.andIapId === productId || cfgItem.iosIapId === productId || cfgItem.FBIapId === productId) {
                return cfgItem;
            }
        }
        console.error('no cfg by productId:', productId);
        return null;
    }

    public getProductIdById(id: any): string | null {
        const cfg = this.get(id);
        if (sys.isNative && sys.platform === sys.Platform.ANDROID) {
            return cfg.andIapId;
        } else if (sys.isNative && sys.platform === sys.Platform.IOS) {
            return cfg.iosIapId;
        } else if (ChannelType.FaceBook === channelManager.getChannelType()) {
            return cfg.FBIapId;
        }
        return null;
    }

    public get limitedPackages(): any[] {
        return this._limitedPackages;
    }

    public get turnPackages(): any[] {
        return this._turnPackages;
    }

    public get currencyPackages(): any[] {
        return this._currencyPackages;
    }

    public get normalPackages(): any[] {
        return this._normalPackages;
    }

    public get pushGiftPackages(): any[] {
        return this._pushGiftPackages;
    }

    public static get Instance(): ShopCfg {
        if (!ShopCfg._instance) {
            ShopCfg._instance = new ShopCfg().load();
        }
        return ShopCfg._instance;
    }
}
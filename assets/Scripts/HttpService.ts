import { _decorator, Component } from 'cc';
import { config } from './Config';
import HttpMgr from './HttpMgr';

const { ccclass, property } = _decorator;

export enum PurchaseState {
    Purchased = 0,
    Canceled = 1,
    Pending = 2
}

@ccclass('HttpService')
export class HttpService extends Component {
    
    private static _ins: HttpService = null;
    private _url: string = 'https://tilemasterpro.service.dblidle.com';

    public static get Instance(): HttpService {
        if (!this._ins) {
            this._ins = new HttpService();
        }
        return this._ins;
    }

    async getServerTime(appid: string): Promise<any> {
        try {
            const data = {
                appid: appid
            };
            const url = this._url + '/v1/nowTime';
            return (await HttpMgr.HttpGetPSync(url, data)).data;
        } catch (error) {
            if (config.debug) {
                console.error(error);
            }
            return null;
        }
    }

    async login(appid: string, token: string, code: string, name: string, photo: string): Promise<any> {
        try {
            const data = {
                appid: appid,
                token: token,
                code: code,
                name: name,
                photo: photo
            };
            const url = this._url + '/v2/auth/login';
            return await HttpMgr.HttpPostSync(data, url);
        } catch (error) {
            if (config.debug) {
                console.error(error);
            }
            return null;
        }
    }

    async uploadRecord(appid: string, uid: string, record: any, sign: string): Promise<boolean> {
        try {
            const data = {
                appid: appid,
                uid: uid,
                record: record,
                sign: sign
            };
            const url = this._url + '/v2/user/uploadRecord';
            return (await HttpMgr.HttpPostSync(data, url)).code === 200;
        } catch (error) {
            if (config.debug) {
                console.error(error);
            }
            return null;
        }
    }

    async validatePurchase(appid: string, shopId: string, orderId: string, token: string): Promise<any> {
        try {
            const data = {
                appid: appid,
                shopId: shopId,
                orderId: orderId,
                token: token
            };
            const url = this._url + '/v2/shop/validatePurchase';
            return await HttpMgr.HttpIAPValidateSync(data, url);
        } catch (error) {
            if (config.debug) {
                console.error(error);
            }
            return null;
        }
    }
}
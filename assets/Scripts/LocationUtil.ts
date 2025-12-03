import { _decorator, cclegacy, sys, native } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LocationUtil')
export class LocationUtil {
    private static _ins: LocationUtil | null = null;

    public static get Instance(): LocationUtil {
        if (!this._ins) {
            this._ins = new LocationUtil();
        }
        return this._ins;
    }

    public async getCountry(): Promise<any> {
        try {
            return await this._HttpGetPSync('http://ip-api.com/json/');
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public getCountryCode(): string {
        let countryCode = '';
        if (sys.platform === sys.Platform.ANDROID) {
            countryCode = native.reflection.callStaticMethod(
                'com/cocos/game/SdkBrigde', 
                'getCountryCode', 
                '()Ljava/lang/String;'
            );
        }
        return countryCode;
    }

    private _HttpGetPSync(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response && response.status === 'success') {
                            resolve(response);
                        } else {
                            reject(`Error! url:${url} -> response: ${xhr.responseText}`);
                        }
                    } catch (e) {
                        reject(e);
                    }
                }
            };

            ['loadstart', 'abort', 'error', 'load', 'loadend', 'timeout'].forEach(event => {
                xhr[`on${event}`] = () => {
                    if (event === 'error' || event === 'timeout') {
                        const errorMsg = `status:${xhr.status} \n -> url:${url}`;
                        reject(errorMsg);
                    }
                };
            });

            xhr.open('GET', url, true);
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.timeout = 10000;
            xhr.send();
        });
    }
}
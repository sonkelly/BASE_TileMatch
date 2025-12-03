import { _decorator, cclegacy } from 'cc';
import {isEmpty, each} from 'lodash-es';

const { ccclass } = _decorator;

@ccclass('HttpMgr')
export default class HttpMgr {
    public static HttpGetPSync(url: string, data?: any, headers?: Record<string, string>): Promise<any> {
        return this._HttpRequestSync('GET', url, data, headers);
    }

    public static HttpPostSync(url: string, data?: any, headers?: Record<string, string>): Promise<any> {
        return this._HttpRequestSync('POST', url, data, headers);
    }

    private static _HttpRequestSync(method: string, url: string, data?: any, headers?: Record<string, string>): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response && response.code === 200) {
                            resolve(response);
                        } else {
                            reject(`Error! code ${response?.code} -> [method:${method}] -> url:${url} \n -> request:${JSON.stringify(data)} \n -> response: ${xhr.responseText}`);
                        }
                    } catch (error) {
                        reject(`JSON parse error: ${error}`);
                    }
                }
            };

            ['loadstart', 'abort', 'error', 'load', 'loadend', 'timeout'].forEach(event => {
                xhr[`on${event}`] = function() {
                    if (event === 'error' || event === 'timeout') {
                        const errorMsg = `[${method}] -> ${event} status:${xhr.status} \n -> url:${url} \n -> request:${JSON.stringify(data)}`;
                        reject(errorMsg);
                    }
                };
            });

            if (method === 'GET') {
                const encodedUrl = this._encodeGET(url, data);
                xhr.open(method, encodedUrl, true);
            } else {
                xhr.open(method, url, true);
            }

            if (headers) {
                Object.entries(headers).forEach(([key, value]) => {
                    xhr.setRequestHeader(key, value);
                });
            }

            xhr.setRequestHeader('content-type', 'application/json');
            xhr.timeout = 10000;

            if (method === 'GET') {
                xhr.send();
            } else {
                xhr.send(this._encodePOST(data));
            }
        });
    }

    public static HttpIAPValidateSync(url: string, data?: any, headers?: Record<string, string>): Promise<any> {
        return this._HttpIAPValidateSync('POST', url, data, headers);
    }

    private static _HttpIAPValidateSync(method: string, url: string, data?: any, headers?: Record<string, string>): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        console.log(`googlePay [method:${method}] -> url:${url} -> response: ${xhr.responseText}`);
                        resolve(response);
                    } catch (error) {
                        reject(`JSON parse error: ${error}`);
                    }
                }
            };

            ['loadstart', 'abort', 'error', 'load', 'loadend', 'timeout'].forEach(event => {
                xhr[`on${event}`] = function() {
                    if (event === 'error' || event === 'timeout') {
                        const errorMsg = `googlePay [${method}] -> ${event} status:${xhr.status} -> url:${url} -> request:${JSON.stringify(data)}`;
                        reject(errorMsg);
                    }
                };
            });

            if (method === 'GET') {
                const encodedUrl = this._encodeGET(url, data);
                xhr.open(method, encodedUrl, true);
            } else {
                xhr.open(method, url, true);
            }

            if (headers) {
                Object.entries(headers).forEach(([key, value]) => {
                    xhr.setRequestHeader(key, value);
                });
            }

            xhr.setRequestHeader('content-type', 'application/json');
            xhr.timeout = 10000;

            if (method === 'GET') {
                xhr.send();
            } else {
                xhr.send(this._encodePOST(data));
            }
        });
    }
    
    private static _encodeGET(url: string, data?: any): string {
        let result = url;
        if (!isEmpty(data)) {
            result += '?';
            const params: string[] = [];
            each(data, (value: any, key: string) => {
                params.push(`${key}=${value}`);
            });
            result += params.join('&');
        }
        return result;
    }

    private static _encodePOST(data?: any): string {
        return JSON.stringify(data);
    }
}
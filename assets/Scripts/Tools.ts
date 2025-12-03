import { _decorator, Component } from 'cc';
import { config } from './Config';
import {isNil} from 'lodash-es';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass } = _decorator;

@ccclass('Tools')
export class Tools extends Component {
    public static serverTime: number = new Date().getTime();
    public static runningTime: number = 0;

    public static GetNowTime(): number {
        return config.checkNetTime ? Tools.serverTime + Tools.runningTime : new Date().getTime();
    }

    public static GetNowDate(): Date {
        return new Date(Tools.GetNowTime());
    }

    public static GetNowMoment(): moment.Moment {
        return config.checkNetTime ? moment(Tools.GetNowTime()) : moment();
    }

    public static GetTodayResetTime(): moment.Moment {
        return moment(Tools.GetNowTime()).startOf('days');
    }

    public static isSameDay(time1: number, time2: number): boolean {
        return new Date(time1).setHours(0, 0, 0, 0) === new Date(time2).setHours(0, 0, 0, 0);
    }

    public static isSameWeek(time1: number, time2: number): boolean {
        const dayMs = 86400000;
        const dayCount1 = Math.floor(new Date(time1).getTime() / dayMs);
        const dayCount2 = Math.floor(new Date(time2).getTime() / dayMs);
        return Math.floor((dayCount1 + 4) / 7) === Math.floor((dayCount2 + 4) / 7);
    }

    public static GenerateUUID(length?: number, radix?: number): string {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        const uuid: string[] = [];
        radix = radix || chars.length;

        if (length) {
            for (let i = 0; i < length; i++) {
                uuid[i] = chars[Math.floor(Math.random() * radix)];
            }
        } else {
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            
            for (let i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    const r = Math.floor(16 * Math.random());
                    uuid[i] = chars[i === 19 ? (r & 3) | 8 : r];
                }
            }
        }
        return uuid.join('');
    }

    public static formatNumberToThousand(num: number, unit?: string): string {
        if (num < 1000) return String(num);
        
        unit = unit || '';
        const units = ['k', 'm', 'g', 't', 'p', 'e', 'b'];
        let unitIndex = units.indexOf(unit);
        
        while (num > 1000 && !(++unitIndex >= units.length)) {
            num /= 1000;
        }
        return Math.floor(num + 0.5) + units[unitIndex];
    }

    public static arrayUnique<T>(arr: T[]): T[] {
        const result: T[] = [];
        const seen: Record<string, boolean> = {};
        
        for (let i = 0; i < arr.length; i++) {
            if (!seen[String(arr[i])]) {
                seen[String(arr[i])] = true;
                result.push(arr[i]);
            }
        }
        return result;
    }

    public static getRandomArrayElements<T>(arr: T[], count: number): T[] {
        const shuffled = arr.slice();
        const n = arr.length;
        const start = n - count;
        
        for (let i = n - 1; i > start; i--) {
            const j = Math.floor((i + 1) * Math.random());
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(start);
    }

    public static shuffle<T>(arr: T[]): T[] {
        const result = arr.slice();
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    public static sleep(node: Node, delay: number): Promise<void> {
        return new Promise(resolve => {
            node.scheduleOnce(resolve, delay);
        });
    }

    public static getStringSize(str: string): string {
        let size = 2 * str.length;
        let unitIndex = 0;
        const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
        
        while (size > 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return size.toFixed(2) + units[unitIndex];
    }

    public static randomRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    public static getRangeCloseNum(min: number, max: number): number {
        return Tools.randomRange(min, max + 1);
    }

    public static formatNumberToInt(num: number, decimals: number = 0): string {
        const sign = num < 0 ? '-' : '';
        const absNum = Math.abs(+num || 0).toFixed(decimals);
        const intPart = parseInt(absNum, 10).toString();
        const commaPos = intPart.length > 3 ? intPart.length % 3 : 0;
        
        let result = sign + (commaPos ? intPart.substr(0, commaPos) + ',' : '') + 
                   intPart.substr(commaPos).replace(/(\d{3})(?=\d)/g, '$1,');
        
        if (decimals) {
            const decimalPart = Math.abs(num - parseInt(intPart)).toFixed(decimals).slice(2);
            result += '.' + decimalPart;
        }
        return result;
    }

    public static formatNumberToFloatStr(num: number): number {
        return Math.floor(100 * num + 0.5) / 100;
    }

    public static switchScoreStr(score: number | string, format: boolean = false): string {
        if (typeof score === 'string') return score;
        
        const tenThousand = 10000;
        const hundredMillion = tenThousand * tenThousand;
        const absScore = Math.abs(score);
        let result = '';
        
        if (absScore < 100000) {
            result += format ? this.formatNumberToInt(score) : Math.floor(score);
        } else if (absScore >= 100000 && absScore < hundredMillion) {
            result += (format ? this.formatNumberToInt(score / tenThousand, 2) : 
                      this.formatNumberToFloatStr(score / tenThousand)) + '万';
        } else if (absScore >= hundredMillion) {
            result += (format ? this.formatNumberToInt(score / hundredMillion, 2) : 
                      this.formatNumberToFloatStr(score / hundredMillion)) + '亿';
        }
        return result;
    }

    public static switchToSimplifiedChinese(num: string): string {
        let cleanNum = num.replace(/[, ]/g, '');
        if (isNaN(Number(cleanNum))) return '';
        
        const parts = cleanNum.split('.');
        let result = '';
        const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const units = ['', '十', '百', '千', '万', '十', '百', '千', '亿', '十'];
        
        for (let i = parts[0].length - 1; i >= 0; i--) {
            if (parts[0].length > 10) return '';
            
            const digit = parts[0].charAt(i);
            const digitIndex = parseInt(digit);
            let current = digits[digitIndex];
            
            const unitIndex = parts[0].length - i - 1;
            if (digit !== '0' && unitIndex > 0 && unitIndex < units.length) {
                current += units[unitIndex];
            } else if (unitIndex === 4 || unitIndex === 8) {
                current += units[unitIndex];
            }
            
            result = current + result;
        }
        
        while (result.includes('零零') || result.includes('零亿') || 
               result.includes('亿万') || result.includes('零万')) {
            result = result.replace('零亿', '亿')
                          .replace('亿万', '亿')
                          .replace('零万', '万')
                          .replace('零零', '零');
        }
        
        if (result.startsWith('一十')) result = result.substring(1);
        if (result.endsWith('零')) result = result.substring(0, result.length - 1);
        
        return result;
    }

    public static checkPhoneNum(phone: string): boolean {
        return /^[1][0-9]{10}$/.test(phone);
    }

    public static checkPassWord(password: string): boolean {
        return password.length >= 6 && password.length <= 10;
    }

    public static getChLength(str: string): number {
        return str.replace(/[\u0391-\uFFE5]/g, 'aa').length;
    }

    public static checkAccount(account: string): boolean {
        return /^[A-Za-z0-9]{6,12}$/.test(account);
    }

    public static checkCode(code: string): boolean {
        return /^[0-9]{4}$/.test(code);
    }

    public static dateFormat(format: string, date: Date): string {
        const replacements: Record<string, string> = {
            'Y+': date.getFullYear().toString(),
            'm+': (date.getMonth() + 1).toString(),
            'd+': date.getDate().toString(),
            'H+': date.getHours().toString(),
            'M+': date.getMinutes().toString(),
            'S+': date.getSeconds().toString()
        };
        
        let result = format;
        for (const pattern in replacements) {
            const regex = new RegExp('(' + pattern + ')');
            const match = regex.exec(result);
            if (match) {
                const replacement = match[1].length === 1 ? 
                    replacements[pattern] : 
                    replacements[pattern].padStart(match[1].length, '0');
                result = result.replace(match[1], replacement);
            }
        }
        return result;
    }

    public static sequence(functions: Array<(next: () => void) => void>): void {
        if (Array.isArray(functions) && functions.length > 0) {
            let index = 0;
            const next = () => {
                if (++index < functions.length) {
                    execute();
                }
            };
            const execute = () => {
                const func = functions[index];
                func && func(next);
            };
            execute();
        }
    }

    public static versionCompare(ver1: string, ver2: string, maxSegments?: number): number {
        const parts1 = ver1.split('.');
        const parts2 = ver2.split('.');
        const segments = isNil(maxSegments) ? parts1.length : maxSegments;
        
        for (let i = 0; i < segments; i++) {
            const num1 = parseInt(parts1[i] || '0');
            const num2 = parseInt(parts2[i] || '0');
            if (num1 !== num2) {
                return num1 - num2;
            }
        }
        return 0;
    }
}
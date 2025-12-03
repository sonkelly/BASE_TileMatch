import { _decorator, Vec2, Vec3 } from 'cc';
import { LanguageData } from './LanguageData';
import {Language} from './Language';
import {Tools} from './Tools';
import {isNil, map} from 'lodash-es';

const { ccclass, property } = _decorator;

export class Utils {
    public static readonly DAY: number = 86400000;
    public static readonly HOUR: number = 3600000;
    public static readonly MINUTE: number = 60000;
    public static readonly SECOND: number = 1000;

    public static random(max: number): number {
        return Math.random() * max;
    }

    public static randomRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    public static randomRangeFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    public static randomInt(max: number): number {
        return Math.floor(0x51eb851eb848 * Math.random()) % max;
    }

    public static getRandIndex(weights: number[], total?: number): number {
        if (isNil(total)) {
            total = 0;
            for (const weight of weights) {
                total += weight;
            }
        }

        const randomValue = Utils.random(total);
        let cumulative = 0;

        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (randomValue < cumulative) {
                return i;
            }
        }

        return weights.length - 1;
    }


    public static getElementByWeight<T>(array: T[], weightFn?: (item: T, index: number) => number, total?: number): T {
        weightFn = weightFn || ((item: T) => 1);
        const weights = map(array, weightFn);
        return array[Utils.getRandIndex(weights, total)];
    }

    public static wait(seconds: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, 1000 * seconds);
        });
    }

    public static isSameDay(date1: number, date2: number): boolean {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.setHours(0, 0, 0, 0) === d2.setHours(0, 0, 0, 0);
    }

    public static isSameWeek(date1: number, date2: number): boolean {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return this.toMonday(d1) === this.toMonday(d2);
    }

    public static toMonday(date: Date): number {
        const d = new Date(date);
        const day = d.getDay();
        const dateNum = d.getDate();
        
        if (day === 0) {
            d.setDate(dateNum - 7 + 1);
        } else {
            d.setDate(dateNum - day + 1);
        }
        
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    public static getNextDayTimeStamp(timestamp: number): number {
        const date = new Date(timestamp + 86400000);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }

    public static getNextMondayTimeStamp(timestamp: number): number {
        const date = new Date(timestamp);
        const day = date.getDay();
        const dateNum = date.getDate();
        
        if (day === 0) {
            date.setDate(dateNum - 7 + 8);
        } else {
            date.setDate(dateNum - day + 8);
        }
        
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }

    public static timeConvertToDDHHMMSS(time: number): string {
        let result = '';
        const days = Math.floor(time / Utils.DAY);
        const hoursRemainder = time % Utils.DAY;
        const hours = Math.floor(hoursRemainder / Utils.HOUR);
        const minutesRemainder = hoursRemainder % Utils.HOUR;
        const minutes = Math.floor(minutesRemainder / Utils.MINUTE);
        const secondsRemainder = minutesRemainder % Utils.MINUTE;
        const seconds = Math.floor(secondsRemainder / Utils.SECOND);

        if (days > 0) {
            result += `${days}${LanguageData.getLangByID('day')} `;
        }

        result += `${hours >= 10 ? hours : '0' + hours}:`;
        result += `${minutes >= 10 ? minutes : '0' + minutes}:`;
        result += `${seconds >= 10 ? seconds : '0' + seconds}`;

        return result;
    }

    public static getDayOfYear(): number {
        const now = Tools.GetNowDate();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - startOfYear.getTime() + 
                    60 * (startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) * 1000;
        return Math.floor(diff / 86400000);
    }

    public static timeConvertToDDHHOrHHMM(time: number): string {
        let result = '';
        const days = Math.floor(time / Utils.DAY);
        const hoursRemainder = time % Utils.DAY;
        const hours = Math.floor(hoursRemainder / Utils.HOUR);
        const minutesRemainder = hoursRemainder % Utils.HOUR;
        const minutes = Math.floor(minutesRemainder / Utils.MINUTE);

        if (days > 0) {
            result += `${days}${Language.Instance.getLangByID('Task_Day')}`;
            result += ` ${hours}${Language.Instance.getLangByID('Task_Hour')}`;
        } else {
            result += `${hours}${Language.Instance.getLangByID('Task_Hour')}`;
            result += ` ${minutes}${Language.Instance.getLangByID('Task_Min')}`;
        }

        return result;
    }

    public static timeConvertToDDHH(time: number): string {
        let result = '';
        const days = Math.floor(time / Utils.DAY);
        const hoursRemainder = time % Utils.DAY;
        const hours = Math.floor(hoursRemainder / Utils.HOUR);

        if (days > 0) {
            result += ` ${days}${Language.Instance.getLangByID('Task_Day')}`;
        }
        
        result += ` ${hours}${Language.Instance.getLangByID('Task_Hour')}`;
        return result;
    }

    public static timeConvertToHHMM(time: number): string {
        let result = '';
        const days = Math.floor(time / Utils.DAY);
        const hoursRemainder = time % Utils.DAY;
        const hours = Math.floor(hoursRemainder / Utils.HOUR);
        const minutesRemainder = hoursRemainder % Utils.HOUR;
        const minutes = Math.floor(minutesRemainder / Utils.MINUTE);

        if (days > 0) {
            result += ` ${days}${Language.Instance.getLangByID('Task_Day')}`;
        }
        
        result += ` ${hours}${Language.Instance.getLangByID('Task_Hour')}`;
        
        if (days <= 0) {
            result += ` ${minutes}${Language.Instance.getLangByID('Task_Min')}`;
        }

        return result;
    }

    public static timeConvertToHHMMSS(time: number): string {
        let result = '';
        const days = Math.floor(time / Utils.DAY);
        const hoursRemainder = time % Utils.DAY;
        const hours = Math.floor(hoursRemainder / Utils.HOUR);
        const minutesRemainder = hoursRemainder % Utils.HOUR;
        const minutes = Math.floor(minutesRemainder / Utils.MINUTE);
        const secondsRemainder = minutesRemainder % Utils.MINUTE;
        const seconds = Math.floor(secondsRemainder / Utils.SECOND);

        result += `${hours}`;
        
        if (days <= 0) {
            result += ` :${minutes}`;
            result += `:${seconds}`;
        }

        return result;
    }

    public static SetString(text: string, maxLength: number): string {
        let currentLength = 0;
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
            currentLength++;
            result += text.charAt(i);
            
            if (currentLength >= maxLength) {
                return result + '...';
            }
        }
        
        return result;
    }

    public static extractNonNumericCharacters(text: string): string {
        const match = text.match(/^[^\d]*/);
        return match ? match[0] : '';
    }
}
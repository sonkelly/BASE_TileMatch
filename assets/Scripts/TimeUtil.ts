import { _decorator, cclegacy } from 'cc';
import { Tools } from './Tools';

const { ccclass, property } = _decorator;

function getTimestamp(): number {
    return Tools.GetNowTime();
}

function getDate(): string {
    return Tools.GetNowDate().toLocaleDateString();
}

function getNowTime(showDate: boolean = true): string {
    let result = '';
    if (showDate) {
        result += getDate() + '/';
    }
    const now = Tools.GetNowDate();
    return result + now.getHours() + '/' + now.getMinutes() + '/' + now.getSeconds();
}

function isSameUtcDate(timestamp: number): boolean {
    const targetDate = new Date(timestamp);
    const now = Tools.GetNowDate();
    return targetDate.getFullYear() === now.getFullYear() &&
            targetDate.getMonth() === now.getMonth() &&
            targetDate.getDate() === now.getDate();
}

function getTargetTimestamp(hours: number = 0, minutes: number = 0, seconds: number = 0): number {
    const todayStart = new Date(Tools.GetNowDate().toLocaleDateString()).getTime();
    return new Date(todayStart + 1000 * (3600 * hours + 60 * minutes + seconds)).getTime();
}

function msToHMS(ms: number, separator: string = ':', showHours: boolean = true): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms - 3600000 * hours) / 60000);
    const seconds = Math.floor((ms - 3600000 * hours - 60000 * minutes) / 1000);
    
    let result = '';
    if (hours !== 0 || showHours) {
        result += hours.toString().padStart(2, '0') + ':';
    }
    result += minutes.toString().padStart(2, '0') + separator + seconds.toString().padStart(2, '0');
    return result;
}

function isSameDay(dateString: string): boolean {
    const now = this.getDateNow();
    const dateParts = dateString.split('-');
    return parseInt(dateParts[0]) === now.getFullYear() &&
            parseInt(dateParts[1]) === now.getMonth() &&
            parseInt(dateParts[2]) === now.getDate();
}

function getDateNow(): Date {
    return Tools.GetNowDate();
}

export {isSameUtcDate, getNowTime}
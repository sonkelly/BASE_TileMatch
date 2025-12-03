import { _decorator, cclegacy } from 'cc';
import { Big } from 'big.js';
import {toNumber, indexOf} from 'lodash-es';

const { ccclass } = _decorator;

const LETTERS = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 26; j++) {
        LETTERS.push(String.fromCharCode(0x41 + i) + String.fromCharCode(0x41 + j));
    }
}

Big.DP = 2;
Big.PE = 2000;

@ccclass('NumberPlus')
export class NumberPlus {
    public static add(a: string | number, b: string | number): number {
        const numA = new Big(a);
        const numB = new Big(b);
        return numA.plus(numB).toString();
    }

    public static sub(a: string | number, b: string | number): number {
        const numA = new Big(a);
        const numB = new Big(b);
        return numA.minus(numB).toString();
    }

    public static mul(a: string | number, b: string | number): number {
        const numA = new Big(a);
        const numB = new Big(b);
        return numA.times(numB).toString();
    }

    public static div(a: string | number, b: string | number): number {
        const numA = new Big(a);
        const numB = new Big(b);
        return numA.div(numB).toString();
    }

    public static pow(base: string | number, exponent: number): number {
        return new Big(base).pow(exponent).toString();
    }

    public static percent(value: string | number, max: string | number): number {
        const numValue = new Big(value);
        const numMax = new Big(max);
        return numValue.gte(numMax) ? 1 : numValue.div(numMax).toNumber();
    }

    public static lerp(start: string | number, end: string | number, t: number): number {
        const numStart = new Big(start);
        const numEnd = new Big(end);
        return numStart.plus(numEnd.minus(numStart).mul(t)).toString();
    }

    public static compare(a: string | number, b: string | number): boolean {
        const numA = new Big(a);
        const numB = new Big(b);
        return numA.gte(numB);
    }

    public static toFixed(value: string | number, decimalPlaces: number = 2): string {
        return new Big(value).toFixed(decimalPlaces).toString();
    }

    public static format(value: string | number, decimalPlaces: number = 2): string {
        let suffix = '';
        let numStr = new Big(value).toFixed(0);
        
        if (numStr.length > 3) {
            const groupCount = Math.floor(numStr.length / 3);
            const remainder = numStr.length % 3;
            
            if (remainder === 0) {
                suffix = LETTERS[groupCount - 1];
                numStr = (Number(numStr.substr(0, numStr.length - 3 * (groupCount - 1))) / 1000).toString();
            } else {
                suffix = LETTERS[groupCount];
                numStr = (Number(numStr.substr(0, remainder)) / Math.pow(10, remainder)).toString();
            }
        }
        
        return this.number_format(numStr, decimalPlaces) + suffix;
    }

    public static number_format(value: string | number, decimalPlaces: number): string {
        const num = isFinite(+value) ? +value : 0;
        const places = isFinite(decimalPlaces) ? Math.abs(decimalPlaces) : 0;
        
        const rounded = places ? 
            (Math.floor(num * Math.pow(10, places) + 0.5) / Math.pow(10, places)).toString() :
            Math.round(num).toString();
            
        const parts = rounded.split('.');
        
        if (parts.length > 1 && (parts[1] || '').length < places) {
            parts[1] = parts[1] || '';
            parts[1] += '0'.repeat(places - parts[1].length);
        }
        
        return parts.join('.');
    }

    public static decode(encoded: string): string {
        if (encoded.length >= 2) {
            const letterIndex = encoded.search(/[A-Za-z]/);
            
            if (letterIndex > 0) {
                const numericPart = Math.floor(1000 * toNumber(encoded.substring(0, letterIndex)));
                const letterPart = encoded.substring(letterIndex);
                const letterIndexInArray = indexOf(LETTERS, letterPart);
                
                return numericPart.toString() + '0'.repeat(3 * (letterIndexInArray - 1));
            }
        }
        
        return encoded;
    }
}
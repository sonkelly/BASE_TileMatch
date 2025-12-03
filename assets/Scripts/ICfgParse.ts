import { _decorator, cclegacy } from 'cc';
import { keys, cloneDeep, each ,toNumber} from 'lodash-es';
import { MgrCfg } from './MgrCfg';

const { ccclass, property } = _decorator;

@ccclass('ICfgParse')
export class ICfgParse {
    public _cfg: any = null;
    public jsonFileName : string;
    public parseArray(fields: string[], data: any, rules?: any[]): any[] {
        const result: any[] = [];
        
        if (rules && rules.length > 0) {
            keys(data).forEach(key => {
                result.push(this.parse(fields, data[key], cloneDeep(rules)));
            });
        } else {
            keys(data).forEach(key => {
                const rowData = data[key];
                const rowObj: any = [];
                
                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];
                    const value = rowData[i];
                    rowObj[field] = value;
                }
                
                result.push(rowObj);
            });
        }
        
        return result;
    }

    public praseTable(fields: string[], data: any, rules?: any[]): any {
        const result: any = {};
        
        if (rules && rules.length > 0) {
            keys(data).forEach(key => {
                result[key] = this.parse(fields, data[key], cloneDeep(rules));
            });
        } else {
            keys(data).forEach(key => {
                const rowData = data[key];
                const rowObj: any = {};
                
                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];
                    const value = rowData[i];
                    rowObj[field] = value;
                }
                
                result[key] = rowObj;
            });
        }
        
        return result;
    }

    public parse(fields: string[], data: any, rules: any[]): any {
        const rule = rules.shift();
        
        switch (rule) {
            case 'm':
                return this.praseTable(fields, data, rules);
            case 'a':
                return this.parseArray(fields, data, rules);
        }
    }

    public load(): this {
        //debugger
        const config = MgrCfg.Instance.getConfig(this.jsonFileName);
        console.error(this.jsonFileName)
        const fields = config.fields;
        const rules = config.rules;
        const datas = config.datas;
        
        this._cfg = this.parse(fields, datas, rules);
        this.convert();
        this.loaded();
        
        return this;
    }

    public convert(): void {}

    public loaded(): void {}

    public getAll(): any {
        return this._cfg;
    }

    public convertStrToNumberArr(str: string, separator: string = ','): number[] {
        const arr = str.split(separator);
        
        each(arr, (value, index) => {
            arr[index] = toNumber(value);
        });
        
        return arr;
    }

    get cfg(): any {
        return this._cfg;
    }
}
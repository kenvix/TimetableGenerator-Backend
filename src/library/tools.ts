//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

import {ApplicationConfig, DutyHistory} from "./interfaces";
import * as fs from "fs";
import * as yaml from "js-yaml";
import {BuildConfig} from "./config";

export default class Tools {
    private static config: ApplicationConfig;
    private static weekStartTime: number = -1;

    public static loadConfig(configPath: string): ApplicationConfig {
        return this.config = yaml.safeLoad(fs.readFileSync(configPath, "utf8"));
    }

    public static async waitUntil(interval: number, condition: () => boolean): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                if (condition()) {
                    clearTimeout();
                    resolve();
                }
            }, interval);
        });
    }

    public static range(start, border): Array<number> {
        return Array.apply(0, Array(border))
            .map(function (element, index) {
                return index + start;
            });
    }

    public static getDutyHistory(): DutyHistory {
        let history: DutyHistory = JSON.parse(fs.readFileSync(BuildConfig.historyFile, "utf-8"));

        if (typeof history.version == "undefined")
            history.version = BuildConfig.version;

        if (typeof history.numStat == "undefined")
            history.numStat = new Map();

        if (typeof history.buildAt == "undefined")
            history.buildAt = new Date().toString();

        return history;
    }

    public static getWeek(time: number = Date.now()): number {
        if (this.weekStartTime == -1) {
            this.weekStartTime = Date.parse(this.config.week.startAt);
        }

        const span = time - this.weekStartTime;
        return Math.ceil(span / 1000 / 604800);
    }
}
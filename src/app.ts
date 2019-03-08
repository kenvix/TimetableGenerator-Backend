//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

import {ApplicationConfig, DutyHistory, UserClass, UserTimetable} from "./library/interfaces";
import * as path from "path";
import * as fs from "fs";
import {BuildConfig} from "./library/config";
import * as process from "process";
import "./library/Utils";
import Utils from "./library/utils";

(async () => {
    console.log("Timetable Generator Backend v1.0 by Kenvix");
    const currentDirectory = path.resolve(".");

    const configPath = path.join(__dirname, "config.yml");
    if (!fs.existsSync(configPath)) {
        console.error(configPath + " not exist!!");
        process.exit(2);
    }
    const config: ApplicationConfig = Utils.loadConfig(configPath);

    fs.readdir(currentDirectory, (async (fileReadErr, allFiles) => {
        if (fileReadErr)
            throw fileReadErr;

        const matchFileRegex = new RegExp(BuildConfig.userClassFileNameRule);
        const files = allFiles.filter(filename => matchFileRegex.test(filename));

        console.info("Loaded user jsons: " + files.length);

        if (!fs.existsSync(BuildConfig.historyFile))
            fs.writeFileSync(BuildConfig.historyFile, "{}");

        let users: Map<string, UserTimetable> = new Map();

        files.forEach(async userClassFile => {
            fs.readFile(path.resolve(currentDirectory, userClassFile), "utf-8", async (userReadErr, userFileString) => {
                if (userReadErr)
                    throw userReadErr;

                const userTimetable: UserTimetable = JSON.parse(userFileString);
                console.debug("Loaded: " + userClassFile + " -> " + userTimetable.id + ":" + userTimetable.name);
                users.set(userTimetable.id, userTimetable);
            });
        });

        await Utils.waitUntil(10, () => files.length == users.size);

        let history: DutyHistory = Utils.getDutyHistory();

        users.forEach(user => {
            if (!history.numStat.has(user.id))
                history.numStat.set(user.id, 0);
        });

        let week = 1;

        Utils.range(0, 7).forEach(async day => {
            Utils.range(0, 5).forEach(async time => {
                let minUser: UserTimetable|null = null;
                let minUserDutyCount = -1;

                users.forEach((user, userId) => {
                    const userClass: UserClass = user.classes[day][time];
                    if (typeof userClass == "undefined" || userClass == null || userClass.weekList.indexOf(week) == -1) {
                        const userDutyCount = <number>history.numStat!.get(userId);

                        if (minUserDutyCount == -1 || userDutyCount < minUserDutyCount) {
                            minUser = user;
                            minUserDutyCount = userDutyCount;
                        }
                    }
                });

                if (minUser == null)
                    throw new Error("There is no users available to generate!!!");


            });
        });

    }));
})();
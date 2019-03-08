//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

import {ApplicationConfig, UserClass, UserTimetable} from "./library/interfaces";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
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
    const config: ApplicationConfig = yaml.safeLoad(fs.readFileSync(configPath, "utf8"));

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


    }));
})();
//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

import {
    ApplicationConfig,
    DutyHistory, GeneratedWeekDuty,
    GeneratedWeekDutyTimetable,
    UserClass,
    UserTimetable
} from "./library/interfaces";
import * as path from "path";
import * as fs from "fs";
import {BuildConfig} from "./library/config";
import * as process from "process";
import Tools from "./library/tools";
import {MarkdownWriter} from "./library/writer";
import {InvalidFormatError, MinorInvalidFormatError} from "./library/errors";

(async () => {
    console.log("Timetable Generator Backend v1.0 by Kenvix");
    const currentDirectory = path.resolve(".");
    const appArguments = BuildConfig.programArugments.parse(process.argv);

    const configPath = path.join(__dirname, "config.yml");
    if (!fs.existsSync(configPath)) {
        console.error(configPath + " not exist!!");
        console.error("Copy it from dutylog directory.");
        process.exit(2);
    }
    const config: ApplicationConfig = Tools.loadConfig(configPath);
    const useCheckMode: boolean = appArguments.check != undefined && appArguments.check;

    if (useCheckMode)
        console.info("Working in Syntax Check mode");
    else
        console.info("Working in Generate mode");

    if (appArguments.strict)
        console.info("Strict mode enabled");

    const scanFromDirectory = path.resolve(config.generate.findJsonFrom);
    fs.readdir(scanFromDirectory, (async (fileReadErr, allFiles) => {
        try {
            if (fileReadErr)
                throw fileReadErr;

            const matchFileRegex = new RegExp(BuildConfig.userClassFileNameRule);
            const files = allFiles.filter(filename => matchFileRegex.test(filename));

            console.info(`Loading user jsons ${files.length} from ${scanFromDirectory}`);

            if (!fs.existsSync(BuildConfig.historyFile))
                fs.writeFileSync(BuildConfig.historyFile, "{}");

            let users: Map<string, UserTimetable> = new Map();

            for (const userClassFile of files) {
                fs.readFile(path.resolve(scanFromDirectory, userClassFile), "utf-8", async (userReadErr, userFileString) => {
                    if (userReadErr)
                        throw userReadErr;

                    if (userFileString.charCodeAt(0) == 0xFEFF) {
                        const errorPrompt = userClassFile + " is a illegal modified JSON. ILLEGAL BOM 0xFEFF DETECTED!!!!";

                        if (appArguments.strict) {
                            throw new MinorInvalidFormatError("errorPrompt");
                        } else {
                            console.warn(errorPrompt);
                            userFileString = userFileString.substring(1);
                        }
                    }
                    try {
                        const userTimetable: UserTimetable = JSON.parse(userFileString);
                        console.debug("Loaded: " + userClassFile + " -> " + userTimetable.id + ":" + userTimetable.name);

                        if (useCheckMode) {
                            const nameCheckExp = new RegExp("[^a-zA-Z0-9\u4e00-\u9fef]");
                            if (nameCheckExp.test(userTimetable.name)) {
                                throw new InvalidFormatError("Detected illegal characters on username: " + userTimetable.name, 111);
                            }

                            if (userClassFile != Tools.getUserClassFileName(userTimetable)) {
                                throw new InvalidFormatError("Username is NOT match file name rule: " + userTimetable.name, 112);
                            }
                        }

                        if (users.has(userTimetable.id)) {
                            throw new InvalidFormatError(`Fuck! User ID Already exists!! [${userTimetable.id} ${userTimetable.name}] CONFLICT [${users.get(userTimetable.id)!!.name}]`, 112);
                        }

                        users.set(userTimetable.id, userTimetable);
                    } catch(e) {
                        if (appArguments.strict && e instanceof MinorInvalidFormatError) {
                            console.error(userClassFile + " have minor errors.");
                            console.error(e.message);
                            process.exit(e.code == 0 ? 101 : e.code);
                        }

                        if (e instanceof InvalidFormatError) {
                            console.error(userClassFile + " have major errors.");
                            console.error(e.message);
                            process.exit(e.code == 0 ? 110 : e.code);
                        }

                        else {
                            console.error(userClassFile + " is illegal. SKIP!: " + e);
                        }
                    }
                });
            }

            await Tools.waitUntil(10, () => files != null && files.length == users.size);

            let generateResult: GeneratedWeekDuty[] = [];

            if (!useCheckMode) {
                if (users.size <= 0) {
                    console.error("No users to generate");
                    console.error(`Currently we scan from ${scanFromDirectory}, is it right?`);
                    process.exit(120);
                }

                let history: DutyHistory = Tools.getDutyHistory();

                users.forEach(user => {
                    if (!history.numStat.has(user.id))
                        history.numStat.set(user.id, 0);
                });

                let currentWeek = Tools.getWeek();

                Tools.range(currentWeek, config.generate.num >= config.week.end - currentWeek ? config.week.end : config.generate.num).forEach(week => {
                    let generatedSingleWeekDutyTimetable: GeneratedWeekDutyTimetable = [];

                    Tools.range(0, 7).forEach(async day => {
                        for (const time of Tools.range(0, 5)) {
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

                            if (minUser == null) {
                                console.info("There is no users available for Day " + day + " Time " + time);
                            } else {
                                if (typeof generatedSingleWeekDutyTimetable[day] == "undefined")
                                    generatedSingleWeekDutyTimetable[day] = [];

                                generatedSingleWeekDutyTimetable[day][time] = minUser!.id;
                                history.numStat!.set(minUser!.id, minUserDutyCount+1);
                            }
                        }
                    });

                    generateResult.push({week: week, timetable: generatedSingleWeekDutyTimetable});
                });
            }

            if (useCheckMode) {
                console.info("Check json operation completed");
                process.exit(0);
            } else {
                console.info("Writing Dutylog Result");
                if (!appArguments.noHistory) {

                }

                const writer = new MarkdownWriter(users);
                await writer.write(generateResult, "DutyLog.md");
                console.info("Write Operation completed. Saved to DutyLog.md");
                process.exit(0);
            }
        } catch (e) {
            console.error("Unable to open file: " + e);
            process.exit(100);
        }
    }));
})();
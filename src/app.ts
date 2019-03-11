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

(async () => {
    console.log("Timetable Generator Backend v1.0 by Kenvix");
    const currentDirectory = path.resolve(".");
    const appArguments = BuildConfig.programArugments.parse(process.argv);

    const configPath = path.join(__dirname, "config.yml");
    if (!fs.existsSync(configPath)) {
        console.error(configPath + " not exist!!");
        process.exit(2);
    }
    const config: ApplicationConfig = Tools.loadConfig(configPath);

    if (appArguments.check)
        console.info("Working mode: Check mode");

    if (appArguments.strict)
        console.info("Strict mode enabled");

    fs.readdir(currentDirectory, (async (fileReadErr, allFiles) => {
        try {
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

                    if (userFileString.charCodeAt(0) == 0xFEFF) {
                        const errorPrompt = userClassFile + " is a illegal modified JSON. ILLEGAL BOM 0xFEFF DETECTED!!!!";

                        if (appArguments.strict) {
                            console.error(errorPrompt);
                            process.exit(102);
                        } else {
                            console.warn(errorPrompt);
                            userFileString = userFileString.substring(1);
                        }
                    }
                    try {
                        const userTimetable: UserTimetable = JSON.parse(userFileString);
                        console.debug("Loaded: " + userClassFile + " -> " + userTimetable.id + ":" + userTimetable.name);

                        if (appArguments.check) {
                            const nameCheckExp = new RegExp("[^a-zA-Z0-9\u4e00-\u9fef]");
                            if (nameCheckExp.test(userTimetable.name)) {
                                console.error("Detected illegal characters on username: " + userTimetable.name);
                                process.exit(110);
                            }

                            if (userClassFile != Tools.getUserClassFileName(userTimetable)) {
                                console.error("Username is NOT match file name rule: " + userTimetable.name);
                                process.exit(111);
                            }
                        }

                        users.set(userTimetable.id, userTimetable);
                    } catch(e) {
                        if (appArguments.strict) {
                            console.error(userClassFile + " is invalid");
                            console.error(e);
                            process.exit(101);
                        } else {
                            console.error(userClassFile + " is illegal. SKIP!: " + e);
                        }
                    }
                });
            });

            await Tools.waitUntil(10, () => files.length == users.size);
            let generateResult: GeneratedWeekDuty[] = [];

            if (!appArguments.check) {
                let history: DutyHistory = Tools.getDutyHistory();

                users.forEach(user => {
                    if (!history.numStat.has(user.id))
                        history.numStat.set(user.id, 0);
                });

                let currentWeek = Tools.getWeek();

                Tools.range(currentWeek, config.generate.num >= config.week.end - currentWeek ? config.week.end : config.generate.num).forEach(week => {
                    let generatedSingleWeekDutyTimetable: GeneratedWeekDutyTimetable = [];

                    Tools.range(0, 7).forEach(async day => {
                        Tools.range(0, 5).forEach(async time => {
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
                        });
                    });

                    generateResult.push({week: week, timetable: generatedSingleWeekDutyTimetable});
                });
            }

            if (appArguments.check) {
                console.info("Check json operation completed");
                process.exit(0);
            } else {
                if (!appArguments.noHistory) {

                }

                const writer = new MarkdownWriter(users);
                await writer.write(generateResult, "DutyLog.md");
                console.info("Write Operation completed");
                process.exit(0);
            }
        } catch (e) {
            console.error("Unable to open file: " + e);
            process.exit(100);
        }
    }));
})();
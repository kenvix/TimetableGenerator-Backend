//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

import * as fs from "fs";
import * as path from "path";
import {GeneratedWeekDuty, UserTimetable} from "./interfaces";
import * as util from "util"

export abstract class AbstractWriter {
    protected readonly users: Map<string, UserTimetable>;

    protected constructor(users: Map<string, UserTimetable>) {
        this.users = users;
    }

    public abstract async generate(data: GeneratedWeekDuty[]);

    public async write(data: GeneratedWeekDuty[], savePath: string) {
        let generateResult = await this.generate(data);
        fs.writeFileSync(savePath, generateResult);
    }
}

export class MarkdownWriter extends AbstractWriter {
    private readonly timetableTemplate: string;
    private readonly itemTemplate: string;

    public constructor(users: Map<string, UserTimetable>) {
        super(users);
        console.log(path.resolve("."));
        this.timetableTemplate = fs.readFileSync("./template/timetable.md", "utf-8");
        this.itemTemplate = fs.readFileSync("./template/timetable-item.md", "utf-8");
    }

    public async generate(data: GeneratedWeekDuty[]) {
        let itemsString = "";

        data.forEach(item => {
            let userList: any = [this.itemTemplate, item.week];

            for (let time = 0; time < 5; time++) {
                for (let day = 0; day < 7; day++) {
                    if (typeof item.timetable[day] != "undefined" && typeof item.timetable[day][time] != "undefined" && item.timetable[day][time] != null) {
                        userList.push(<string>this.users.get(item.timetable[day][time])!.name);
                    } else {
                        userList.push("");
                    }
                }
            }

            itemsString += util.format.apply(util,userList);
        });

        return this.timetableTemplate.replace("{$DATA}", itemsString);
    }
}
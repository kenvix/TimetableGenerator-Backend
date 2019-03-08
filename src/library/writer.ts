//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

import * as fs from "fs";
import * as path from "path";
import {GeneratedWeekDuty} from "./interfaces";
import * as util from "util"

export abstract class AbstractWriter {

}

export class MarkdownWriter extends AbstractWriter {
    private readonly timetableTemplate: string;
    private readonly itemTemplate: string;

    public constructor() {
        super();
        console.log(path.resolve("."));
        this.timetableTemplate = fs.readFileSync("./template/timetable.md", "utf-8");
        this.itemTemplate = fs.readFileSync("./template/timetable-item.md", "utf-8");
    }



    public async write(data: GeneratedWeekDuty[], savePath: string = "DutyTimetable.md") {
        let itemsString = "";

        data.forEach(item => {

            item.timetable.forEach(user => {

            });

            itemsString += util.format(this.itemTemplate, item.week, )
        });
    }
}
//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

export interface UserTimetable {
    version: number,
    name: string,
    id: string,
    classes: Array<Array<UserClass>>
}

export interface UserClass {
    name: string,
    weekList: Array<number>
}

export interface DutyHistory {
    version: number,
    buildAt: string,
    numStat: Map<string, number>
}

export interface ApplicationConfig {
    week: {
        start: number,
        end: number,
        startAt: string
    }
}
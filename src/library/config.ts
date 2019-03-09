//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

import * as commander from "commander";

export class BuildConfig {
    public static readonly version = 1.0;
    public static readonly userClassFileNameRule = "(.*)-(.*)\.json";
    public static readonly historyFile = "history.json";
    public static readonly programArugments = commander.version(BuildConfig.version.toString())
        .option('-v, --verbose', 'Verbose logging mode')
        .option('--no-history', 'Do not write duty history')
        .option('-O, --overwrite-history', 'Force delete and overwrite history');
}
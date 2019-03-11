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
        .option('-c, --check', 'Check json only mode')
        .option('-s, --strict', 'Strict mode. No json\'s errors are acceptable')
        .option('-r, --repair', 'Allow to write back repaired file')
        .option('--no-history', 'Do not write duty history')
        .option('-O, --overwrite-history', 'Force delete and overwrite history');
}
//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

export default class Utils {

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
}
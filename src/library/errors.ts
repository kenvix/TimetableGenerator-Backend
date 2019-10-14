//--------------------------------------------------
// Written by Kenvix <i@kenvix.com>
//--------------------------------------------------

export abstract class CommonError extends Error {
    public readonly code: number;

    public constructor(props, code = 0) {
        super(props);
        super.name = this.constructor.name;
        this.code = code;
    }
}

export class ConfigError extends CommonError {}
export class AuthError extends CommonError {}
export class NetworkError extends CommonError {}
export class InvalidOperationError extends CommonError {}
export class InvalidFormatError extends CommonError {}
export class MinorInvalidFormatError extends InvalidFormatError {}
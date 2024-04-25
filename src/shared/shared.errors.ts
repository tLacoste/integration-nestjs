export abstract class TechnicalError extends Error {
    constructor(message) {
      super(message);
    }
}

export class MissingParameterError extends TechnicalError {
    constructor(parameter) {
        super(`Le paramètre '${parameter}' est manquant`);
        this.name = 'MissingParameterError';
    }
}
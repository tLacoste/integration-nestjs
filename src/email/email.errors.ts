export class InvalidEmailError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InvalidEmailError';
    }
}
export class InvalidUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserError';
  }
}
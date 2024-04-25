export abstract class UserError extends Error {
  constructor(message) {
    super(message);
  }
}

export class NotFoundUserError extends UserError {
  constructor(message) {
    super(message);
    this.name = 'NotFoundUserError';
  }
}

export class InactiveUserError extends UserError {
  constructor(message) {
    super(message);
    this.name = 'InactiveUserError';
  }
}

export const NotFoundUserMessage = "Aucun utilisateur n'a été trouvé";
export const InactiveUserMessage = "L'utilisateur est inactif";
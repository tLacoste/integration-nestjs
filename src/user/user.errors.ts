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

export const NotFoundUserMessage = "Aucun utilisateur n'a été trouvé";
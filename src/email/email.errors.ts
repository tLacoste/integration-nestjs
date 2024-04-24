export abstract class EmailError extends Error {
  constructor(message) {
    super(message);
  }
}

export class NotFoundEmailError extends EmailError {
  constructor(message) {
    super(message);
    this.name = 'NotFoundEmailError';
  }
}

export class InactiveEmailError extends EmailError {
  constructor(message) {
    super(message);
    this.name = 'InactiveEmailError';
  }
}

export const NotFoundEmailMessage = "Aucun email n'a été trouvé";
export const InactiveEmailMessage = "L'utilisateur associé à l'email est inactif";
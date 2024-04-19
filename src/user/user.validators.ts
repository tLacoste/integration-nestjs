import { Inject, Injectable } from '@nestjs/common';
import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';
import { UserService } from './user.service';

@ValidatorConstraint({ name: 'ActiveUser', async: true })
@Injectable()
export class ActiveUserConstraint implements ValidatorConstraintInterface {
    constructor(@Inject(UserService) private readonly _service: UserService) {}

    async validate(userId: string): Promise<boolean> {
        try {
            const user = await this._service.get(userId);
            return user.status === "active";
        } catch (e) {
            return false;
        }
    }

  defaultMessage(args: ValidationArguments) {
    return `L'identifiant d'utilisateur doit correspondre à un utilisateur actif`;
  }
}

export function IsActiveUser(
  validationOptions?: ValidationOptions
) {
  return function (object: Record<string, any>, propertyName: string): void {
      registerDecorator({
          target: object.constructor,
          propertyName: propertyName,
          options: validationOptions,
          validator: ActiveUserConstraint,
      });
  };
}
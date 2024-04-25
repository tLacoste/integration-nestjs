import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { UserService } from '../user/user.service';
import { User } from '../user/user.types';
import { EmailId } from './email.interfaces';
import { EmailService } from './email.service';
import { AddEmail, EmailFiltersArgs, EmailIdArgs, UserEmail } from './email.types';
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundUserError, UserError } from '../user/user.errors';
import { EmailError, InactiveEmailError } from './email.errors';
import { AssertionError } from 'assert';
import { MissingParameterError, TechnicalError } from '../shared/shared.errors';

@Resolver(() => UserEmail)
export class EmailResolver {

  constructor(
    private readonly _emailService: EmailService,
    private readonly _userService: UserService
  ) {}

  @Query(() => UserEmail, { name: 'email' })
  getEmail(@Args() { emailId } : EmailIdArgs): Promise<UserEmail> {
    return this._emailService.get(emailId);
  }

  @Query(() => [UserEmail], { name: 'emailsList' })
  getEmails(@Args() filters: EmailFiltersArgs): Promise<UserEmail[]> {
    return this._emailService.getEmails(filters);
  }

  @ResolveField(() => User, { name: 'user' })
  getUser(@Parent() userEmail: UserEmail): Promise<User> {
    return this._userService.get(userEmail.userId);
  }

  @Mutation(() => ID)
  async addEmail(@Args() email: AddEmail): Promise<EmailId> {
    try{
      return await this._emailService.add(email);
    }catch(error){
      if(error instanceof TechnicalError){
        // Masquage volontaire des informations de l'erreur, qui devrait être fait par un filtre
        throw new BadRequestException("Une erreur est survenue");
      }
      if(error instanceof EmailError || error instanceof UserError){
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
  }

  @Mutation(() => ID)
  async deleteEmail(@Args() { emailId }: EmailIdArgs): Promise<EmailId> {
    try{
      return await this._emailService.delete(emailId);
    }catch(error){
      if(error instanceof EmailError || error instanceof UserError){
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
  }
}

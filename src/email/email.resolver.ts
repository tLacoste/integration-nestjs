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
import { NotFoundException } from '@nestjs/common';
import { InvalidEmailError, InvalidUserError } from './email.errors';

@Resolver(() => UserEmail)
export class EmailResolver {

  constructor(
    private readonly _service: EmailService,
    private readonly _userService: UserService
  ) {}

  @Query(() => UserEmail, { name: 'email' })
  async getEmail(@Args() { emailId } : EmailIdArgs) {
    return this._service.get(emailId);
  }

  @Query(() => [UserEmail], { name: 'emailsList' })
  async getEmails(@Args() filters: EmailFiltersArgs): Promise<UserEmail[]> {
    return this._service.getEmails(filters);
  }

  @ResolveField(() => User, { name: 'user' })
  async getUser(@Parent() user: UserEmail): Promise<User> {
    return this._userService.get(user.userId);
  }

  @Mutation(() => ID)
  async addEmail(@Args() email: AddEmail): Promise<EmailId> {
    try{
      return await this._service.add(email);
    }catch(error){
      if(error instanceof InvalidUserError){
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Mutation(() => ID)
  async deleteEmail(@Args() { emailId }: EmailIdArgs): Promise<EmailId> {
    try{
      return await this._service.delete(emailId);
    }catch(error){
      if(error instanceof InvalidEmailError){
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}

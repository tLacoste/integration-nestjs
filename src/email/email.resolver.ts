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
    return this._service.add(email);
  }
}

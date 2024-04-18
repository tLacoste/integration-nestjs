import {
  Args,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { UserService } from '../user/user.service';
import { User } from '../user/user.types';
import { EmailService } from './email.service';
import { EmailFiltersArgs, EmailIdArgs, UserEmail } from './email.types';

@Resolver(() => UserEmail)
export class EmailResolver {

  constructor(
    private readonly _service: EmailService,
    private readonly _userService: UserService
  ) {}

  @Query(() => UserEmail, { name: 'email' })
  getEmail(@Args() { emailId } : EmailIdArgs) {
    return this._service.get(emailId);
  }

  @Query(() => [UserEmail], { name: 'emailsList' })
  async getEmails(@Args() filters: EmailFiltersArgs): Promise<UserEmail[]> {
    // TODO REFACTORISATION
    // Je pense qu'on pourrait essayer de refactoriser pour réutiliser
    // la même chose que dans UserResolver pour récupérer les emails
    return this._service.getEmails(filters);
  }

  @ResolveField(() => User, { name: 'user' })
  async getUser(@Parent() parent: UserEmail): Promise<User> {
    return this._userService.get(parent.userId);
  }
}

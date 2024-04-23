import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, In, Repository } from 'typeorm';
import { EmailFiltersArgs, UserEmail } from '../email/email.types';
import { EmailEntity } from '../email/email.entity';
import { UserId } from './user.interfaces';
import { UserService } from './user.service';
import { AddUser, User, UserIdArgs } from './user.types';
import { EmailService } from '../email/email.service';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly _userService: UserService,
    private readonly _emailService: EmailService
  ) {}

  @Query(() => User, { name: 'user', nullable: true })
  async getUser(@Args() { userId }: UserIdArgs): Promise<User> {
    return this._userService.get(userId);
  }

  @Mutation(() => ID)
  async addUser(@Args() user: AddUser): Promise<UserId> {
    return this._userService.add(user);
  }

  @Mutation(() => ID)
  async deactivateUser(@Args() { userId }: UserIdArgs): Promise<UserId> {
    return this._userService.deactivate(userId);
  }

  @ResolveField(() => [UserEmail], { name: 'emails' })
  async getEmails(
    @Parent() user: User,
    @Args() filters: EmailFiltersArgs,
  ): Promise<UserEmail[]> {
    return this._emailService.getEmails(filters, { equal: user.id });
  }
}

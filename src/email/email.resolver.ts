import { NotImplementedException } from '@nestjs/common';
import { Mutation } from '@nestjs/graphql';
import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { EmailFiltersArgs, UserEmail } from './email.types';
import { User } from '../user/user.types';

@Resolver(() => UserEmail)
export class EmailResolver {
  @Query(() => UserEmail, { name: 'email' })
  getEmail(@Args({ name: 'emailId', type: () => ID }) emailId: string) {
    // TODO IMPLEMENTATION
    // Récupérer une adresse email par rapport à son identifiant
    throw new NotImplementedException();
  }

  @Query(() => [UserEmail], { name: 'emailsList' })
  async getEmails(@Args() filters: EmailFiltersArgs): Promise<UserEmail[]> {
    // TODO IMPLEMENTATION
    // Récupérer une liste d'e-mails correspondants à des filtres

    // Je pense qu'on pourrait essayer de refactoriser pour réutiliser
    // la même chose que dans UserResolver pour récupérer les emails
    throw new NotImplementedException();
  }

  @ResolveField(() => User, { name: 'user' })
  async getUser(@Parent() parent: UserEmail): Promise<User> {
    // TODO IMPLEMENTATION
    // Récupérer l'utilisateur à qui appartient l'email
    throw new NotImplementedException();
  }
}

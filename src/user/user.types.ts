import { ArgsType, Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxDate,
  MaxLength,
} from 'class-validator';
import { Maybe } from 'graphql/jsutils/Maybe';
import { IUser, IAddUser } from './user.interfaces';

/**
 * Type de sortie GraphQL d'un utilisateur pour les récupérations
 */
@ObjectType()
export class User implements IUser {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Date, { nullable: true })
  birthdate?: Maybe<Date>;
}

/**
 * Type d'entrée GraphQL d'un utilisateur à ajouter
 */
@InputType()
@ArgsType()
export class AddUser implements IAddUser {
  @MaxLength(50)
  @Field(() => String)
  name: string;

  @IsOptional()
  @Field(() => Date, { nullable: true })
  birthdate?: Date;
}

/**
 * Type Argument GraphQL pour les queries / mutations ayant uniquement
 * besoin d'un identifiant utilisateur
 */
@ArgsType()
export class UserIdArgs {
  @IsUUID('all', {
    message: `L'identifiant de l'utilisateur doit être un UUID`,
  })
  @IsNotEmpty({ message: `L'identifiant de l'utilisateur doit être défini` })
  @Field(() => String)
  userId: string;
}

import { ArgsType, Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Maybe } from 'graphql/jsutils/Maybe';
import { IEmail, IEmailFilters } from './email.interfaces';

@ObjectType()
export class UserEmail implements IEmail {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  address: string;

  @Field(() => ID)
  userId: string;
}

@InputType()
export class StringFilters {
  @IsOptional()
  @Field(() => String, { nullable: true })
  equal: Maybe<string>;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  in: Maybe<string[]>;
}

@ArgsType()
export class EmailFiltersArgs implements IEmailFilters {
  @IsOptional()
  @Field(() => StringFilters, { nullable: true })
  address?: Maybe<StringFilters>;
}

/**
 * Type Argument GraphQL pour les queries / mutations ayant uniquement
 * besoin d'un identifiant email
 */
@ArgsType()
export class EmailIdArgs {
  @IsUUID('all', {
    message: `L'identifiant de l'email doit être un UUID`,
  })
  @IsNotEmpty({ message: `L'identifiant de l'email doit être défini` })
  @Field(() => String)
  emailId: string;
}
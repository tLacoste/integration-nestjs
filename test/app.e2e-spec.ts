import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { UserEntity } from '../src/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailEntity } from '../src/email/email.entity';
import { UserStatus } from '../src/user/user.interfaces';
import { email1, email2, email3, knownInactiveUserRaw, knownInactiveUserId, knownUserRaw, knownUserId } from './spec-data';
import { InactiveUserMessage } from '../src/user/user.errors';

describe('Tests e2e', () => {
  let app: INestApplication;

  let userRepo: Repository<UserEntity>;
  let emailRepo: Repository<EmailEntity>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    userRepo = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    emailRepo = moduleFixture.get<Repository<EmailEntity>>(
      getRepositoryToken(EmailEntity),
    );

    const { emails, ...user } = knownUserRaw;
    await userRepo.insert(user);
    await emailRepo.insert(emails);
    
    const { emails: inactiveEmails, ...inactiveUser } = knownInactiveUserRaw;
    await userRepo.insert(inactiveUser);
    await emailRepo.insert(inactiveEmails);

    await app.init();
  });

  afterEach(async () => {
    await emailRepo.query(`DELETE FROM emails`);
    await userRepo.query(`DELETE FROM users`);
  });

  describe('UserResolver', () => {
    describe('[Query] user', () => {
      it(`[01] Devrait retourner l'utilisateur connu en base de données`, () => {
        const user = {
          id: knownUserId,
          name: knownUserRaw.name,
          birthdate: knownUserRaw.birthdate,
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUserId}"){id name birthdate}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data ? res.body.data.user : null).toStrictEqual(user);
          });
      });

      it(`[02] Devrait pouvoir résoudre les e-mails de l'utilisateur`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUserId}"){id emails{id address}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors && res.body.errors[0] ? res.body.errors[0].message : null).not.toBe(
              'Cannot return null for non-nullable field UserEmail.id.',
            );
            expect(res.body.data && res.body.data.user && res.body.data.user.emails ? res.body.data.user.emails.length : null).toBe(3);
          });
      });

      it(`[03] Devrait pouvoir résoudre les e-mails avec les filtres`, () => {
        const { userId, ...email } = email1;
        const knownUser = {
          id: knownUserId,
          emails: [email],
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUser.id}"){id emails(address:{equal: "${email.address}"}){id address}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data ? res.body.data.user : null).toStrictEqual(knownUser);
          });
      });

      it(`[04] Devrait retourner une erreur de validation si aucun identifiant d'utilisateur n'est défini`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:""){id}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("L'identifiant de l'utilisateur doit être défini");
          });
      });

      it(`[05] Devrait retourner une erreur de validation si l'identifiant de l'utilisateur n'est pas un UUID`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"NotAnUUID"){id}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("L'identifiant de l'utilisateur doit être un UUID");
          });
      });

      it(`[06] Devrait retourner les emails égaux tout comme les emails contenus`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUserId}"){
              emails(address: {
                equal: "${email2.address}", 
                in: ["${email1.address}", "${email3.address}"]
              }){id}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data && res.body.data.user && res.body.data.user.emails ? res.body.data.user.emails.length : null).toBe(3);
          });
      });
    });

    describe('[Mutation] addUser', () => {
      it(`[07] Devrait ajouter un utilisateur`, () => {
        const date = new Date(2001, 11, 12).toISOString();

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addUser(name:"User Name", birthdate: "${date}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data ? res.body.data.addUser : null).toBeDefined();
          });
      });

      it(`[08] Devrait retourner une erreur de validation si le nom n'est pas défini`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addUser(name:"")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("Le nom de l'utilisateur n'est pas défini");
          });
      });

      it(`[09] Devrait retourner une erreur de validation si la date de naissance est définie dans le future`, () => {
        const date = new Date(2050, 1, 1).toISOString();
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addUser(name:"User Name" birthdate:"${date}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain(
              'La date de naissance ne peut pas être définie dans le future',
            );
          });
      });
    });
  });

  describe('EmailResolver', () => {
    describe('[Query] email', () => {
      it(`[10] Devrait retourner l'email connu en base de données`, () => {
        const { userId, ...email } = email3;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{email(emailId:"${email.id}"){id address}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors && res.body.errors[0] ? res.body.errors[0].message : null).not.toBe('Not Implemented');
            expect(res.body.data?.email).toStrictEqual(email);
          });
      });
    });

    describe('[Query] emailsList', () => {
      it(`[11] Devrait retourner les emails correspondants aux filtres`, () => {
        const { userId, ...email } = email2;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{emailsList(address: {equal: "${email.address}"}){id address}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors && res.body.errors[0] ? res.body.errors[0].message : null).not.toBe('Not Implemented');
            expect(res.body.data?.emailsList?.[0]).toStrictEqual(email);
          });
      });
    });

    describe('[FieldResolver] user', () => {
      it(`[12] Devrait retourner l'utilisateur de l'email`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{emailsList(address:{equal:"${email1.address}"}){user{id}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors && res.body.errors[0] ? res.body.errors[0].message : null).not.toBe('Not Implemented');
            expect(res.body.data && res.body.data.emailsList && res.body.data.emailsList[0] && res.body.data.emailsList[0].user ? res.body.data.emailsList[0].user.id : null).toBe(knownUserId);
          });
      });
    });

    describe('[Mutation] addEmail', () => {
      it(`Devrait ajouter un email`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addEmail(address: "active@test.fr", userId: "${knownUserId}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data ? res.body.data.addEmail : null).toBeDefined();
          });
      });

      it(`Devrait retourner une erreur de validation si l'adresse email n'est pas définie`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addEmail(address: "", userId: "${knownUserId}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("L'adresse email n'est pas définie");
          });
      });

      it(`Devrait retourner une erreur de validation si l'adresse email n'est pas valide`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addEmail(address: "", userId: "${knownUserId}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("L'adresse email est invalide");
          });
      });

      it(`Devrait retourner une erreur de validation si l'identifiant d'utilisateur n'est pas défini`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addEmail(address: "active2@test.fr", userId: "")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("L'identifiant d'utilisateur doit être défini");
          });
      });

      it(`Devrait retourner une erreur de validation si l'utilisateur associé à l'identifiant est inactif`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addEmail(address: "inactive@test.fr", userId: "${knownInactiveUserId}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain(InactiveUserMessage);
          });
      });
    });

    describe('[Mutation] deleteEmail', () => {
      it(`Devrait supprimer un email`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {deleteEmail(emailId: "${email1.id}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data ? res.body.data.deleteEmail : null).toBeDefined();
          });
      });

      it(`Devrait retourner une erreur de validation si l'identifiant d'email n'est pas défini`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {deleteEmail(emailId: "")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("L'identifiant de l'email doit être défini");
          });
      });

      it(`Devrait retourner une erreur de validation si l'identifiant d'email n'est pas un UUID`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {deleteEmail(emailId: "NotAnUUID")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain("L'identifiant de l'email doit être un UUID");
          });
      });

      it(`Devrait retourner une erreur de validation si l'utilisateur associé à l'email est inactif`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {deleteEmail(emailId: "${knownInactiveUserRaw.emails[0].id}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors && res.body.errors[0] && res.body.errors[0].extensions && res.body.errors[0].extensions.originalError ? res.body.errors[0].extensions.originalError.message : null,
            ).toContain(InactiveUserMessage);
          });
      });
    });
  });
});

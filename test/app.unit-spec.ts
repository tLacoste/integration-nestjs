import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { EmailEntity } from '../src/email/email.entity';
import { InactiveEmailError, InactiveEmailMessage, NotFoundEmailError, NotFoundEmailMessage } from '../src/email/email.errors';
import { EmailService } from '../src/email/email.service';
import { UserEntity } from '../src/user/user.entity';
import { email2, inexistentUUID, knownInactiveUserId, knownInactiveUserRaw, knownUserId, knownUserRaw } from './spec-data';
import { UserService } from '../src/user/user.service';
import { IUser } from '../src/user/user.interfaces';
import { NotFoundUserError, NotFoundUserMessage } from '../src/user/user.errors';

const getError = async (call: () => unknown): Promise<Error> => {
    try {
        await call();
    
        return null;
    } catch (error) {
        if(error instanceof Error){
            return error;
        }
        throw new Error("Erreur non gérée");
    }
};

describe('EmailService', () => { 
    let app: INestApplication;

    let emailService: EmailService; 

    let userRepo: Repository<UserEntity>;
    let emailRepo: Repository<EmailEntity>;
    beforeEach(async () => { 
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();
    
        app = moduleFixture.createNestApplication();

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

        emailService = moduleFixture.get<EmailService>(EmailService);  
    }); 

    afterEach(async () => {
      await emailRepo.query(`DELETE FROM emails`);
      await userRepo.query(`DELETE FROM users`);
    });


    it('should be defined', () => { 
        expect(emailService).toBeDefined(); 
    });

    describe('get', () => { 
        it(`Devrait retourner l'email connu en base de données`, async () => { 
            expect(await emailService.get(knownUserRaw.emails[0].id))
            .toEqual(knownUserRaw.emails[0]); 
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await emailService.get(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await emailService.get("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
        it(`Devrait retourner null si l'identifiant est inexitant`, async () => { 
            expect(await emailService.get(inexistentUUID)).toBeNull();
        });
    });

    describe('getOrThrow', () => { 
        it(`Devrait retourner l'email connu en base de données`, async () => { 
            expect(await emailService.getOrThrow(knownUserRaw.emails[0].id))
            .toEqual(knownUserRaw.emails[0]); 
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await emailService.getOrThrow(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await emailService.getOrThrow("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            const error = await getError(async () => await emailService.getOrThrow(inexistentUUID));
            expect(error).toBeInstanceOf(NotFoundEmailError);
            expect(error.message).toBe(NotFoundEmailMessage);
        });
    });

    describe('getEmails', () => { 
        it(`Devrait retourner les emails correspondants au filtre 'equal'`, async () => { 
            const { userId, ...email } = email2;
            let emails = await emailService.getEmails({address: {equal: email.address, in: []}});
            expect(emails).toHaveLength(1);
            expect(emails[0]).toEqual(email2); 
        });
        it(`Devrait retourner les emails correspondants au filtre 'in'`, async () => { 
            let emails = await emailService.getEmails({address: {equal: "", in: knownUserRaw.emails.map(email => email.address)}});
            expect(emails).toHaveLength(knownUserRaw.emails.length);
            knownUserRaw.emails.forEach((email, index) => {
                expect(emails[index]).toEqual(email); 
            });
        });
        it(`Devrait retourner les emails correspondants aux filtres 'equal' et 'in'`, async () => { 
            let emails = await emailService.getEmails({address: {equal: knownInactiveUserRaw.emails[0].address, in: knownUserRaw.emails.map(email => email.address)}});
            expect(emails).toHaveLength(knownUserRaw.emails.length + 1);
            expect(emails).toContainEqual(knownInactiveUserRaw.emails[0]);  
            knownUserRaw.emails.forEach((email, index) => {
                expect(emails).toContainEqual(email); 
            });
        });
        it(`Devrait retourner tous les emails`, async () => { 
            let emails = await emailService.getEmails({address: {equal: "", in: []}});
            expect(emails).toHaveLength(knownInactiveUserRaw.emails.length + knownUserRaw.emails.length);
        });
    });

    describe('delete', () => { 
        it(`Devrait supprimer l'email connu en base de données`, async () => { 
            expect(await emailService.delete(knownUserRaw.emails[0].id))
            .toEqual(knownUserRaw.emails[0].id); 
        });
        it(`Devrait retourner une erreur si l'utilisateur associé est inactif`, async () => { 
            const error = await getError(async () => await emailService.delete(knownInactiveUserRaw.emails[0].id));
            expect(error).toBeInstanceOf(InactiveEmailError);
            expect(error.message).toBe(InactiveEmailMessage);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await emailService.delete(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await emailService.delete("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            const error = await getError(async () => await emailService.delete(inexistentUUID));
            expect(error).toBeInstanceOf(NotFoundEmailError);
            expect(error.message).toBe(NotFoundEmailMessage);
        });
    });
});

describe('UserService', () => { 
    let app: INestApplication;

    let userService: UserService; 

    let userRepo: Repository<UserEntity>;
    let emailRepo: Repository<EmailEntity>;
    beforeEach(async () => { 
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();
    
        app = moduleFixture.createNestApplication();

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

        userService = moduleFixture.get<UserService>(UserService);  
    }); 

    afterEach(async () => {
      await emailRepo.query(`DELETE FROM emails`);
      await userRepo.query(`DELETE FROM users`);
    });


    it('should be defined', () => { 
        expect(userService).toBeDefined(); 
    });

    describe('get', () => { 
        it(`Devrait retourner l'utilisateur connu en base de données`, async () => { 
            const { emails, ...user } = knownUserRaw;
            const knownUser: Omit<IUser, 'emails'> = {
              ...user,
              birthdate: knownUserRaw.birthdate
                ? new Date(knownUserRaw.birthdate)
                : null
            };
            expect(await userService.get(knownUserId))
            .toEqual(knownUser); 
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await userService.get(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await userService.get("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
        it(`Devrait retourner null si l'identifiant est inexitant`, async () => { 
            expect(await userService.get(inexistentUUID)).toBeNull();
        });
    });

    describe('getOrThrow', () => { 
        it(`Devrait retourner l'utilisateur connu en base de données`, async () => { 
            const { emails, ...user } = knownUserRaw;
            const knownUser: Omit<IUser, 'emails'> = {
              ...user,
              birthdate: knownUserRaw.birthdate
                ? new Date(knownUserRaw.birthdate)
                : null
            };
            expect(await userService.getOrThrow(knownUserId))
            .toEqual(knownUser); 
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await userService.getOrThrow(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await userService.getOrThrow("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            const error = await getError(async () => await userService.getOrThrow(inexistentUUID));
            expect(error).toBeInstanceOf(NotFoundUserError);
            expect(error.message).toBe(NotFoundUserMessage);
        });
    });
    describe('isActive', () => { 
        it(`Devrait retourner 'true' si l'utilisateur est actif`, async () => { 
            expect(await userService.isActive(knownUserId))
            .toStrictEqual(true); 
        });
        it(`Devrait retourner 'false' si l'utilisateur est inactif`, async () => { 
            expect(await userService.isActive(knownInactiveUserId))
            .toStrictEqual(false); 
        });
        it(`Devrait retourner 'false' si l'identifiant est inexitant`, async () => { 
            expect(await userService.isActive(inexistentUUID))
            .toStrictEqual(false); 
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await userService.isActive(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await userService.isActive("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
    });
});

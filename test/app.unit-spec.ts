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
import { InactiveUserError, InactiveUserMessage, NotFoundUserError, NotFoundUserMessage } from '../src/user/user.errors';
import { createMock } from '@golevelup/ts-jest';
import { IEmail } from '../src/email/email.interfaces';
import { plainToInstance } from 'class-transformer';

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



const emailRepositoryMock = createMock<Repository<EmailEntity>>();
const userRepositoryMock = createMock<Repository<UserEntity>>();
const userServiceMock = createMock<UserService>();

describe('EmailService', () => { 
    let app: INestApplication;

    let emailService: EmailService; 

    beforeEach(async () => { 
        const moduleFixture: TestingModule = await Test.createTestingModule({
          providers: [
            EmailService,
            {
              provide: UserService,
              useValue: userServiceMock,
            },
            {
              provide: getRepositoryToken(EmailEntity),
              useValue: emailRepositoryMock,
            },
          ],
        }).compile();
    
        app = moduleFixture.createNestApplication();

        await app.init();
    
        emailService = moduleFixture.get<EmailService>(EmailService);
    }); 

    afterEach(async () => {
        jest.clearAllMocks();
    });


    it('should be defined', () => { 
        expect(emailService).toBeDefined(); 
    });

    describe('get', () => { 
        it(`Devrait retourner l'email connu en base de données`, async () => { 
            const findOneBySpy = jest.spyOn(emailRepositoryMock, 'findOneBy').mockResolvedValueOnce(knownUserRaw.emails[0]);
            
            expect(await emailService.get(knownUserRaw.emails[0].id)).toEqual(knownUserRaw.emails[0]); 
            
            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const findOneBySpy = jest.spyOn(emailRepositoryMock, 'findOneBy').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: ""`)));
            
            const error = await getError(async () => await emailService.get(""));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const findOneBySpy = jest.spyOn(emailRepositoryMock, 'findOneBy').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: "NotAnUUID"`)));
            
            const error = await getError(async () => await emailService.get("NotAnUUID"));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner null si l'identifiant est inexitant`, async () => { 
            const findOneBySpy = jest.spyOn(emailRepositoryMock, 'findOneBy').mockResolvedValueOnce(null);
            
            expect(await emailService.get(inexistentUUID)).toBeNull();
            
            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getOrThrow', () => { 
        it(`Devrait retourner l'email connu en base de données`, async () => { 
            const getSpy = jest.spyOn(emailService, 'get').mockResolvedValueOnce(knownUserRaw.emails[0]);
            
            expect(await emailService.getOrThrow(knownUserRaw.emails[0].id)).toEqual(knownUserRaw.emails[0]); 
            
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const getSpy = jest.spyOn(emailService, 'get').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: ""`)));
            
            const error = await getError(async () => await emailService.getOrThrow(""));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const getSpy = jest.spyOn(emailService, 'get').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: "NotAnUUID"`)));
            
            const error = await getError(async () => await emailService.getOrThrow("NotAnUUID"));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            const getSpy = jest.spyOn(emailService, 'get').mockResolvedValueOnce(null);
            
            const error = await getError(async () => await emailService.getOrThrow(inexistentUUID));
            
            expect(error).toBeInstanceOf(NotFoundEmailError);
            expect(error.message).toBe(NotFoundEmailMessage);
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEmails', () => { 
        it(`Devrait retourner les emails correspondants au filtre 'equal'`, async () => { 
            const { userId, ...email } = email2;
            const findSpy = jest.spyOn(emailRepositoryMock, 'find').mockResolvedValueOnce([email2]);
            
            let emails = await emailService.getEmails({address: {equal: email.address, in: []}});
            
            expect(emails).toHaveLength(1);
            expect(emails[0]).toEqual(email2); 
            expect(findSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner les emails correspondants au filtre 'in'`, async () => { 
            const findSpy = jest.spyOn(emailRepositoryMock, 'find').mockResolvedValueOnce(knownUserRaw.emails);
            
            let emails = await emailService.getEmails({address: {equal: "", in: knownUserRaw.emails.map(email => email.address)}});
            
            expect(emails).toHaveLength(knownUserRaw.emails.length);
            knownUserRaw.emails.forEach((email, index) => {
                expect(emails[index]).toEqual(email); 
            });
            expect(findSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner les emails correspondants aux filtres 'equal' et 'in'`, async () => { 
            const findSpy = jest.spyOn(emailRepositoryMock, 'find').mockResolvedValueOnce([...knownUserRaw.emails, knownInactiveUserRaw.emails[0]]);
            
            let emails = await emailService.getEmails({address: {equal: knownInactiveUserRaw.emails[0].address, in: knownUserRaw.emails.map(email => email.address)}});
            
            expect(emails).toHaveLength(knownUserRaw.emails.length + 1);
            expect(emails).toContainEqual(knownInactiveUserRaw.emails[0]);  
            knownUserRaw.emails.forEach((email, index) => {
                expect(emails).toContainEqual(email); 
            });
            expect(findSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner tous les emails`, async () => { 
            const findSpy = jest.spyOn(emailRepositoryMock, 'find').mockResolvedValueOnce([...knownUserRaw.emails, ...knownInactiveUserRaw.emails]);
            
            let emails = await emailService.getEmails({address: {equal: "", in: []}});
            
            expect(emails).toHaveLength(knownInactiveUserRaw.emails.length + knownUserRaw.emails.length);
            expect(findSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('delete', () => { 

        it(`Devrait supprimer l'email connu en base de données`, async () => { 
            var email = plainToInstance(EmailEntity, knownUserRaw.emails[0], {enableImplicitConversion: true});

            const getOrThrowEmailSpy = jest.spyOn(emailService, 'getOrThrow').mockResolvedValueOnce(email);
            const isActiveUserSpy = jest.spyOn(userServiceMock, 'isActive').mockResolvedValueOnce(true);
            const deleteEmailSpy = jest.spyOn(emailRepositoryMock, 'delete').mockResolvedValueOnce({raw: [], affected: 1});

            expect(await emailService.delete(email.id)).toEqual(email.id); 
            
            expect(getOrThrowEmailSpy).toHaveBeenCalledTimes(1);
            expect(isActiveUserSpy).toHaveBeenCalledTimes(1);
            expect(deleteEmailSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'utilisateur associé est inactif`, async () => { 
            var email = plainToInstance(EmailEntity, knownInactiveUserRaw.emails[0], {enableImplicitConversion: true});
            const getOrThrowEmailSpy = jest.spyOn(emailService, 'getOrThrow').mockResolvedValueOnce(knownInactiveUserRaw.emails[0]);
            const isActiveUserSpy = jest.spyOn(userServiceMock, 'isActive').mockResolvedValueOnce(false);
            const deleteEmailSpy = jest.spyOn(emailRepositoryMock, 'delete');

            const error = await getError(async () => await emailService.delete(email.id));

            expect(error).toBeInstanceOf(InactiveEmailError);
            expect(error.message).toBe(InactiveEmailMessage);
            expect(getOrThrowEmailSpy).toHaveBeenCalledTimes(1);
            expect(isActiveUserSpy).toHaveBeenCalledTimes(1);
            expect(deleteEmailSpy).toHaveBeenCalledTimes(0);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const getOrThrowEmailSpy = jest.spyOn(emailService, 'getOrThrow').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: ""`)));
            const isActiveUserSpy = jest.spyOn(userServiceMock, 'isActive');
            const deleteEmailSpy = jest.spyOn(emailRepositoryMock, 'delete');

            const error = await getError(async () => await emailService.delete(""));

            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
            expect(getOrThrowEmailSpy).toHaveBeenCalledTimes(1);
            expect(isActiveUserSpy).toHaveBeenCalledTimes(0);
            expect(deleteEmailSpy).toHaveBeenCalledTimes(0);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const getOrThrowEmailSpy = jest.spyOn(emailService, 'getOrThrow').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: "NotAnUUID"`)));
            const isActiveUserSpy = jest.spyOn(userServiceMock, 'isActive');
            const deleteEmailSpy = jest.spyOn(emailRepositoryMock, 'delete');

            const error = await getError(async () => await emailService.delete("NotAnUUID"));

            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
            expect(getOrThrowEmailSpy).toHaveBeenCalledTimes(1);
            expect(isActiveUserSpy).toHaveBeenCalledTimes(0);
            expect(deleteEmailSpy).toHaveBeenCalledTimes(0);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            const getOrThrowEmailSpy = jest.spyOn(emailService, 'getOrThrow').mockRejectedValueOnce(new NotFoundEmailError(NotFoundEmailMessage));
            const isActiveUserSpy = jest.spyOn(userServiceMock, 'isActive');
            const deleteEmailSpy = jest.spyOn(emailRepositoryMock, 'delete');

            const error = await getError(async () => await emailService.delete(inexistentUUID));

            expect(error).toBeInstanceOf(NotFoundEmailError);
            expect(error.message).toBe(NotFoundEmailMessage);
            expect(getOrThrowEmailSpy).toHaveBeenCalledTimes(1);
            expect(isActiveUserSpy).toHaveBeenCalledTimes(0);
            expect(deleteEmailSpy).toHaveBeenCalledTimes(0);
        });
    });
});

describe('UserService', () => { 
    let app: INestApplication;

    let userService: UserService; 

    beforeEach(async () => { 
        const moduleFixture: TestingModule = await Test.createTestingModule({
          providers: [
            UserService,
            {
              provide: EmailService,
              useValue: userServiceMock,
            },
            {
              provide: getRepositoryToken(UserEntity),
              useValue: userRepositoryMock,
            },
          ],
        }).compile();
    
        app = moduleFixture.createNestApplication();

        await app.init();

    
        userService = moduleFixture.get<UserService>(UserService);
    }); 

    afterEach(async () => {
        jest.clearAllMocks();
    });


    it('should be defined', () => { 
        expect(userService).toBeDefined(); 
    });

    describe('get', () => { 
        it(`Devrait retourner l'utilisateur connu en base de données`, async () => {
            var knownUser = plainToInstance(UserEntity, knownUserRaw, {enableImplicitConversion: true});
            const findOneBySpy = jest.spyOn(userRepositoryMock, 'findOneBy').mockResolvedValueOnce(knownUser);

            expect(await userService.get(knownUserId)).toEqual(knownUser); 

            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const findOneBySpy = jest.spyOn(userRepositoryMock, 'findOneBy').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: ""`)));
            
            const error = await getError(async () => await userService.get(""));

            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const findOneBySpy = jest.spyOn(userRepositoryMock, 'findOneBy').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: "NotAnUUID"`)));
            
            const error = await getError(async () => await userService.get("NotAnUUID"));

            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner null si l'identifiant est inexitant`, async () => { 
            const findOneBySpy = jest.spyOn(userRepositoryMock, 'findOneBy').mockResolvedValueOnce(null);
            
            expect(await userService.get(inexistentUUID)).toBeNull();
            
            expect(findOneBySpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getOrThrow', () => { 
        it(`Devrait retourner l'utilisateur connu en base de données`, async () => { 
            var knownUser = plainToInstance(UserEntity, knownUserRaw, {enableImplicitConversion: true});
            const getSpy = jest.spyOn(userService, 'get').mockResolvedValueOnce(knownUser);

            expect(await userService.getOrThrow(knownUserId)).toEqual(knownUser); 
            
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => {
            const getSpy = jest.spyOn(userService, 'get').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: ""`)));

            const error = await getError(async () => await userService.getOrThrow(""));

            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const getSpy = jest.spyOn(userService, 'get').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: "NotAnUUID"`)));
            
            const error = await getError(async () => await userService.getOrThrow("NotAnUUID"));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            const getSpy = jest.spyOn(userService, 'get').mockResolvedValueOnce(null);

            const error = await getError(async () => await userService.getOrThrow(inexistentUUID));
            
            expect(error).toBeInstanceOf(NotFoundUserError);
            expect(error.message).toBe(NotFoundUserMessage);
            expect(getSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe('isActive', () => { 
        it(`Devrait retourner 'true' si l'utilisateur est actif`, async () => { 
            const existSpy = jest.spyOn(userRepositoryMock, 'exist').mockResolvedValueOnce(true);

            expect(await userService.isActive(knownUserId)).toStrictEqual(true); 
            
            expect(existSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner 'false' si l'utilisateur est inactif`, async () => { 
            const existSpy = jest.spyOn(userRepositoryMock, 'exist').mockResolvedValueOnce(false);

            expect(await userService.isActive(knownInactiveUserId)).toStrictEqual(false); 
            
            expect(existSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner 'false' si l'identifiant est inexitant`, async () => { 
            const existSpy = jest.spyOn(userRepositoryMock, 'exist').mockResolvedValueOnce(false);
            
            expect(await userService.isActive(inexistentUUID)).toStrictEqual(false); 

            expect(existSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const existSpy = jest.spyOn(userRepositoryMock, 'exist').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: ""`)));
            
            const error = await getError(async () => await userService.isActive(""));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
            expect(existSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const existSpy = jest.spyOn(userRepositoryMock, 'exist').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: "NotAnUUID"`)));
            
            const error = await getError(async () => await userService.isActive("NotAnUUID"));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
            expect(existSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('isActiveOrThrow', () => { 
        it(`Devrait retourner 'true' si l'utilisateur est actif`, async () => { 
            const isActiveSpy = jest.spyOn(userService, 'isActive').mockResolvedValueOnce(true);

            expect(await userService.isActiveOrThrow(knownUserId)).toEqual(true); 
            
            expect(isActiveSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'utilisateur est inactif`, async () => {
            const isActiveSpy = jest.spyOn(userService, 'isActive').mockResolvedValueOnce(false);

            const error = await getError(async () => await userService.isActiveOrThrow(knownInactiveUserId));

            expect(error).toBeInstanceOf(InactiveUserError);
            expect(error.message).toBe(InactiveUserMessage);
            expect(isActiveSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            const isActiveSpy = jest.spyOn(userService, 'isActive').mockResolvedValueOnce(false);

            const error = await getError(async () => await userService.isActiveOrThrow(inexistentUUID));
            
            expect(error).toBeInstanceOf(InactiveUserError);
            expect(error.message).toBe(InactiveUserMessage);
            expect(isActiveSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => {
            const isActiveSpy = jest.spyOn(userService, 'isActive').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: ""`)));

            const error = await getError(async () => await userService.isActiveOrThrow(""));

            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
            expect(isActiveSpy).toHaveBeenCalledTimes(1);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const isActiveSpy = jest.spyOn(userService, 'isActive').mockRejectedValueOnce(new QueryFailedError(null, null, new Error(`invalid input syntax for type uuid: "NotAnUUID"`)));
            
            const error = await getError(async () => await userService.isActiveOrThrow("NotAnUUID"));
            
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
            expect(isActiveSpy).toHaveBeenCalledTimes(1);
        });
    });
});

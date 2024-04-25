import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { IAddUser, IUser, UserId, UserStatus } from './user.interfaces';
import { InactiveUserError, InactiveUserMessage, NotFoundUserError, NotFoundUserMessage } from './user.errors';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Ajoute un utilisateur
   * @param user Utilisateur à ajouter au système
   */
  async add(user: IAddUser): Promise<UserId> {
    const addedUser = await this._userRepository.insert({
      ...user,
      status: "active",
    });
    const userId = addedUser.identifiers[0].id;

    return userId;
  }

  /**
   * Suppression d'un utilisateur (soft delete)
   *
   * @param userId Identifiant de l'utilisateur à désactiver
   * @returns L'identifiant de l'utilisateur désactivé
   */
  async deactivate(userId: UserId): Promise<UserId> {
    const userExists = await this._userRepository.exist({
      where: { id: Equal(userId) },
    });
    if (!userExists) {
      throw new NotFoundException(`L'utilisateur n'a pas été trouvé`);
    }

    await this._userRepository.update(
      { id: Equal(userId) },
      { status: "inactive" },
    );

    return userId;
  }

  /**
   * Récupère un utilisateur par rapport à un identifiant
   * @param id Identifiant de l'utilisateur à récupérer
   * @returns L'utilisateur correspondant à l'identifiant ou undefined
   */
  get(id: UserId): Promise<IUser> {
    return this._userRepository.findOneBy({ id: Equal(id) });
  }
  /**
   * Récupère un utilisateur par rapport à un identifiant
   * @param id Identifiant de l'utilisateur à récupérer
   * @returns L'utilisateur correspondant à l'identifiant ou NotFoundUserError
   */
  async getOrThrow(id: UserId): Promise<IUser> {
    const user = await this.get(id);
    if(!user){
      throw new NotFoundUserError(NotFoundUserMessage);
    }
    return user;
  }
  /**
   * Vérifie si l'utilisateur est actif par rapport à un identifiant
   * @param id Identifiant de l'utilisateur à vérifier
   * @returns Un booléen indiquant si l'utilisateur est actif
   */
  isActive(id: UserId): Promise<boolean> {
    return this._userRepository.exist({where : {id: Equal(id), status: 'active'}});
  }
  /**
   * Vérifie si l'utilisateur est actif par rapport à un identifiant
   * @param id Identifiant de l'utilisateur à vérifier
   * @returns Un booléen true si l'utilisateur est actif ou InactiveUserError
   */
  async isActiveOrThrow(id: UserId): Promise<boolean> {
    const isActive = await this.isActive(id);
    if(!isActive){
      throw new InactiveUserError(InactiveUserMessage);
    }
    return isActive;
  }
}

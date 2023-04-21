export type IUser = {
  id: string;
  name: string;
  birthdate?: Date | null;
};

export type IAddUser = Omit<IUser, 'id'>;

export type UserId = IUser['id'];

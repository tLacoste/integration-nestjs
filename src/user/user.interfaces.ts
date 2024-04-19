export type IUser = {
  id: string;
  name: string;
  status: UserStatus;
  birthdate?: Date | null;
};


export type IAddUser = Omit<IUser, 'id' | 'status'>;

export type UserId = IUser['id'];

export type UserStatus = "active" | "inactive";

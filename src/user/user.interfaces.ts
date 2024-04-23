import { IEmail } from "../email/email.interfaces";

export type IUser = {
  id: string;
  name: string;
  status: UserStatus;
  birthdate?: Date | null;
  emails: IEmail[];
};


export type IAddUser = Omit<IUser, 'id' | 'status' | 'emails'>;

export type UserId = IUser['id'];

export type UserStatus = "active" | "inactive";

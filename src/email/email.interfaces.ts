export type IEmail = {
  id: string;
  address: string;
  userId: string;
};

export type IAddEmail = Omit<IEmail, 'id'>;

export type EmailId = IEmail['id'];

export type IEmailFilters = {
  address?: { equal: string; in: string[] } | null;
};

import { UserStatus } from "../src/user/user.interfaces";

export const knownUserId = '0f9fcea9-f618-44e5-b182-0e3c83586f8b';
export const knownInactiveUserId = '0f9fcea9-f618-44e5-b182-0e3c83586f8c';

export const knownUser = {
  id: knownUserId,
  name: 'Moi Même',
  status: "active" as UserStatus,
  birthdate: new Date(1989, 3, 8).toISOString(),
  emails: [
    {
      userId: knownUserId,
      id: 'f7176922-9ae8-4ac7-b1d9-d6b8ed75475b',
      address: 'test1@upcse-integration.coop',
    },
    {
      userId: knownUserId,
      id: 'f6035e0a-25b4-40a9-818d-cb7420495d26',
      address: 'test2@upcse-integration.coop',
    },
    {
      userId: knownUserId,
      id: '1983ee1f-e64e-4dfd-9a28-ee4827d68993',
      address: 'test3@upcse-integration.coop',
    },
  ],
};

export const knownInactiveUser = {
  id: knownInactiveUserId,
  name: 'Moi Même',
  status: "inactive" as UserStatus,
  birthdate: new Date(1989, 3, 8).toISOString(),
  emails: [
    {
      userId: knownInactiveUserId,
      id: 'f7176922-9ae8-4ac7-b1d9-d6b8ed75475c',
      address: 'test1.inactive@upcse-integration.coop',
    },
    {
      userId: knownInactiveUserId,
      id: 'f6035e0a-25b4-40a9-818d-cb7420495d27',
      address: 'test2.inactive@upcse-integration.coop',
    },
    {
      userId: knownInactiveUserId,
      id: '1983ee1f-e64e-4dfd-9a28-ee4827d68994',
      address: 'test3.inactive@upcse-integration.coop',
    },
  ],
}

export const [email1, email2, email3] = knownUser.emails;

export const inexistentUUID = "00000000-0000-0000-0000-000000000000";
import { Document } from "mongoose";

export interface User extends Document {
  meta: UserMeta;
  auth: UserAuth;
  location?: UserLocation;
}

export interface UserMeta {
  firstname: string;
  lastname: string;
}

export interface UserAuth {
  email: string;
  password: string;
  verified: boolean;
}

export interface UserLocation {
  country: string;
  city: string;
}

export type Users = Array<User>;

export interface UpdateUserDTO {
  firstname?: string;
  lastname?: string;
  password?: string;
  country?: string;
  city?: string;
}

export interface CreateUserDTO {
  meta: UserMeta;
  auth: UserAuth;
}

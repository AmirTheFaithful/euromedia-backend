import { Document } from "mongoose";

export interface User extends Document {
  meta: UserMeta;
  auth: UserAuth;
  location?: UserLocation;
}

export type Users = User[];

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

export interface CreateUserDTO {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export type UpdateUserDTO = Partial<
  Omit<CreateUserDTO, "email"> & UserLocation
>;

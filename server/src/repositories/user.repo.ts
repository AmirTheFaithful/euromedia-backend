import { ObjectId } from "mongodb";
import { injectable, inject } from "inversify";

import UserModel from "../models/user.model";
import { User, Users } from "../types/user.type";
import { UpdateUserRequestBody } from "../types/api.type";

type AsyncUser = Promise<User | null>;

@injectable()
class UserRepository {
  constructor(@inject(UserModel) private readonly model: UserModel) {}

  public async getAllUsers(): Promise<Users> {
    return this.model.model.find();
  }

  public async getUserById(id: ObjectId): AsyncUser {
    return this.model.model.findById(id);
  }

  public async getUserByEmail(email: string): AsyncUser {
    return this.model.model.findOne({ "auth.email": email });
  }

  public async createNewUser(data: Pick<User, "meta" | "auth">): Promise<User> {
    return new this.model.model(data);
  }

  public async updateUserById(
    id: ObjectId,
    data: UpdateUserRequestBody
  ): AsyncUser {
    return this.model.model.findByIdAndUpdate(id, data, { new: true });
  }

  public async updateUserByEmail(
    email: string,
    data: UpdateUserRequestBody
  ): AsyncUser {
    return this.model.model.findOneAndUpdate({ "auth.email": email }, data, {
      new: true,
    });
  }

  public async deleteUserById(id: ObjectId): AsyncUser {
    return this.model.model.findByIdAndDelete(id);
  }

  public async deleteUserByEmail(email: string): AsyncUser {
    return this.model.model.findOneAndDelete({ "auth.email": email });
  }
}

export default UserRepository;

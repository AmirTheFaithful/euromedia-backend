import { ObjectId } from "mongodb";
import { injectable, inject } from "inversify";

import UserRepo from "../repositories/user.repo";
import { CreateUserDTO, UpdateUserDTO } from "../types/user.type";

@injectable()
class UserService {
  constructor(@inject(UserRepo) private readonly repo: UserRepo) {}

  public async getAllUsers() {
    return this.repo.getAllUsers();
  }

  public async getUserById(id: ObjectId) {
    return this.repo.getUserById(id);
  }

  public async getUserByEmail(email: string) {
    return this.repo.getUserByEmail(email);
  }

  public async createNewUser(data: CreateUserDTO) {
    // Distribute plain data object by setting 'meta' and 'auth' categories.
    return this.repo.createNewUser({
      meta: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      auth: {
        email: data.email,
        password: data.password,
      },
    });
  }

  public async updateUserById(id: ObjectId, data: UpdateUserDTO) {
    return this.repo.updateUserById(id, data);
  }

  public async updateUserByEmail(email: string, data: UpdateUserDTO) {
    return this.repo.updateUserByEmail(email, data);
  }

  public deleteUserById(id: ObjectId) {
    return this.repo.deleteUserById(id);
  }

  public deleteUserByEmail(email: string) {
    return this.repo.deleteUserByEmail(email);
  }
}

export default UserService;

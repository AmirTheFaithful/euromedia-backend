import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import UserService from "../services/user.service";
import { BadRequestError, NotFoundError } from "../errors/http-errors";
import { User, Users, UpdateUserDTO } from "../types/user.type";
import { cache } from "../config/lru";

export interface Queries {
  id?: string;
  email?: string;
}

export interface Body {
  data: UpdateUserDTO;
}

class UserUseCase {
  protected validateObjectId(id: string): never | ObjectId {
    if (!id || !ObjectId.isValid(id)) {
      throw new BadRequestError(`Query ${id} is not valid id.`);
    }

    return new ObjectId(id);
  }

  protected validateEmail(email: string): never | string {
    const emailRegEx: RegExp =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegEx.test(email)) {
      throw new BadRequestError(`Invalid email "${email}"`);
    }

    return email;
  }
}

@injectable()
export class FetchUserUseCase extends UserUseCase {
  constructor(@inject(UserService) private readonly service: UserService) {
    super();
  }

  public async execute(input: Queries) {
    const { id, email } = input;

    if (id) {
      return await this.getById(id);
    }

    if (email) {
      return await this.getByEmail(email);
    }

    return await this.getAll();
  }

  private async getById(query: string): Promise<never | User> {
    const id = this.validateObjectId(query);
    let user: User | null = cache.get(query);

    if (!user) user = await this.service.getUserById(id);

    if (!user) {
      throw new NotFoundError(`User with id "${id}" does not exist.`);
    }

    cache.set(query, user);
    return user;
  }

  private async getByEmail(email: string): Promise<never | User> {
    email = this.validateEmail(email);
    let user: User | null = cache.get(email);

    if (!user) user = await this.service.getUserByEmail(email);

    if (!user) {
      throw new NotFoundError();
    }

    cache.set(email, user);
    return user;
  }

  private async getAll(): Promise<User | Users> {
    const users: Users = await this.service.getAllUsers();
    return users;
  }
}

@injectable()
export class UpdateUserUseCase extends UserUseCase {
  constructor(@inject(UserService) private readonly service: UserService) {
    super();
  }

  public async execute(queries: Queries, body: Body) {
    const { id, email }: Queries = queries;
    const { data }: Body = body;

    let updatedUser: User | null = null;

    if (id) {
      const validId = this.validateObjectId(id);
      updatedUser = await this.service.updateUserById(validId, data);
    } else if (email) {
      const validEmail = this.validateEmail(email);
      updatedUser = await this.service.updateUserByEmail(validEmail, data);
    } else {
      throw new BadRequestError("No query is provided.");
    }

    if (!updatedUser) {
      throw new NotFoundError();
    }

    await updatedUser.save();
    return updatedUser;
  }
}

@injectable()
export class DeleteUserUseCase extends UserUseCase {
  constructor(@inject(UserService) private readonly service: UserService) {
    super();
  }

  public async execute(query: Queries): Promise<User> {
    const { id, email }: Queries = query;

    let user: User | null = null;
    if (id) {
      const validId = this.validateObjectId(id);
      user = await this.service.deleteUserById(validId);
    } else if (email) {
      const validEmail = this.validateEmail(email);
      user = await this.service.deleteUserByEmail(validEmail);
    } else {
      throw new BadRequestError("No query is provided.");
    }

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }
}

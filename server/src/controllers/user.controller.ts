import { Request, Response } from "express";

import Container from "../containers";
import { asyncHandler } from "../utils/asyncHandler";
import { ResponseBody } from "../types/api.type";
import { UpdateUserDTO, User, Users } from "../types/user.type";
import { UserQueries } from "../types/queries.type";
import {
  FetchUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
} from "../use-cases/user.use-case";
import { cache } from "../config/lru";

class UserController {
  constructor(private readonly container = Container()) {}

  public getUsers = asyncHandler(
    async (
      req: Request<any, User | Users, any, UserQueries>,
      res: Response<ResponseBody<User | Users>>
    ) => {
      const fetchUserUseCase = this.container.get(FetchUserUseCase);
      const data: User | Users = await fetchUserUseCase.execute(req.query);

      const cachedKey: string | undefined = req.query.id ?? req.query.email;
      const isCached = cachedKey && cache.has(cachedKey);

      res.setHeader("X-Cache-Status", isCached ? "HIT" : "MISS");

      // If query is provided and a cached user was fetched - reflect that in the response and send a specific header.
      if (cachedKey && !isCached && !Array.isArray(data)) {
        cache.set(cachedKey, data);
      }

      const responseMessage: string = `Fetch success${
        isCached ? " (cached)" : ""
      }.`;

      res.status(200).json({ data, message: responseMessage }).end();
    }
  );

  public updateUser = asyncHandler(
    async (
      req: Request<any, User, UpdateUserDTO, UserQueries>,
      res: Response<ResponseBody<User>>
    ) => {
      const updateUserUseCase = this.container.get(UpdateUserUseCase);
      const data: User = await updateUserUseCase.execute(req.query, req.body);
      res.status(200).json({ data, message: "Update success." }).end();
    }
  );

  public deleteUser = asyncHandler(
    async (
      req: Request<any, User, any, UserQueries>,
      res: Response<ResponseBody<User>>
    ) => {
      const deleteUserUseCase = this.container.get(DeleteUserUseCase);
      const data: User = await deleteUserUseCase.execute(req.query);
      res.status(200).json({ data, message: "Deletion success." }).end();
    }
  );
}

export default new UserController();

import { Container } from "inversify";

import UserModel from "../models/user.model";
import UserRepository from "../repositories/user.repo";
import UserService from "../services/user.service";

import {
  FetchUserUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
} from "../use-cases/user.use-case";

export default (container: Container): void => {
  container.bind(UserModel).toSelf();
  container.bind(UserRepository).toSelf();
  container.bind(UserService).toSelf();

  container.bind(FetchUserUseCase).toSelf();
  container.bind(UpdateUserUseCase).toSelf();
  container.bind(DeleteUserUseCase).toSelf();
};

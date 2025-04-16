import { Container } from "inversify";

import UserModel from "../models/user.model";
import UserRepository from "../repositories/user.repo";
import UserService from "../services/user.service";

import {
  FetchUserUseCase,
  UpdateUserUseCase,
} from "../use-cases/user.use-case";

import {
  AuthUseCase,
  RegisterUseCase,
  VerifyEmailUseCase,
  LoginUseCase,
  ResetPasswordRequestUseCase,
  ResetPasswordUseCase,
} from "../use-cases/auth.use-case";

const container: Container = new Container();

container.bind(UserModel).toSelf();
container.bind(UserRepository).toSelf();
container.bind(UserService).toSelf();

container.bind(FetchUserUseCase).toSelf();
container.bind(UpdateUserUseCase).toSelf();

container.bind(AuthUseCase).toSelf();
container.bind(RegisterUseCase).toSelf();
container.bind(VerifyEmailUseCase).toSelf();
container.bind(LoginUseCase).toSelf();
container.bind(ResetPasswordRequestUseCase).toSelf();
container.bind(ResetPasswordUseCase).toSelf();

export default container;

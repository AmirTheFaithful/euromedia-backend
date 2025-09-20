import { Container } from "inversify";

import {
  AuthUseCase,
  RegisterUseCase,
  VerifyEmailUseCase,
  LoginUseCase,
  ResetPasswordRequestUseCase,
  ResetPasswordUseCase,
  RefreshAccessToken,
} from "../use-cases/auth.use-case";

export default (container: Container): void => {
  container.bind(AuthUseCase).toSelf();
  container.bind(RegisterUseCase).toSelf();
  container.bind(VerifyEmailUseCase).toSelf();
  container.bind(LoginUseCase).toSelf();
  container.bind(ResetPasswordRequestUseCase).toSelf();
  container.bind(ResetPasswordUseCase).toSelf();
  container.bind(RefreshAccessToken).toSelf();
};

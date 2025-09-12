import { Container } from "inversify";

import {
  Setup2FAUseCase,
  Verify2FAUseCase,
  Initiate2FAUseCase,
} from "../use-cases/twoFAUseCase";

export default (container: Container): void => {
  container.bind(Setup2FAUseCase).toSelf();
  container.bind(Verify2FAUseCase).toSelf();
  container.bind(Initiate2FAUseCase).toSelf();
};

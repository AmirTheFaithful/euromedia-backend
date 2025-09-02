import { Container } from "inversify";

import { Setup2FAUseCase } from "../use-cases/twoFAUseCase";

export default (container: Container): void => {
  container.bind(Setup2FAUseCase).toSelf();
};

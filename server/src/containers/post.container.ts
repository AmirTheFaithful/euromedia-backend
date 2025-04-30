import { Container } from "inversify";

import {
  FetchPostUseCase,
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
} from "../use-cases/post.use-case";

export default (container: Container): void => {
  container.bind(FetchPostUseCase).toSelf();
  container.bind(CreatePostUseCase).toSelf();
  container.bind(UpdatePostUseCase).toSelf();
  container.bind(DeletePostUseCase).toSelf();
};

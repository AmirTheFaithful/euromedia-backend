import { Container } from "inversify";

import {
  FetchPostUseCase,
  CreatePostUseCase,
} from "../use-cases/post.use-case";

export default (container: Container): void => {
  container.bind(FetchPostUseCase).toSelf();
  container.bind(CreatePostUseCase).toSelf();
};

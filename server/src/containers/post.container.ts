import { Container } from "inversify";

import PostModel from "../models/post.model";
import PostRepository from "../repositories/post.repo";
import PostService from "../services/post.service";

import {
  FetchPostUseCase,
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
} from "../use-cases/post.use-case";

export default (container: Container): void => {
  container.bind(PostModel).toSelf();
  container.bind(PostRepository).toSelf();
  container.bind(PostService).toSelf();

  container.bind(FetchPostUseCase).toSelf();
  container.bind(CreatePostUseCase).toSelf();
  container.bind(UpdatePostUseCase).toSelf();
  container.bind(DeletePostUseCase).toSelf();
};

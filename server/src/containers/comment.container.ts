import { Container } from "inversify";

import CommentModel from "../models/comment.model";
import CommentRepo from "../repositories/comment.repo";
import CommentService from "../services/comment.service";

import {
  FetchCommentsUseCase,
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
} from "../use-cases/comment.use-case";

export default (container: Container): void => {
  container.bind(CommentModel).toSelf();
  container.bind(CommentRepo).toSelf();
  container.bind(CommentService).toSelf();

  container.bind(FetchCommentsUseCase).toSelf();
  container.bind(CreateCommentUseCase).toSelf();
  container.bind(UpdateCommentUseCase).toSelf();
  container.bind(DeleteCommentUseCase).toSelf();
};

import { Container } from "inversify";

import ReactionModel from "../models/reaction.model";
import ReactionRepository from "../repositories/reaction.repo";
import ReactionService from "../services/reaction.service";

import {
  FetchReactionUseCase,
  CreateReactionUseCase,
  UpdateReactionUseCase,
  DeleteReactionUseCase,
} from "../use-cases/reaction.use-case";

export default (container: Container): void => {
  container.bind(ReactionModel).toSelf();
  container.bind(ReactionRepository).toSelf();
  container.bind(ReactionService).toSelf();

  container.bind(FetchReactionUseCase).toSelf();
  container.bind(CreateReactionUseCase).toSelf();
  container.bind(UpdateReactionUseCase).toSelf();
  container.bind(DeleteReactionUseCase).toSelf();
};

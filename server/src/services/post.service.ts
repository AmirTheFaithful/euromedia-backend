import { injectable, inject } from "inversify";
import { ObjectId } from "mongodb";

import PostRepository from "../repositories/post.repo";
import { CreatePostDTO, UpdatePostDTO } from "../types/post.type";

/**
 * PostService: posts-related logic managing service.
 * Does not have direct access to the post model,
 * instead just calls posts repository for handling operations,
 * prompted from the client. Serves as a middle-point between the
 * repository and the controllers.
 *
 * @injectable() decorator indicates that this class can be injected via Dependency Injection (DI)
 */
@injectable()
export default class PostService {
  constructor(@inject(PostRepository) private readonly repo: PostRepository) {}

  public async getAllPosts() {
    return this.repo.getAllPosts();
  }

  public async getPostById(id: ObjectId) {
    return this.repo.getPostById(id);
  }

  public async getPostsByAuthorId(authorId: ObjectId) {
    return this.repo.getPostsByAuthorId(authorId);
  }

  public async getPostsByTags(tags: Array<string>) {
    return this.repo.getPostsByTags(tags);
  }

  public async createNewPost(data: CreatePostDTO) {
    return this.repo.createNewPost(data);
  }

  public async updatePostById(id: ObjectId, data: UpdatePostDTO) {
    return this.repo.updatePostById(id, data);
  }

  public async deletePostById(id: ObjectId) {
    return this.repo.deletePostById(id);
  }
}

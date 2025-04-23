import { ObjectId } from "mongodb";
import { injectable, inject } from "inversify";

import PostModel from "../models/post.model";
import { Post, Posts, CreatePostDTO, UpdatePostDTO } from "../types/post.type";

@injectable()
export default class PostRepository {
  constructor(@inject(PostModel) private readonly model: PostModel) {}

  // Fetch all posts from the DB.
  public async getAllPosts(): Promise<Posts> {
    return this.model.instance.find();
  }

  // Create a new post and save it to the DB.
  public async getPostById(id: ObjectId): Promise<Post | null> {
    return this.model.instance.findById(id);
  }

  // Resturn all posts by their author's ID.
  public async getPostsByAuthorId(authorId: ObjectId): Promise<Posts> {
    return this.model.instance.find({ "meta.authorId": authorId });
  }

  // Return a post by its title.
  public async getPostByTitle(title: string): Promise<Post | null> {
    return this.model.instance.findOne({ "content.title": title });
  }

  // Get all posts by tags specified in their metadata.
  public async getPostsByTags(tags: Array<string>): Promise<Posts> {
    return this.model.instance.find({
      "meta.tags": { $in: tags },
    });
  }

  public async createNewPost(data: CreatePostDTO): Promise<Post> {
    return new this.model.instance(data);
  }

  public async updatePostById(
    id: ObjectId,
    data: UpdatePostDTO
  ): Promise<Post | null> {
    return this.model.instance.findByIdAndUpdate(id, data, { new: true });
  }

  public async deletePostById(id: ObjectId): Promise<Post | null> {
    return this.model.instance.findByIdAndDelete(id);
  }
}

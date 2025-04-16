import { Schema, model, Model } from "mongoose";
import { injectable, inject } from "inversify";

import { User } from "../types/user.type";

const UserSchema = new Schema<User>({
  meta: {
    firstname: { type: String, required: true, selected: false },
    lastname: { type: String, required: true, selected: false },
  },
  auth: {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, selected: false },
    verified: { type: Boolean, required: true },
  },
  location: {
    country: { type: String, required: false, selected: false },
    city: { type: String, required: false, selected: false },
  },
});

@injectable()
class UserModel {
  public model: Model<User>;

  constructor() {
    this.model = model<User>("User", UserSchema);
  }
}

export default UserModel;

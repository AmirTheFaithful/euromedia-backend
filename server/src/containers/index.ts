import { Container } from "inversify";

import userContainer from "./user.container";
import authContainer from "./auth.container";
import twoFAContainer from "./twoFA.container";
import postContainer from "./post.container";
import reactionContainer from "./reaction.container";
import commentContainer from "./comment.container";

export default (): Container => {
  const centralContainer: Container = new Container();

  userContainer(centralContainer);
  authContainer(centralContainer);
  twoFAContainer(centralContainer);
  postContainer(centralContainer);
  reactionContainer(centralContainer);
  commentContainer(centralContainer);

  return centralContainer;
};

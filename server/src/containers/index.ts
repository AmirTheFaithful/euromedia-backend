import { Container } from "inversify";

import userContainer from "./user.container";
import authContainer from "./auth.container";
import postContainer from "./post.container";

export default (): Container => {
  const centralContainer: Container = new Container();

  userContainer(centralContainer);
  authContainer(centralContainer);
  postContainer(centralContainer);

  return centralContainer;
};

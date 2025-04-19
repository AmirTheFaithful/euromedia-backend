import { Container } from "inversify";

import userContainer from "./user.container";
import autContainer from "./auth.container";

export default (): Container => {
  const centralContainer: Container = new Container();

  userContainer(centralContainer);
  autContainer(centralContainer);

  return centralContainer;
};

import { createWsMsg } from "src/utils/createWsMsg.ts";
import { type GoMsg, type GoMsgPayload, GoMsgType, StoneColor } from "src/games/Go/Go.types.ts";

export const getOppositeColor = (color: StoneColor) => {
  return color === StoneColor.Black ? StoneColor.White : StoneColor.Black;
};

export const createGoMsg = (type: GoMsgType, payload?: GoMsgPayload) =>
  createWsMsg(type, payload) as GoMsg;

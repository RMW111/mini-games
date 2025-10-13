import { createWsMsg } from "src/utils/createWsMsg.ts";
import {
  type ClientCursorMsg,
  type ClientCursorMsgPayload,
  ClientCursorMsgType,
} from "src/types/clientCursorMsg.ts";

export const createCursorWsMsg = (type: ClientCursorMsgType, payload: ClientCursorMsgPayload) =>
  createWsMsg(type, payload) as ClientCursorMsg;

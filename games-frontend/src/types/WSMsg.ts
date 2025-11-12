export interface WSMsg<Type, Payload = undefined> {
  type: Type;
  payload: Payload;
}

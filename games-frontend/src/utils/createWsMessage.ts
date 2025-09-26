export const createWsMessage = (type: string, payload: object) => {
  return { type, payload };
};

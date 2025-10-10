import { atom } from "jotai";

export const authAtom = atom({
  pending: true,
  isLoggedIn: false,
});

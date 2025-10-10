import { atom } from "jotai";
import type { User } from "src/types/user.ts";

export const userAtom = atom<User | null>(null);

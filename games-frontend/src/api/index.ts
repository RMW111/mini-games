import { POST } from "src/api/methods/POST.ts";
import { GET } from "src/api/methods/GET.ts";
import type { DefaultBackendResponse } from "src/types/defaultBackendResponse.ts";
import type { AuthReq } from "src/api/dtos/auth.ts";
import type { GameInfo } from "src/types/game.ts";
import type { CreateSessionReq, CreateSessionRes } from "src/api/dtos/session.ts";
import type { User } from "src/types/user.ts";

export const API = {
  auth: {
    register: POST<AuthReq, DefaultBackendResponse>("auth/register"),
    login: POST<AuthReq>("auth/login"),
    logout: POST("auth/logout"),
  },
  games: {
    getAll: GET<GameInfo[]>("games"),
    getBySlug: (slug: string) => GET<GameInfo>(`games/${slug}`),
  },
  sessions: {
    createNew: POST<CreateSessionReq, CreateSessionRes>(`sessions/new`),
    join: (sessionId: string) => POST(`sessions/${sessionId}/join`),
  },
  getUserInfo: GET<User>("me"),
};

import { POST } from "src/api/methods/POST.ts";
import { GET } from "src/api/methods/GET.ts";
import type { DefaultBackendRes } from "src/types/defaultBackendRes.ts";
import type { AuthReq, LoginReq } from "src/api/dtos/auth.ts";
import type { GameInfo } from "src/types/game.ts";
import type { CreateSessionReq, CreateSessionRes } from "src/api/dtos/session.ts";
import type { User } from "src/types/user.ts";
import type { Session } from "src/types/session.ts";

export const API = {
  auth: {
    register: POST<AuthReq, DefaultBackendRes>("auth/register"),
    login: POST<LoginReq>("auth/login"),
    logout: POST("auth/logout"),
  },
  games: {
    getAll: GET<GameInfo[]>("games"),
    getBySlug: (slug: string) => GET<GameInfo>(`games/${slug}`),
    getGameSessions: (slug: string) => GET<Session[]>(`games/${slug}/sessions`),
  },
  sessions: {
    createNew: POST<CreateSessionReq, CreateSessionRes>(`sessions/new`),
    join: (sessionId: string) => POST(`sessions/${sessionId}/join`),
    delete: (sessionId: string) => POST(`sessions/${sessionId}/delete`),
  },
  getUserInfo: GET<User>("me"),
};

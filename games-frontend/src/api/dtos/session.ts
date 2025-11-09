export interface CreateSessionReq {
  slug: string;
  creationData?: unknown;
}

export interface CreateSessionRes {
  sessionId: string;
}

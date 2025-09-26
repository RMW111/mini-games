export enum ParticipantRole {
  Creator = "creator",
  Player = "player",
  Spectator = "spectator",
}

export interface Participant {
  email: string;
  role: ParticipantRole;
  userId: string;
}

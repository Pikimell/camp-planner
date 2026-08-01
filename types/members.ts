export type Gender = "male" | "female";

export interface Member {
  id: string;
  fullName: string;
  groupId: string;
  gender: Gender;
  phoneNumber?: string;
  email?: string;
  notes?: string;
  teamNumber: number;
}

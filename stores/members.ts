import { Member } from "@/types/members";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

interface MemberStore {
  members: Member[];
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, body: Partial<Member>) => void;
  setMembers: (members: Member[]) => void;
  clearMembers: () => void;
}

export const useMemberStore = create<MemberStore>()((setStore) => {
  return {
    members: [],

    addMember: (member) => {
      const copy = { ...member, id: uuidv4() };
      setStore((store) => {
        return { members: [...store.members, copy] };
      });
    },

    removeMember: (id) => {
      setStore((store) => {
        return {
          members: store.members.filter((member) => member.id !== id),
        };
      });
    },

    updateMember: (id, body) => {
      setStore((store) => {
        return {
          members: store.members.map((member) => {
            if (member.id !== id) {
              return member;
            }

            return { ...member, ...body, id: member.id };
          }),
        };
      });
    },

    setMembers: (members) => {
      setStore({ members });
    },

    clearMembers: () => {
      setStore({ members: [] });
    },
  };
});

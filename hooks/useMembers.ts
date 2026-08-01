"use client";

import { useCallback, useMemo } from "react";
import { useMemberStore } from "@/stores/members";
import { Gender, Member } from "@/types/members";

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

const memberMatchesSearch = (member: Member, search: string) => {
  const normalizedSearch = normalizeSearchValue(search);

  if (!normalizedSearch) {
    return true;
  }

  return [
    member.fullName,
    member.gender,
    member.phoneNumber,
    member.email,
    member.notes,
    String(member.teamNumber),
  ].some((value) => value?.toLowerCase().includes(normalizedSearch));
};

export const useMembers = () => {
  const store = useMemberStore();

  const sortedMembers = useMemo(() => {
    return [...store.members].sort((firstMember, secondMember) => {
      return firstMember.fullName.localeCompare(secondMember.fullName, "uk");
    });
  }, [store.members]);

  const membersById = useMemo(() => {
    return new Map(store.members.map((member) => [member.id, member]));
  }, [store.members]);

  const membersByTeamNumber = useMemo(() => {
    return store.members.reduce<Record<number, Member[]>>((acc, member) => {
      acc[member.teamNumber] = [...(acc[member.teamNumber] ?? []), member];
      return acc;
    }, {});
  }, [store.members]);

  const getMemberById = useCallback(
    (id: string) => membersById.get(id),
    [membersById],
  );

  const getMembersByIds = useCallback(
    (ids: string[]) => ids.map((id) => membersById.get(id)).filter(Boolean),
    [membersById],
  );

  const getMembersByGender = useCallback(
    (gender: Gender) =>
      store.members.filter((member) => member.gender === gender),
    [store.members],
  );

  const getMembersByTeamNumber = useCallback(
    (teamNumber: number) => membersByTeamNumber[teamNumber] ?? [],
    [membersByTeamNumber],
  );

  const searchMembers = useCallback(
    (search: string) => {
      return sortedMembers.filter((member) =>
        memberMatchesSearch(member, search),
      );
    },
    [sortedMembers],
  );

  const hasMember = useCallback(
    (id: string) => membersById.has(id),
    [membersById],
  );

  return {
    members: store.members,
    sortedMembers,
    membersById,
    membersByTeamNumber,
    membersCount: store.members.length,
    hasMembers: store.members.length > 0,
    addMember: store.addMember,
    removeMember: store.removeMember,
    updateMember: store.updateMember,
    setMembers: store.setMembers,
    clearMembers: store.clearMembers,
    getMemberById,
    getMembersByIds,
    getMembersByGender,
    getMembersByTeamNumber,
    searchMembers,
    hasMember,
  };
};

export const useMember = (id: string) => {
  return useMemberStore(
    useCallback(
      (store) => store.members.find((member) => member.id === id),
      [id],
    ),
  );
};

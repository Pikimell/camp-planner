"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useDutySchedule, useMembers } from "@/hooks";
import { DutySchedule } from "@/types/dutySchedules";
import { Member } from "@/types/members";
import { parseImportedDutySchedule } from "@/utils/jsonImportParsers";
import css from "./DutyScheduleManager.module.css";

const poolDropId = "members-pool";
const dayDropPrefix = "day:";

const getDayDropId = (dutyScheduleId: string) => {
  return `${dayDropPrefix}${dutyScheduleId}`;
};

const getDutyScheduleIdFromDropId = (dropId: string) => {
  if (!dropId.startsWith(dayDropPrefix)) {
    return "";
  }

  return dropId.replace(dayDropPrefix, "");
};

const removeMemberFromSchedules = (
  dutySchedules: DutySchedule[],
  memberId: string,
) => {
  return dutySchedules.map((dutySchedule) => {
    return {
      ...dutySchedule,
      memberIds: dutySchedule.memberIds.filter(
        (currentMemberId) => currentMemberId !== memberId,
      ),
    };
  });
};

const addMemberToSchedule = (
  dutySchedules: DutySchedule[],
  memberId: string,
  targetDutyScheduleId: string,
) => {
  return dutySchedules.map((dutySchedule) => {
    if (dutySchedule.id !== targetDutyScheduleId) {
      return dutySchedule;
    }

    if (dutySchedule.memberIds.includes(memberId)) {
      return dutySchedule;
    }

    return {
      ...dutySchedule,
      memberIds: [...dutySchedule.memberIds, memberId],
    };
  });
};

const DraggableMember = ({
  dragId,
  member,
}: {
  dragId: string;
  member: Member;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: dragId,
      data: { memberId: member.id },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <button
      ref={setNodeRef}
      className={`${css["memberCard"]} ${isDragging ? css["dragging"] : ""}`}
      style={style}
      type="button"
      {...listeners}
      {...attributes}
    >
      {member.fullName}
    </button>
  );
};

const DroppableArea = ({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: React.ReactNode;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? css["dropTargetActive"] : ""}`}
    >
      {children}
    </div>
  );
};

const DutyScheduleManager = () => {
  const { membersById, membersByTeamNumber } = useMembers();
  const {
    sortedDutySchedules,
    dutySchedules,
    dutySchedulesCount,
    addDutySchedule,
    removeDutySchedule,
    setDutySchedules,
  } = useDutySchedule();
  const [activeTeamNumber, setActiveTeamNumber] = useState(1);
  const [activeMemberId, setActiveMemberId] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const teamNumbers = useMemo(() => {
    const numbers = Object.keys(membersByTeamNumber)
      .map(Number)
      .sort((firstTeam, secondTeam) => firstTeam - secondTeam);

    return numbers.length > 0 ? numbers : [1];
  }, [membersByTeamNumber]);

  const selectedTeamMembers = useMemo(() => {
    return membersByTeamNumber[activeTeamNumber] ?? [];
  }, [membersByTeamNumber, activeTeamNumber]);
  const selectedTeamMemberIds = useMemo(() => {
    return new Set(selectedTeamMembers.map((member) => member.id));
  }, [selectedTeamMembers]);

  const assignedSelectedTeamMemberIds = useMemo(() => {
    return new Set(
      dutySchedules.flatMap((dutySchedule) => {
        return dutySchedule.memberIds.filter((memberId) => {
          return selectedTeamMemberIds.has(memberId);
        });
      }),
    );
  }, [dutySchedules, selectedTeamMemberIds]);

  const availableMembers = selectedTeamMembers.filter((member) => {
    return !assignedSelectedTeamMemberIds.has(member.id);
  });

  const activeMember = activeMemberId ? membersById.get(activeMemberId) : undefined;

  const nextDay = useMemo(() => {
    if (dutySchedules.length === 0) {
      return 1;
    }

    return Math.max(...dutySchedules.map((dutySchedule) => dutySchedule.day)) + 1;
  }, [dutySchedules]);

  const readyScheduleRows = useMemo(() => {
    return sortedDutySchedules.map((dutySchedule) => {
      const membersByTeam = teamNumbers
        .map((teamNumber) => {
          const teamMemberIds = new Set(
            (membersByTeamNumber[teamNumber] ?? []).map((member) => member.id),
          );
          const dutyMembers = dutySchedule.memberIds
            .filter((memberId) => teamMemberIds.has(memberId))
            .map((memberId) => membersById.get(memberId))
            .filter(Boolean);

          return {
            teamNumber,
            dutyMembers,
          };
        })
        .filter((team) => team.dutyMembers.length > 0);

      return {
        dutySchedule,
        membersByTeam,
      };
    });
  }, [sortedDutySchedules, teamNumbers, membersByTeamNumber, membersById]);

  const addDayColumn = () => {
    addDutySchedule({
      id: "",
      day: nextDay,
      memberIds: [],
    });
  };

  const updateSchedulesWithMemberMove = (
    memberId: string,
    targetDutyScheduleId: string,
    shouldCopy = false,
  ) => {
    const cleanedSchedules = shouldCopy
      ? dutySchedules
      : removeMemberFromSchedules(dutySchedules, memberId);

    if (!targetDutyScheduleId) {
      setDutySchedules(cleanedSchedules);
      return;
    }

    setDutySchedules(
      addMemberToSchedule(cleanedSchedules, memberId, targetDutyScheduleId),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const memberId = event.active.data.current?.memberId;

    if (typeof memberId === "string") {
      setActiveMemberId(memberId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const memberId = event.active.data.current?.memberId;
    const overId = event.over?.id;
    const nativeEvent = event.activatorEvent;
    const shouldCopy =
      nativeEvent instanceof MouseEvent &&
      (nativeEvent.ctrlKey || nativeEvent.metaKey);

    setActiveMemberId("");

    if (typeof memberId !== "string") {
      return;
    }

    if (typeof overId !== "string") {
      updateSchedulesWithMemberMove(memberId, "");
      return;
    }

    if (overId === poolDropId) {
      updateSchedulesWithMemberMove(memberId, "");
      return;
    }

    const targetDutyScheduleId = getDutyScheduleIdFromDropId(overId);

    if (targetDutyScheduleId) {
      updateSchedulesWithMemberMove(memberId, targetDutyScheduleId, shouldCopy);
    }
  };

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Чергування</p>
          <h1 className={css["title"]}>Графік чергових</h1>
        </div>
        <div className={css["counter"]}>{dutySchedulesCount}</div>
      </section>

      <section className={css["section"]}>
        <div className={css["toolbar"]}>
          <div className={css["teamSwitcher"]} aria-label="Бригади">
            {teamNumbers.map((teamNumber) => {
              const isActive = teamNumber === activeTeamNumber;

              return (
                <button
                  className={`${css["teamButton"]} ${
                    isActive ? css["activeTeamButton"] : ""
                  }`}
                  key={teamNumber}
                  type="button"
                  onClick={() => setActiveTeamNumber(teamNumber)}
                >
                  Бригада {teamNumber}
                </button>
              );
            })}
          </div>

          <button className={css["addDayButton"]} type="button" onClick={addDayColumn}>
            Додати день
          </button>
        </div>

        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div className={css["planner"]}>
            <aside className={css["poolPanel"]}>
              <div className={css["panelHeader"]}>
                <h2>Учасники</h2>
                <span>{availableMembers.length}</span>
              </div>

              <DroppableArea id={poolDropId} className={css["membersPool"]}>
                {availableMembers.length > 0 ? (
                  availableMembers.map((member) => {
                    return (
                      <DraggableMember
                        dragId={`pool:${member.id}`}
                        key={member.id}
                        member={member}
                      />
                    );
                  })
                ) : (
                  <div className={css["emptyState"]}>
                    Усі учасники цієї бригади вже розподілені.
                  </div>
                )}
              </DroppableArea>
            </aside>

            <div className={css["daysBoard"]}>
              {sortedDutySchedules.length > 0 ? (
                sortedDutySchedules.map((dutySchedule) => {
                  const selectedTeamDutyMembers = dutySchedule.memberIds
                    .filter((memberId) => selectedTeamMemberIds.has(memberId))
                    .map((memberId) => membersById.get(memberId))
                    .filter(Boolean);

                  return (
                    <section className={css["dayColumn"]} key={dutySchedule.id}>
                      <div className={css["dayHeader"]}>
                        <h2>День {dutySchedule.day}</h2>
                        <button
                          className={css["deleteDayButton"]}
                          type="button"
                          onClick={() => removeDutySchedule(dutySchedule.id)}
                        >
                          Видалити
                        </button>
                      </div>

                      <DroppableArea
                        id={getDayDropId(dutySchedule.id)}
                        className={css["dayDropZone"]}
                      >
                        {selectedTeamDutyMembers.length > 0 ? (
                          selectedTeamDutyMembers.map((member) => {
                            return member ? (
                              <DraggableMember
                                dragId={`day:${dutySchedule.id}:${member.id}`}
                                key={member.id}
                                member={member}
                              />
                            ) : null;
                          })
                        ) : (
                          <div className={css["emptyDropState"]}>
                            Перетягніть учасників сюди
                          </div>
                        )}
                      </DroppableArea>
                    </section>
                  );
                })
              ) : (
                <div className={css["emptyBoard"]}>
                  Додайте перший день, щоб почати розподіл чергувань.
                </div>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeMember ? (
              <div className={css["dragOverlay"]}>{activeMember.fullName}</div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      <JsonStringImport
        arrayKeys={["dutySchedules"]}
        description="Встав JSON-масив чергувань або обʼєкт з data.dutySchedules. Поточний графік чергувань буде замінено імпортованим масивом."
        example={`[
  {
    "day": 1,
    "memberIds": ["member-1", "member-2"]
  }
]`}
        parseItem={parseImportedDutySchedule}
        title="Імпорт чергувань з JSON"
        onImport={setDutySchedules}
      />

      <section className={css["readySection"]}>
        <div className={css["readyHeader"]}>
          <div>
            <p className={css["eyebrow"]}>Готово для скріншоту</p>
            <h2>Графік чергувань</h2>
          </div>
          <span>{readyScheduleRows.length} днів</span>
        </div>

        {readyScheduleRows.length > 0 ? (
          <div className={css["readySchedule"]}>
            {readyScheduleRows.map((row) => {
              return (
                <article
                  className={css["readyDay"]}
                  key={row.dutySchedule.id}
                >
                  <div className={css["readyDayNumber"]}>
                    День {row.dutySchedule.day}
                  </div>

                  <div className={css["readyTeams"]}>
                    {row.membersByTeam.length > 0 ? (
                      row.membersByTeam.map((team) => {
                        return (
                          <div
                            className={css["readyTeam"]}
                            key={team.teamNumber}
                          >
                            <strong>Бригада {team.teamNumber}</strong>
                            <span>
                              {team.dutyMembers
                                .map((member) => member?.fullName)
                                .join(", ")}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className={css["readyEmpty"]}>
                        Чергових не призначено
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={css["emptyState"]}>
            Додайте дні та розподіліть учасників, щоб отримати готовий графік.
          </div>
        )}
      </section>
    </main>
  );
};

export default DutyScheduleManager;

"use client";

import { FormEvent, useMemo, useState } from "react";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useMembers } from "@/hooks";
import { Gender, Member } from "@/types/members";
import { parseImportedMember } from "@/utils/jsonImportParsers";
import css from "./MembersManager.module.css";

type MemberFormState = Omit<Member, "id">;

const initialFormState: MemberFormState = {
  fullName: "",
  gender: "male",
  phoneNumber: "",
  email: "",
  notes: "",
  teamNumber: 1,
};

const genderLabels: Record<Gender, string> = {
  male: "Чоловіча",
  female: "Жіноча",
};

const normalizeTeamNumber = (value: number) => {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.trunc(value);
};

const MembersManager = () => {
  const {
    sortedMembers,
    membersByTeamNumber,
    addMember,
    removeMember,
    updateMember,
    setMembers,
    membersCount,
  } = useMembers();
  const [formState, setFormState] = useState<MemberFormState>(initialFormState);

  const teamColumns = useMemo(() => {
    return Object.entries(membersByTeamNumber)
      .map(([teamNumber, members]) => {
        return {
          teamNumber: Number(teamNumber),
          members: [...members].sort((firstMember, secondMember) => {
            return firstMember.fullName.localeCompare(
              secondMember.fullName,
              "uk",
            );
          }),
        };
      })
      .sort(
        (firstTeam, secondTeam) => firstTeam.teamNumber - secondTeam.teamNumber,
      );
  }, [membersByTeamNumber]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = formState.fullName.trim();

    if (!fullName) {
      return;
    }

    addMember({
      ...formState,
      id: "",
      fullName,
      phoneNumber: formState.phoneNumber?.trim(),
      email: formState.email?.trim(),
      notes: formState.notes?.trim(),
      teamNumber: normalizeTeamNumber(formState.teamNumber),
    });

    setFormState(initialFormState);
  };

  const updateFormValue = <Field extends keyof MemberFormState>(
    field: Field,
    value: MemberFormState[Field],
  ) => {
    setFormState((currentFormState) => {
      return {
        ...currentFormState,
        [field]: value,
      };
    });
  };

  const updateMemberField = <Field extends keyof Member>(
    memberId: string,
    field: Field,
    value: Member[Field],
  ) => {
    updateMember(memberId, {
      [field]: value,
    });
  };

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Учасники</p>
          <h1 className={css["title"]}>Список учасників</h1>
        </div>
        <div className={css["counter"]}>{membersCount}</div>
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Додати учасника</h2>
        </div>

        <form className={css["form"]} onSubmit={handleSubmit}>
          <label className={css["field"]}>
            <span>Імʼя та прізвище</span>
            <input
              required
              value={formState.fullName}
              onChange={(event) =>
                updateFormValue("fullName", event.target.value)
              }
              placeholder="Наприклад: Іван Петренко"
            />
          </label>

          <label className={css["field"]}>
            <span>Стать</span>
            <select
              value={formState.gender}
              onChange={(event) =>
                updateFormValue("gender", event.target.value as Gender)
              }
            >
              <option value="male">Чоловіча</option>
              <option value="female">Жіноча</option>
            </select>
          </label>

          <label className={css["field"]}>
            <span>Бригада</span>
            <input
              min={1}
              type="number"
              value={formState.teamNumber}
              onChange={(event) =>
                updateFormValue(
                  "teamNumber",
                  normalizeTeamNumber(Number(event.target.value)),
                )
              }
            />
          </label>

          <label className={css["field"]}>
            <span>Телефон</span>
            <input
              value={formState.phoneNumber}
              onChange={(event) =>
                updateFormValue("phoneNumber", event.target.value)
              }
              placeholder="+380..."
            />
          </label>

          <label className={css["field"]}>
            <span>Email</span>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateFormValue("email", event.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <button className={css["submitButton"]} type="submit">
            Додати
          </button>
        </form>
      </section>

      <JsonStringImport
        arrayKeys={["members"]}
        description="Встав JSON-масив учасників або обʼєкт з data.members. Поточний список учасників буде замінено імпортованим масивом."
        example={`[
  {
    "fullName": "Іван Петренко",
    "gender": "male",
    "phoneNumber": "+380000000000",
    "email": "ivan@example.com",
    "notes": "",
    "teamNumber": 1
  }
]`}
        parseItem={parseImportedMember}
        title="Імпорт учасників з JSON"
        onImport={setMembers}
      />

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Таблиця учасників</h2>
        </div>

        {sortedMembers.length > 0 ? (
          <div className={css["tableWrapper"]}>
            <table className={css["table"]}>
              <thead>
                <tr>
                  <th>Імʼя та прізвище</th>
                  <th>Стать</th>
                  <th>Бригада</th>
                  <th>Телефон</th>
                  <th>Email</th>
                  <th>Нотатки</th>
                  <th aria-label="Дії" />
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => {
                  return (
                    <tr key={member.id}>
                      <td>
                        <input
                          value={member.fullName}
                          onChange={(event) =>
                            updateMemberField(
                              member.id,
                              "fullName",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={member.gender}
                          onChange={(event) =>
                            updateMemberField(
                              member.id,
                              "gender",
                              event.target.value as Gender,
                            )
                          }
                        >
                          <option value="male">Чоловіча</option>
                          <option value="female">Жіноча</option>
                        </select>
                      </td>
                      <td>
                        <input
                          min={1}
                          type="number"
                          value={member.teamNumber}
                          onChange={(event) =>
                            updateMemberField(
                              member.id,
                              "teamNumber",
                              normalizeTeamNumber(Number(event.target.value)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={member.phoneNumber ?? ""}
                          onChange={(event) =>
                            updateMemberField(
                              member.id,
                              "phoneNumber",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          value={member.email ?? ""}
                          onChange={(event) =>
                            updateMemberField(
                              member.id,
                              "email",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={member.notes ?? ""}
                          onChange={(event) =>
                            updateMemberField(
                              member.id,
                              "notes",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className={css["deleteButton"]}
                          type="button"
                          onClick={() => removeMember(member.id)}
                        >
                          Видалити
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={css["emptyState"]}>Поки немає доданих учасників.</div>
        )}
      </section>

      <section className={css["section"]}>
        <div className={css["sectionHeader"]}>
          <h2>Розподіл по бригадах</h2>
        </div>

        {teamColumns.length > 0 ? (
          <div className={css["teamsGrid"]}>
            {teamColumns.map((team) => {
              return (
                <article className={css["teamColumn"]} key={team.teamNumber}>
                  <div className={css["teamHeader"]}>
                    <h3>Бригада {team.teamNumber}</h3>
                    <span>{team.members.length}</span>
                  </div>

                  <ul className={css["teamMembers"]}>
                    {team.members.map((member) => {
                      return (
                        <li className={css["teamMember"]} key={member.id}>
                          <span>{member.fullName}</span>
                          <small>{genderLabels[member.gender]}</small>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={css["emptyState"]}>
            Додайте учасників, щоб побачити бригади.
          </div>
        )}
      </section>
    </main>
  );
};

export default MembersManager;

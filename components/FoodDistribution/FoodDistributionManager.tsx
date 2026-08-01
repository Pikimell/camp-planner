"use client";

import { type CSSProperties, type PointerEvent, useMemo, useState } from "react";
import JsonStringImport from "@/components/JsonStringImport/JsonStringImport";
import { useDutySchedule, useMeals, useMembers } from "@/hooks";
import { parseImportedFoodAssignment } from "@/utils/jsonImportParsers";
import css from "./FoodDistributionManager.module.css";

type ColumnKey =
  | "product"
  | "amount"
  | "weight"
  | "assigned"
  | "remaining"
  | "actions"
  | `member:${string}`;

const defaultColumnWidths: Record<Exclude<ColumnKey, `member:${string}`>, number> =
  {
    product: 240,
    amount: 96,
    weight: 86,
    assigned: 110,
    remaining: 110,
    actions: 160,
  };

const memberColumnDefaultWidth = 190;
const minColumnWidth = 72;

const isFixedColumnKey = (
  key: ColumnKey,
): key is keyof typeof defaultColumnWidths => {
  return !key.startsWith("member:");
};

const formatNumber = (value: number) => {
  const roundedValue = Math.round(value * 100) / 100;

  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace(".", ",");
};

const normalizeAmount = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value * 100) / 100;
};

const getColumnStyle = (width: number, extraStyles?: CSSProperties) => {
  return {
    ...extraStyles,
    minWidth: width,
    maxWidth: width,
    width,
  };
};

const FoodDistributionManager = () => {
  const { sortedMembers } = useMembers();
  const { getRequiredIngredients, sortedIngredients } = useMeals();
  const {
    addFoodAssignment,
    foodAssignments,
    removeFoodAssignment,
    setFoodAssignments,
    updateFoodAssignment,
  } = useDutySchedule();
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [columnWidths, setColumnWidths] = useState<Partial<Record<ColumnKey, number>>>(
    {},
  );

  const requiredIngredients = useMemo(() => {
    return getRequiredIngredients();
  }, [getRequiredIngredients]);

  const teamOptions = useMemo(() => {
    return [...new Set(sortedMembers.map((member) => member.teamNumber))].sort(
      (firstTeam, secondTeam) => firstTeam - secondTeam,
    );
  }, [sortedMembers]);

  const activeTeam = teamOptions.includes(selectedTeam)
    ? selectedTeam
    : (teamOptions[0] ?? 0);

  const visibleMembers = useMemo(() => {
    return sortedMembers.filter((member) => member.teamNumber === activeTeam);
  }, [activeTeam, sortedMembers]);

  const getColumnWidth = (key: ColumnKey) => {
    if (isFixedColumnKey(key)) {
      return columnWidths[key] ?? defaultColumnWidths[key];
    }

    return columnWidths[key] ?? memberColumnDefaultWidth;
  };

  const productWidth = getColumnWidth("product");
  const amountWidth = getColumnWidth("amount");
  const weightWidth = getColumnWidth("weight");
  const amountLeftOffset = productWidth;
  const weightLeftOffset = productWidth + amountWidth;

  const productStickyStyle = getColumnStyle(productWidth, { left: 0 });
  const amountStickyStyle = getColumnStyle(amountWidth, { left: amountLeftOffset });
  const weightStickyStyle = getColumnStyle(weightWidth, { left: weightLeftOffset });

  const startColumnResize = (
    event: PointerEvent<HTMLButtonElement>,
    key: ColumnKey,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = getColumnWidth(key);

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const nextWidth = Math.max(
        minColumnWidth,
        Math.round(startWidth + moveEvent.clientX - startX),
      );

      setColumnWidths((currentWidths) => ({
        ...currentWidths,
        [key]: nextWidth,
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  const renderResizableHeader = (
    label: string,
    key: ColumnKey,
    className: string,
    style?: CSSProperties,
  ) => {
    return (
      <th className={className} style={style}>
        <span className={css["columnTitle"]}>{label}</span>
        <button
          aria-label={`Змінити ширину колонки ${label}`}
          className={css["resizeHandle"]}
          type="button"
          onPointerDown={(event) => startColumnResize(event, key)}
        />
      </th>
    );
  };

  const visibleIngredients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return sortedIngredients;
    }

    return sortedIngredients.filter((ingredient) => {
      return `${ingredient.name} ${ingredient.unit}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [search, sortedIngredients]);

  const assignmentsByCell = useMemo(() => {
    return new Map(
      foodAssignments.map((assignment) => [
        `${assignment.ingredientId}:${assignment.memberId}`,
        assignment,
      ]),
    );
  }, [foodAssignments]);

  const getAssignedAmount = (ingredientId: string, memberId: string) => {
    return assignmentsByCell.get(`${ingredientId}:${memberId}`)?.totalAmount ?? 0;
  };

  const getIngredientAssignedAmount = (ingredientId: string) => {
    return foodAssignments
      .filter((assignment) => {
        return (
          assignment.ingredientId === ingredientId &&
          visibleMembers.some((member) => member.id === assignment.memberId)
        );
      })
      .reduce((total, assignment) => total + assignment.totalAmount, 0);
  };

  const getMemberWeight = (memberId: string) => {
    return foodAssignments.reduce((total, assignment) => {
      if (assignment.memberId !== memberId) {
        return total;
      }

      const ingredient = sortedIngredients.find(
        (item) => item.id === assignment.ingredientId,
      );

      return total + assignment.totalAmount * (ingredient?.weight ?? 0);
    }, 0);
  };

  const handleAmountChange = (
    ingredientId: string,
    memberId: string,
    value: number,
  ) => {
    const amount = normalizeAmount(value);
    const assignment = assignmentsByCell.get(`${ingredientId}:${memberId}`);

    if (amount === 0) {
      if (assignment) {
        removeFoodAssignment(assignment.id);
      }

      return;
    }

    if (assignment) {
      updateFoodAssignment(assignment.id, {
        totalAmount: amount,
        currentAmount: amount,
      });
      return;
    }

    addFoodAssignment({
      id: "",
      ingredientId,
      memberId,
      totalAmount: amount,
      currentAmount: amount,
    });
  };

  const distributeEvenly = (ingredientId: string, amount: number) => {
    if (visibleMembers.length === 0 || amount <= 0) {
      return;
    }

    const baseAmount = Math.floor((amount / visibleMembers.length) * 100) / 100;
    const distributedBase = baseAmount * visibleMembers.length;
    const remainder = normalizeAmount(amount - distributedBase);

    visibleMembers.forEach((member, index) => {
      handleAmountChange(
        ingredientId,
        member.id,
        normalizeAmount(baseAmount + (index === 0 ? remainder : 0)),
      );
    });
  };

  const clearIngredientAssignments = (ingredientId: string) => {
    foodAssignments
      .filter((assignment) => {
        return (
          assignment.ingredientId === ingredientId &&
          visibleMembers.some((member) => member.id === assignment.memberId)
        );
      })
      .forEach((assignment) => removeFoodAssignment(assignment.id));
  };

  const totalRequiredWeight = sortedIngredients.reduce((total, ingredient) => {
    const requiredAmount = requiredIngredients[ingredient.id]?.amount ?? 0;
    return total + requiredAmount * ingredient.weight;
  }, 0);

  const totalAssignedAmount = foodAssignments
    .filter((assignment) => {
      return visibleMembers.some((member) => member.id === assignment.memberId);
    })
    .reduce((total, assignment) => {
      return total + assignment.totalAmount;
    }, 0);

  return (
    <main className={css["page"]}>
      <section className={css["header"]}>
        <div>
          <p className={css["eyebrow"]}>Розподіл продуктів</p>
          <h1 className={css["title"]}>Хто що несе</h1>
        </div>

        <div className={css["summary"]}>
          <div>
            <span>{sortedIngredients.length}</span>
            <small>продуктів</small>
          </div>
          <div>
            <span>{formatNumber(totalRequiredWeight)}</span>
            <small>кг орієнтовно</small>
          </div>
          <div>
            <span>{formatNumber(totalAssignedAmount)}</span>
            <small>од. розподілено</small>
          </div>
        </div>
      </section>

      <section className={css["section"]}>
        <div className={css["toolbar"]}>
          <label className={css["searchField"]}>
            <span>Пошук продукту</span>
            <input
              type="search"
              value={search}
              placeholder="Наприклад, рис або тушенка"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className={css["teamSwitcher"]}>
            <span>Бригада</span>
            <div className={css["teamButtons"]}>
              {teamOptions.map((teamNumber) => {
                const isActive = activeTeam === teamNumber;

                return (
                  <button
                    className={isActive ? css["activeTeamButton"] : ""}
                    key={teamNumber}
                    type="button"
                    onClick={() => setSelectedTeam(teamNumber)}
                  >
                    {teamNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {sortedIngredients.length === 0 ? (
          <div className={css["emptyState"]}>
            Спочатку додайте продукти на сторінці “Продукти”.
          </div>
        ) : visibleMembers.length === 0 ? (
          <div className={css["emptyState"]}>
            Додайте учасників або оберіть іншу бригаду.
          </div>
        ) : (
          <div className={css["tableWrapper"]}>
            <table className={css["distributionTable"]}>
              <thead>
                <tr>
                  {renderResizableHeader(
                    "Продукти",
                    "product",
                    css["productColumn"],
                    productStickyStyle,
                  )}
                  {renderResizableHeader(
                    "Кількість",
                    "amount",
                    css["amountColumn"],
                    amountStickyStyle,
                  )}
                  {renderResizableHeader(
                    "Вага",
                    "weight",
                    css["weightColumn"],
                    weightStickyStyle,
                  )}
                  {visibleMembers.map((member) => {
                    return (
                      <th
                        className={css["memberColumn"]}
                        key={member.id}
                        style={getColumnStyle(
                          getColumnWidth(`member:${member.id}`),
                        )}
                      >
                        <span className={css["columnTitle"]}>
                          {member.fullName}
                        </span>
                        <button
                          aria-label={`Змінити ширину колонки ${member.fullName}`}
                          className={css["resizeHandle"]}
                          type="button"
                          onPointerDown={(event) =>
                            startColumnResize(event, `member:${member.id}`)
                          }
                        />
                      </th>
                    );
                  })}
                  {renderResizableHeader(
                    "Розподілено",
                    "assigned",
                    css["resultColumn"],
                    getColumnStyle(getColumnWidth("assigned")),
                  )}
                  {renderResizableHeader(
                    "Залишок",
                    "remaining",
                    css["resultColumn"],
                    getColumnStyle(getColumnWidth("remaining")),
                  )}
                  {renderResizableHeader(
                    "Дії",
                    "actions",
                    css["actionsColumn"],
                    getColumnStyle(getColumnWidth("actions")),
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleIngredients.map((ingredient) => {
                  const requiredAmount =
                    requiredIngredients[ingredient.id]?.amount ?? 0;
                  const assignedAmount = getIngredientAssignedAmount(ingredient.id);
                  const remainingAmount = normalizeAmount(
                    requiredAmount - assignedAmount,
                  );
                  const rowStatusClass =
                    remainingAmount < 0
                      ? css["overAssignedRow"]
                      : remainingAmount > 0
                        ? css["underAssignedRow"]
                        : css["completeRow"];

                  return (
                    <tr className={rowStatusClass} key={ingredient.id}>
                      <td
                        className={css["productCell"]}
                        style={productStickyStyle}
                      >
                        <span>{ingredient.name}</span>
                        <small>{ingredient.unit}</small>
                      </td>
                      <td style={amountStickyStyle}>
                        {formatNumber(requiredAmount)}
                      </td>
                      <td style={weightStickyStyle}>
                        {formatNumber(ingredient.weight)}
                      </td>
                      {visibleMembers.map((member) => {
                        return (
                          <td
                            key={member.id}
                            style={getColumnStyle(
                              getColumnWidth(`member:${member.id}`),
                            )}
                          >
                            <input
                              min={0}
                              step={0.1}
                              type="number"
                              value={getAssignedAmount(
                                ingredient.id,
                                member.id,
                              )}
                              onChange={(event) =>
                                handleAmountChange(
                                  ingredient.id,
                                  member.id,
                                  Number(event.target.value),
                                )
                              }
                            />
                          </td>
                        );
                      })}
                      <td
                        className={css["resultCell"]}
                        style={getColumnStyle(getColumnWidth("assigned"))}
                      >
                        {formatNumber(assignedAmount)}
                      </td>
                      <td
                        className={css["resultCell"]}
                        style={getColumnStyle(getColumnWidth("remaining"))}
                      >
                        {formatNumber(remainingAmount)}
                      </td>
                      <td
                        className={css["actionsCell"]}
                        style={getColumnStyle(getColumnWidth("actions"))}
                      >
                        <div className={css["rowActions"]}>
                          <button
                            type="button"
                            onClick={() =>
                              distributeEvenly(ingredient.id, requiredAmount)
                            }
                          >
                            Порівну
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              clearIngredientAssignments(ingredient.id)
                            }
                          >
                            Очистити
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className={css["productCell"]} style={productStickyStyle}>
                    Загальна вага
                  </td>
                  <td style={amountStickyStyle} />
                  <td style={weightStickyStyle}>
                    {formatNumber(totalRequiredWeight)}
                  </td>
                  {visibleMembers.map((member) => {
                    return (
                      <td
                        key={member.id}
                        style={getColumnStyle(
                          getColumnWidth(`member:${member.id}`),
                        )}
                      >
                        {formatNumber(getMemberWeight(member.id))}
                      </td>
                    );
                  })}
                  <td
                    colSpan={3}
                    style={{
                      width:
                        getColumnWidth("assigned") +
                        getColumnWidth("remaining") +
                        getColumnWidth("actions"),
                    }}
                  />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <JsonStringImport
        arrayKeys={["foodAssignments"]}
        description="Встав JSON-масив розподілу продуктів або обʼєкт з data.foodAssignments. Поточний розподіл продуктів буде замінено імпортованим масивом."
        example={`[
  {
    "memberId": "member-1",
    "ingredientId": "ingredient-1",
    "totalAmount": 2,
    "currentAmount": 2
  }
]`}
        parseItem={parseImportedFoodAssignment}
        title="Імпорт розподілу продуктів з JSON"
        onImport={setFoodAssignments}
      />
    </main>
  );
};

export default FoodDistributionManager;

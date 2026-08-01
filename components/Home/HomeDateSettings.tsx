"use client";

import { useSettings } from "@/hooks";
import css from "./Home.module.css";

const HomeDateSettings = () => {
  const { endDate, endPoint, startDate, startPoint, updateSettings } =
    useSettings();
  const hasInvalidRange = Boolean(startDate && endDate && startDate > endDate);

  return (
    <section className={css["dateSettings"]}>
      <div className={css["dateSettingsHeader"]}>
        <div>
          <p className={css["eyebrow"]}>Налаштування походу</p>
          <h2>Дати і маршрут</h2>
        </div>
      </div>

      <div className={css["dateFields"]}>
        <label className={css["dateField"]}>
          <span>Дата початку</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              updateSettings({ startDate: event.target.value })
            }
          />
        </label>

        <label className={css["dateField"]}>
          <span>Дата завершення</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => updateSettings({ endDate: event.target.value })}
          />
        </label>

        <label className={css["dateField"]}>
          <span>Точка старту</span>
          <input
            type="text"
            value={startPoint}
            placeholder="Наприклад, село Ясіня"
            onChange={(event) =>
              updateSettings({ startPoint: event.target.value })
            }
          />
        </label>

        <label className={css["dateField"]}>
          <span>Кінцева точка</span>
          <input
            type="text"
            value={endPoint}
            placeholder="Наприклад, Мукачево"
            onChange={(event) => updateSettings({ endPoint: event.target.value })}
          />
        </label>
      </div>

      {hasInvalidRange ? (
        <div className={css["dateError"]}>
          Дата початку не може бути пізнішою за дату завершення.
        </div>
      ) : null}
    </section>
  );
};

export default HomeDateSettings;

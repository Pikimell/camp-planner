"use client";

import { useState } from "react";
import css from "./JsonStringImport.module.css";

type JsonStringImportProps<Item> = {
  arrayKeys: string[];
  example: string;
  title: string;
  description: string;
  parseItem: (value: unknown) => Item | string;
  onImport: (items: Item[]) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const extractArray = (value: unknown, arrayKeys: string[]) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of arrayKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }

    if (isRecord(value.data) && Array.isArray(value.data[key])) {
      return value.data[key];
    }
  }

  return undefined;
};

const JsonStringImport = <Item,>({
  arrayKeys,
  description,
  example,
  onImport,
  parseItem,
  title,
}: JsonStringImportProps<Item>) => {
  const [jsonValue, setJsonValue] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleImport = () => {
    setError("");
    setMessage("");

    try {
      const parsedJson: unknown = JSON.parse(jsonValue);
      const array = extractArray(parsedJson, arrayKeys);

      if (!array) {
        setError(`Не знайшов масив: ${arrayKeys.join(", ")}`);
        return;
      }

      const parsedItems: Item[] = [];

      for (const item of array) {
        const parsedItem = parseItem(item);

        if (typeof parsedItem === "string") {
          setError(parsedItem);
          return;
        }

        parsedItems.push(parsedItem);
      }

      onImport(parsedItems);
      setMessage(`Імпортовано записів: ${parsedItems.length}`);
    } catch {
      setError("JSON рядок невалідний.");
    }
  };

  return (
    <section className={css["section"]}>
      <div className={css["sectionHeader"]}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <textarea
        className={css["textarea"]}
        value={jsonValue}
        placeholder={example}
        onChange={(event) => setJsonValue(event.target.value)}
      />

      <div className={css["actions"]}>
        <button disabled={!jsonValue.trim()} type="button" onClick={handleImport}>
          Імпортувати
        </button>
        <button type="button" onClick={() => setJsonValue(example)}>
          Вставити приклад
        </button>
      </div>

      {error ? <div className={css["error"]}>{error}</div> : null}
      {message ? <div className={css["success"]}>{message}</div> : null}
    </section>
  );
};

export default JsonStringImport;

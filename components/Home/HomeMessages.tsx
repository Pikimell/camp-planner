"use client";

import { useMemo, useState } from "react";
import { useSettings } from "@/hooks";
import css from "./Home.module.css";

type MessageKey =
  | "intro"
  | "departure"
  | "route"
  | "food"
  | "gear"
  | "equipment"
  | "expenses";

type MessageContext = {
  startDate: string;
  endDate: string;
  startPoint: string;
  endPoint: string;
  departureDate: string;
  returnArrivalDate: string;
  dateRange: string;
  routeLabel: string;
};

type StudentMessage = {
  id: MessageKey;
  title: string;
  text: (context: MessageContext) => string;
};

const formatDate = (date: string) => {
  if (!date) {
    return "дату ще не вказано";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

const shiftDate = (date: string, days: number) => {
  if (!date) {
    return "";
  }

  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createDateContext = (
  startDate: string,
  endDate: string,
  startPoint: string,
  endPoint: string,
): MessageContext => {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  const departureDate = formatDate(shiftDate(startDate, -1));
  const returnArrivalDate = formatDate(shiftDate(endDate, 1));
  const formattedStartPoint = startPoint.trim() || "точку старту ще не вказано";
  const formattedEndPoint = endPoint.trim() || "кінцеву точку ще не вказано";

  return {
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    startPoint: formattedStartPoint,
    endPoint: formattedEndPoint,
    departureDate,
    returnArrivalDate,
    dateRange:
      startDate && endDate
        ? `${formattedStartDate} - ${formattedEndDate}`
        : "дати походу ще не вказані",
    routeLabel:
      startPoint.trim() && endPoint.trim()
        ? `${formattedStartPoint} - ${formattedEndPoint}`
        : "маршрут ще не вказано",
  };
};

const messages: StudentMessage[] = [
  {
    id: "intro",
    title: "Стартова інформація",
    text: ({ dateRange, routeLabel }) =>
      `Доброго ранку, дорогі друзі. Мене звуть Олександр Вікторович, і я керуватиму нашим походом. Багато хто з вас мене знає, з рештою обов'язково познайомимося під час подорожі.

Похід заплановано на ${dateRange}. Маршрут: ${routeLabel}. Інформації буде багато, тому я надсилатиму її в цьому каналі частинами, щоб усім було простіше орієнтуватися.

На цьому етапі ми вже сплатили квитки, дозволи, стоянки, колективне спорядження та виконали багато підготовчої роботи. Тому якщо хтось раптом відмовиться від участі, на жаль, ми вже не зможемо повернути гроші за поїздку.

Велике прохання заздалегідь вирішити всі питання з навчанням, роботою та іншими справами. Також бережіть здоров'я, щоб поїхати з нами. Ми на вас дуже чекаємо.`,
  },
  {
    id: "departure",
    title: "Зустріч і дорога",
    text: ({
      departureDate,
      endDate,
      endPoint,
      returnArrivalDate,
      startDate,
      startPoint,
    }) =>
      `Тепер про плани поїздки.

Зустрічаємося на центральному залізничному вокзалі на сходах ${departureDate} о 19:00. Наш поїзд відходить о 20:00, тому дуже прошу не запізнюватися: поїзд нікого не чекає.

З документів усім потрібно мати паспорт. Студентам обов'язково мати студентський квиток.

Не забудьте воду та їжу в дорогу. Ми приїжджаємо ${startDate} і починаємо маршрут з ${startPoint}.

Завершення маршруту планується в ${endPoint}. Зворотний виїзд планується ${endDate}, орієнтовно о 18:00. Приїзд до Дніпра - ${returnArrivalDate}, орієнтовно о 12:45. План може коригуватися залежно від погоди та стану групи.`,
  },
  {
    id: "route",
    title: "Маршрут і погода",
    text: ({ endPoint, startPoint }) =>
      `Після приїзду ми починаємо рух з ${startPoint}. Завершити маршрут плануємо в ${endPoint}. Якщо коротко, маршрут пролягає через гірську частину з красивими краєвидами, стоянками, прогулянками без рюкзаків і спокійним темпом.

Тривалість переходів, місця стоянок і ночівель будемо коригувати залежно від стану групи та погодних умов. Ми нікуди не поспішаємо: це не спортивний похід, наша мета - добре провести час і повернутися в хорошому настрої.

Щодо можливого похолодання: погода в горах мінлива, але ми собі не вороги. Якщо будуть сильні дощі або холод, спустимося в селище чи на туристичну базу, де є тепло, душ, ліжка та інші радості цивілізації.`,
  },
  {
    id: "food",
    title: "Продукти і харчування",
    text: () =>
      `Щодо продуктів та харчування.

На поїзд потрібно мати власну їжу та воду. Для самого походу кожен отримає окремий список продуктів: приблизно банки тушонки, крупи, ковбаса тощо. Ці продукти потрібно буде взяти з собою, з них ми готуватимемо сніданки, обіди та вечері.

Також надішлемо рекомендації, як краще запакувати продукти, щоб вони не зіпсувалися і їх було зручно нести.

Голодувати не будемо. Для зручності приготування розіб'ємося на бригади й будемо по черзі чергувати.`,
  },
  {
    id: "gear",
    title: "Одяг",
    text: () =>
      `Щодо одягу.

У вас має бути мінімум той одяг, у якому ви йдете: спортивні штани, кросівки або трекінгове взуття, футболка та кофта. Також потрібен окремий комплект для сну, краще теплий спортивний костюм.

Для взуття ідеально мати гірські черевики або міцні кросівки. Для табору краще взяти крокси або гумові шльопанці. За бажанням можна взяти ще одну легку пару взуття, але пам'ятайте: усе це потрібно нести.

Куртка краще тепла, з утеплювачем. Також потрібні шапка або кепка, кілька футболок і кілька пар шкарпеток. Головне - не брати зайвого. Обов'язково візьміть накидку від дощу.`,
  },
  {
    id: "equipment",
    title: "Спорядження",
    text: () =>
      `Тепер про спорядження.

Найперше питання - де його взяти. Найпростіший варіант: запитати у знайомих. Досвід показує, що за кілька днів пошуків спорядження зазвичай знаходиться. Якщо ні - є прокат або можливість купити необхідне за невеликі гроші.

Потрібні рюкзак, спальник, каремат, намет або місце в наметі, сидушка, кружка, ложка та миска. Рюкзак і спальник можна взяти в прокаті. Каремат краще купити, він ще знадобиться в майбутньому.

З наметами розберемося окремо: подивимось, скільки людей, хто з ким хоче жити, і розселимо всіх так, щоб було зручно. Якщо потрібна порада або допомога зі спорядженням - пишіть.`,
  },
  {
    id: "expenses",
    title: "Гроші, зв'язок і ліки",
    text: () =>
      `Щодо можливих витрат.

У горах гроші майже ніде витрачати. Витрати можуть з'явитися вже в цивілізації: будиночки на випадок поганої погоди або бажання відпочити, кафе, магазини, автобуси, екскурсії, аквапарк чи музеї.

Краще мати частину грошей готівкою, бо з банкоматами там не так зручно, як у Дніпрі.

У горах не скрізь є зв'язок, тому попередьте батьків, друзів і знайомих, що іноді вони не зможуть із вами зв'язатися. Також у горах немає розеток, тому за потреби візьміть павербанк.

Аптечку ми беремо, але ніхто не знає ваш організм краще за вас. Якщо ви схильні до застуди, отруєнь, алергій або маєте особисті ліки - подбайте про це заздалегідь.`,
  },
];

const HomeMessages = () => {
  const { endDate, endPoint, startDate, startPoint } = useSettings();
  const [copiedId, setCopiedId] = useState<MessageKey | null>(null);

  const messageContext = useMemo(
    () => createDateContext(startDate, endDate, startPoint, endPoint),
    [endDate, endPoint, startDate, startPoint],
  );

  const handleCopy = async (message: StudentMessage, index: number) => {
    const text = `${index + 1}. ${message.title}\n\n${message.text(messageContext)}`;

    await navigator.clipboard.writeText(text);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <section className={css["messagesSection"]}>
      <div className={css["messagesHeader"]}>
        <div>
          <h2>Важлива інформація</h2>
        </div>
      </div>

      <div className={css["messageList"]}>
        {messages.map((message, index) => (
          <button
            className={css["messageCard"]}
            key={message.id}
            onClick={() => handleCopy(message, index)}
            type="button"
          >
            <span className={css["messageCardTop"]}>
              <span className={css["messageTitleGroup"]}>
                <span className={css["messageNumber"]}>{index + 1}</span>
                <span className={css["messageTitle"]}>{message.title}</span>
              </span>
              <span className={css["messageCopyState"]}>
                {copiedId === message.id
                  ? "Скопійовано"
                  : "Натисни, щоб скопіювати"}
              </span>
            </span>

            <span className={css["messageText"]}>
              {message.text(messageContext)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HomeMessages;

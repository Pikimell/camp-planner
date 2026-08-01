import Link from "next/link";
import css from "./Home.module.css";

const links = [
  {
    href: "/members",
    title: "Учасники",
    description: "Список людей, групи, контакти і команди.",
  },
  {
    href: "/ingredients",
    title: "Продукти",
    description: "Довідник інгредієнтів, одиниць і ваги.",
  },
  {
    href: "/meals",
    title: "Страви",
    description: "Сніданки, обіди, вечері та перекуси.",
  },
  {
    href: "/recipes",
    title: "Рецепти",
    description: "Інгредієнти й кількість для кожної страви.",
  },
  {
    href: "/meal-plan",
    title: "Раціон",
    description: "Меню по днях походу.",
  },
  {
    href: "/duty-schedule",
    title: "Чергування",
    description: "Графік кухарів по днях.",
  },
  {
    href: "/food-distribution",
    title: "Розподіл продуктів",
    description: "Хто несе кожен продукт.",
  },
  {
    href: "/food-pickup-plan",
    title: "Забір продуктів",
    description: "У кого брати продукти перед приготуванням.",
  },
];

const HomeQuickLinks = () => {
  return (
    <section className={css["section"]}>
      <div className={css["sectionHeader"]}>
        <h2>Модулі</h2>
      </div>

      <div className={css["quickLinksGrid"]}>
        {links.map((link) => {
          return (
            <Link className={css["quickLink"]} href={link.href} key={link.href}>
              <span className={css["quickLinkTitle"]}>{link.title}</span>
              <span className={css["quickLinkDescription"]}>
                {link.description}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default HomeQuickLinks;

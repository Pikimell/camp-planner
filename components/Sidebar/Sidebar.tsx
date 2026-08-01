"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import css from "./Sidebar.module.css";

const navigationLinks = [
  { href: "/", label: "Огляд" },
  { href: "/trips", label: "Походи" },
  { href: "/members", label: "Учасники" },
  { href: "/ingredients", label: "Продукти" },
  { href: "/meals", label: "Страви" },
  { href: "/recipes", label: "Рецепти" },
  { href: "/meal-plan", label: "Раціон" },
  { href: "/duty-schedule", label: "Чергування" },
  { href: "/food-distribution", label: "Розподіл продуктів" },
  { href: "/food-pickup-plan", label: "Забір продуктів" },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={css["sidebar"]}>
      <div className={css["brand"]}>
        <span className={css["brandMark"]}>CP</span>
        <span className={css["brandName"]}>Camp Planner</span>
      </div>

      <nav className={css["navigation"]} aria-label="Головна навігація">
        {navigationLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              className={`${css["navLink"]} ${
                isActive ? css["activeNavLink"] : ""
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

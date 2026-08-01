"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import css from "./Sidebar.module.css";

const navigationLinks = [
  { href: "/", label: "Огляд", shortLabel: "О" },
  { href: "/members", label: "Учасники", shortLabel: "У" },
  { href: "/ingredients", label: "Продукти", shortLabel: "П" },
  { href: "/meals", label: "Страви", shortLabel: "С" },
  { href: "/recipes", label: "Рецепти", shortLabel: "Р" },
  { href: "/meal-plan", label: "Раціон", shortLabel: "Рц" },
  { href: "/duty-schedule", label: "Чергування", shortLabel: "Ч" },
  { href: "/food-distribution", label: "Розподіл продуктів", shortLabel: "Рп" },
  { href: "/food-pickup-plan", label: "Забір продуктів", shortLabel: "З" },
  { href: "/final-plan", label: "Фінальний план", shortLabel: "Ф" },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return (
      typeof window !== "undefined" &&
      localStorage.getItem("camp-planner-sidebar") === "collapsed"
    );
  });

  const toggleSidebar = () => {
    setIsCollapsed((currentValue) => {
      const nextValue = !currentValue;
      localStorage.setItem(
        "camp-planner-sidebar",
        nextValue ? "collapsed" : "expanded",
      );

      return nextValue;
    });
  };

  return (
    <aside
      className={`${css["sidebar"]} ${isCollapsed ? css["collapsed"] : ""}`}
    >
      <div className={css["brand"]}>
        <span className={css["brandMark"]}>CP</span>
        <span className={css["brandName"]}>Camp Planner</span>
        <button
          aria-label={isCollapsed ? "Розгорнути меню" : "Згорнути меню"}
          aria-expanded={!isCollapsed}
          className={css["toggleButton"]}
          onClick={toggleSidebar}
          title={isCollapsed ? "Розгорнути меню" : "Згорнути меню"}
          type="button"
        >
          <span className={css["toggleIcon"]} />
        </button>
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
              title={isCollapsed ? link.label : undefined}
            >
              <span className={css["navShortLabel"]}>{link.shortLabel}</span>
              <span className={css["navLabel"]}>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

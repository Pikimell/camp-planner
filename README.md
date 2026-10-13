# Camp Planner

> Plan food and duties for a group camping trip: turn participants, recipes, and ingredients into a daily menu, a shopping list, a fair duty rota, and a "who brings what" plan.

**Live demo:** [camp-planner-eight.vercel.app](https://camp-planner-eight.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38)
![dnd kit](https://img.shields.io/badge/dnd--kit-0F172A)

## The problem

Organizing food for 10+ people over several days usually means spreadsheets, chat threads, and someone forgetting the salt. Camp Planner computes all of it from a few inputs and lets the organizer adjust the result by hand.

## What it does

| Module | Result |
| :-- | :-- |
| **Members** | Participants of the trip |
| **Ingredients / Recipes / Meals** | Reusable food catalog with quantities per person |
| **Meal Plan** | Daily menu across the trip |
| **Shopping list** | Total amount of each ingredient |
| **Food Distribution** | Splits food between participants to carry |
| **Food Pickup Plan** | Who provides each ingredient for every meal |
| **Duty Scheduler** | Fair rota generated automatically, editable with drag and drop |
| **Final Plan** | Everything combined into one view for the group |

Data can be imported from JSON and is persisted locally, so the planner works without a backend.

## Tech stack

- **Next.js (App Router)**, **React**, **TypeScript**
- **Zustand** with `persist` middleware: one store per domain (members, meals, duty schedule, settings)
- **dnd kit** for drag-and-drop duty editing
- CSS Modules

## Project structure

```
app/          # one route per module: members, meals, recipes, meal-plan, duty-schedule, ...
components/   # feature components (DutySchedule, FoodDistribution, MealPlan, ...)
stores/       # Zustand stores
utils/        # JSON import parsers
types/        # domain types
```

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
```

Ukrainian documentation: [README-uk.md](README-uk.md).

## Author

**Volodymyr Pashchenko**, Full-stack Developer · [GitHub](https://github.com/Pikimell) · [LinkedIn](https://www.linkedin.com/in/pashchenko-v-r)

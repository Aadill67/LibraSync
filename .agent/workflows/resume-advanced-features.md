---
description: Resume implementing advanced features for LibraSync
---

# Resume Advanced Features Workflow

## Context
LibraSync is a MERN stack Library Management System at:
- **Backend**: `C:\Users\shaha\OneDrive\Desktop\Final Year Project\backend`
- **Frontend**: `C:\Users\shaha\OneDrive\Desktop\Final Year Project\frontend-part\library-management-system`

## Progress Tracker
Check the task checklist at:
`C:\Users\shaha\.gemini\antigravity\brain\6f1305bd-fc65-4d2a-bb68-027c3bfba631\task.md`

Check the implementation plan at:
`C:\Users\shaha\.gemini\antigravity\brain\6f1305bd-fc65-4d2a-bb68-027c3bfba631\implementation_plan.md`

## Steps to Resume

1. Read the task.md to see which phases/items are completed (`[x]`), in progress (`[/]`), or pending (`[ ]`)
2. Read the implementation_plan.md for the full technical spec
3. Find the first uncompleted phase and resume from there
4. After completing each item, mark it as `[x]` in task.md

## Phase Order
A → B → C → D → E → F → G → H → I → J → K → L → M → N

## Running the Project
// turbo
5. Start backend: `cd backend && npm start`
// turbo
6. Start frontend: `cd frontend-part/library-management-system && npm run dev`

## Key Architecture Notes
- Backend: Express + Mongoose, ESM (`"type": "module"`), JWT auth middleware at `middleware/`
- Frontend: React 19 + MUI 7 + Vite 7, routes in `App.jsx`, sidebar in `Layout.jsx`
- Auth: `verifyToken` + `authorizeRoles` middleware
- API calls: `import API from '../api/axios'`
- Theme: `useThemeMode()` for dark/light mode
- Models: User, Book, BookCategory, BookTransaction
- New models to create: Notification, Review, ActivityLog

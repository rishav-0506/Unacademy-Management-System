# Prompt to Recreate Unacademy (3D Animated Edition)

Build a comprehensive School/Academy Management System (ERP) called "Unacademy". The application must be a high-fidelity recreation of the Supabase dashboard layout, featuring a highly technical, clean, and professional UI, **enhanced with fully 3D animated system design and interactions for every function**.

**Tech Stack:**
*   **Frontend:** React 18+ with Vite
*   **Styling:** Tailwind CSS v4
*   **3D Rendering & Animations:** Three.js, @react-three/fiber, and @react-three/drei (for 3D system design and function animations), alongside Framer Motion (for smooth 2D UI transitions).
*   **Icons:** Lucide React (for all icons)
*   **Backend/Database:** Supabase (for Authentication and PostgreSQL Database)
*   **Architecture:** Full-stack setup using an Express server (`server.ts`) running via `tsx`.

**3D System Design & Animations (CRITICAL REQUIREMENT):**
*   **3D Data Visualization:** Every core function (e.g., adding a student, processing payroll, marking attendance) must trigger a 3D animated sequence representing the data flow and system architecture.
*   **Interactive 3D Elements:** Use `@react-three/fiber` to render 3D models, nodes, and particle effects that react to user inputs and database changes.
*   **System Architecture View:** Include a dedicated "System Design" 3D canvas that visually maps out the database tables, API routes, and client-server interactions in real-time as the user navigates the app.
*   **3D Micro-interactions:** Buttons, form submissions, and data grid updates should feature 3D spatial feedback (e.g., cards flipping in 3D space, success particles, 3D loading spinners).

**Theming & Styling:**
*   Implement a robust theming system using CSS variables with three modes: **Light**, **Dark**, and **Classic Dark**.
*   Use Supabase's signature green (`#3ecf8e`) as the primary accent color, with `#34b27b` for hover states.
*   **Dark theme:** Use `#1c1c1c` for the background, `#181818` for the sidebar, `#232323` for panels, and `#2e2e2e` for borders.
*   **Light theme:** Use `#f3f4f6` for the background, `#ffffff` for the sidebar/panels, and `#e5e7eb` for borders.
*   **Typography:** Use 'Inter' for standard UI text and 'JetBrains Mono' for monospace/code elements.

**Core Layout & Architecture:**
*   **Sidebar:** A collapsible, responsive sidebar on the left with nested, accordion-style navigation menus grouping the modules logically.
*   **Header:** A top navigation bar containing dynamic breadcrumbs, a theme toggle, network status, and a user profile dropdown.
*   **Contexts:** Implement `ThemeContext` (for theme switching), `AuthContext` (for Supabase session management), `ToastContext` (for global success/error notifications), and `ClassContext` (for global academic state).

**Required Modules & Views (Create separate components for each):**
1.  **Auth:** `LoginView` integrated with Supabase Authentication.
2.  **Dashboard:** `DashboardView` featuring real-time 3D analytics, charts, and key metrics overview.
3.  **Database Tools:** `TableEditor` and `SqlEditor` that mimic Supabase's own data management interface, with 3D visualizations of query execution.
4.  **Academic:** `ClassSchedule` and `LiveScheduleView`.
5.  **Staff:** `TeachersView` and `EmployeesView`.
6.  **Tasks:** `TaskManagementView`, `TeacherTaskView`, `TodayTaskView`, and `MyTaskView`.
7.  **Payroll:** `PayrollView`, `SalarySetup`, `BaseSalaryRegistry`, and `DeductionManagement`.
8.  **Attendance:** `StudentAttendanceView` and `AttendanceDashboardView`.
9.  **Communications:** `AbsentCallView`, `AbsentCallLogView`, `EnquiryCallView`, and `EnquiryCallLogView`.
10. **Students:** `StudentsView`, `RegistrationView`, `AdmissionView`, and `StudentFeedbackView`.
11. **Finance:** `FeeCollectionView`, `FeeStructureView`, and `BillingView`.
12. **System & Admin:** `AccessControlView`, `McpConsole`, `ProfileView`, and a robust `SettingsView` that allows users to configure and test their Supabase connection (URL and Anon Key) with proper error handling and timeouts.

**Functionality Requirements:**
*   All views must have full CRUD capabilities (Create, Read, Update, Delete) connected to Supabase tables.
*   Use data grids/tables with sorting, filtering, and pagination for listing records (students, employees, tasks, etc.).
*   Forms must have proper validation, loading states, and use the global Toast system for feedback.
*   Ensure the application is fully responsive, working seamlessly on both desktop and mobile devices.
*   Use `Promise.race` for network checks to ensure the UI never hangs indefinitely if the database is unreachable.

# CourseConnect 📚

CourseConnect is a premium, secure academic resources sharing platform designed for university students to share, discover, and download approved course materials. The platform supports multiple document formats, features a full profile verification workflow for students, and provides a powerful admin console for content moderation.

---

## 🚀 Key Features...

* **Hierarchical Explorer**: Seamlessly browse approved course materials by filtering through University, Department, Level, and Semester.
* **Student Profile Verification**: To maintain academic integrity, uploading materials is restricted to verified users. Students submit their university details and a photo or PDF of their student ID/admission letter, which is then moderated by admins.
* **Moderated Resource Uploads**: Verified students can upload PDF documents, MP4 video lectures, images, or notes. Features strict client-side and server-side size limits (max 10MB) and format validations.
* **Robust Admin Console**:
  * **Dashboard Overview**: Monitor system-wide stats including Total Users, Total Materials, and Pending Verifications.
  * **Material Moderation**: Approve uploads, reject uploads with feedback, or revoke previously approved materials.
  * **Profile Moderation**: View student details, preview uploaded student ID cards/PDF documents inside the dashboard, and approve or reject profiles with custom rejection reasons.
* **Auto Scroll & Refresh Recovery**: Built-in router enhancements to ensure users always land at the top of pages on redirect, and remain logged in on page reload/refresh.
* **High-Performance Architecture**: Uses database views to aggregate course counts, custom SQL RPCs for bundled statistics fetching, and specific indices to eliminate database bottlenecks and slow scans.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Vite, React Router DOM (v6), TanStack Query (v5), Tailwind CSS, Framer Motion (animations), and Lucide React (icons).
* **UI Components**: Built using custom tailwind components on top of Radix UI primitives and shadcn-ui.
* **Backend & Database**: Supabase (Postgres) with Row Level Security (RLS) policies, database triggers, custom storage buckets (`materials`, `identifications`, `avatars`), and functions/views.

---

## 🗄️ Database Schema Outline...

* **Academic Hierarchy**:
  * `universities`: Maps institutions (e.g. UNILAG, UI, OAU) with name and short name.
  * `departments`: Belongs to a university.
  * `levels`: System levels (e.g. 100 Level, 200 Level, etc.) with sorting orders.
  * `department_levels`: Junction table linking valid academic years/levels to specific departments (e.g. Computer Science runs for 4 levels while Engineering runs for 5).
  * `courses`: Belongs to a department and level, specifying the academic semester.
* **User Accounts**:
  * `profiles`: Extends the default Supabase `auth.users` with display names, profile avatars, student identification URLs, and verification states (`unverified`, `pending`, `approved`, `rejected`).
  * `user_roles`: Manages access permissions (assigning `admin` or `user` privileges).
  * `user_agreements`: Audits user agreement to Privacy Policies and Community Guidelines on signup.
* **Academic Resources**:
  * `materials`: Links uploaded PDF, video, image, or text files to specific courses and profiles with moderation states (`pending`, `approved`, `rejected`).

---

## ⚙️ Local Development Setup...

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* Supabase account and database instance

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone <repository_url>
   cd course-connect
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Initialize Database Schema**:
   * Apply the SQL migration scripts located in `supabase/migrations/` sequentially in your Supabase SQL Editor to configure all tables, triggers, storage buckets, RLS policies, views, and functions.
   * Make sure to set up the private `identifications` and public `avatars` and `materials` storage buckets.

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The application will run locally at `http://localhost:5173`.

### Production Build
To build and check the production-optimized files:
```bash
npm run build
```

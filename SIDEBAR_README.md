# Sidebar Navigation - Restricted Area

This document provides an overview of the sidebar navigation system created for the restricted user area.

## Overview

A comprehensive role-based sidebar navigation system has been implemented using shadcn/ui components, matching the design aesthetic of the home page.

## Components Created

### 1. AppSidebar Component (`components/AppSidebar.tsx`)
- **Location**: `/components/AppSidebar.tsx`
- **Purpose**: Main sidebar component with role-based navigation
- **Features**:
  - Dynamic navigation based on user role
  - Collapsible sidebar with icon-only mode
  - User profile dropdown menu
  - Role-specific menu items
  - Integrated sign-out functionality

### 2. Layout Updates (`app/user/layout.tsx`)
- Enhanced header with backdrop blur effect
- Sticky header matching home page design
- Responsive padding for content area

## Role-Based Navigation

The sidebar implements role-based access control with the following structure:

### Navigation Groups

#### 1. **Principal** (Main Dashboard)
- **Tableau de bord** - Available to: national_admin, cluster_admin, cdej_admin, cdej_staff, cdej_monitor
  - Route: `/user`
  - Icon: LayoutDashboard
  - Shows statistics and recent activity

#### 2. **Leçons** (Lessons)
- **Créer une leçon** - Available to: national_admin, cluster_admin, cdej_admin, cdej_staff
  - Route: `/user/lessons/create`
  - Icon: BookPlus
  - Create new lessons for beneficiaries

- **Voir les leçons** - Available to: national_admin, cluster_admin, cdej_admin, cdej_staff, cdej_monitor
  - Route: `/user/lessons`
  - Icon: BookOpen
  - View and manage all lessons

#### 3. **Quiz** (Quizzes)
- **Créer un quiz** - Available to: national_admin, cluster_admin, cdej_admin, cdej_staff
  - Route: `/user/quizzes/create`
  - Icon: FileQuestion
  - Create new quizzes

- **Voir les quiz** - Available to: national_admin, cluster_admin, cdej_admin, cdej_staff, cdej_monitor
  - Route: `/user/quizzes`
  - Icon: List
  - View and manage all quizzes

#### 4. **Administration** (Admin)
- **Gérer les clusters** - Available to: national_admin
  - Route: `/user/admin/clusters`
  - Icon: Building2
  - Manage cluster centers

- **Gérer les CDEJ** - Available to: national_admin, cluster_admin
  - Route: `/user/admin/cdejes`
  - Icon: Users
  - Manage CDEJ centers

- **Gérer les utilisateurs** - Available to: national_admin, cluster_admin, cdej_admin
  - Route: `/user/admin/users`
  - Icon: User2
  - Manage system users

## Pages Created

### Dashboard Pages
1. **`/app/user/page.tsx`** - Main dashboard with statistics cards

### Lesson Pages
2. **`/app/user/lessons/page.tsx`** - Lessons list view
3. **`/app/user/lessons/create/page.tsx`** - Create new lesson form

### Quiz Pages
4. **`/app/user/quizzes/page.tsx`** - Quizzes list view
5. **`/app/user/quizzes/create/page.tsx`** - Create new quiz form

### Admin Pages
6. **`/app/user/admin/clusters/page.tsx`** - Cluster management (national_admin only)
7. **`/app/user/admin/cdejes/page.tsx`** - CDEJ management (national_admin, cluster_admin)
8. **`/app/user/admin/users/page.tsx`** - User management (national_admin, cluster_admin, cdej_admin)

### Settings Page
9. **`/app/user/settings/page.tsx`** - User profile settings with avatar

## Design System

### Colors
The sidebar uses a blue color scheme matching the home page:
- Primary blue: `oklch(0.35 0.15 250)` for active states
- Accent: `oklch(0.95 0.015 250)` for hover states
- Matches the blue-800 color used in buttons and branding

### Components Used
- **shadcn/ui components**:
  - Sidebar (with SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter, etc.)
  - DropdownMenu
  - Card
  - Button
  - Input
  - Label
  - Avatar
  
### Icons (lucide-react)
- LayoutDashboard - Dashboard
- BookOpen, BookPlus - Lessons
- FileQuestion, List - Quizzes
- Building2, Users, User2 - Administration
- Settings, LogOut, ChevronUp, ArrowLeft, Plus - Actions

## Features

### 1. Role-Based Access Control
- Navigation items automatically filter based on user role
- Pages protected with RoleProtection component
- Hierarchical role system

### 2. Responsive Design
- Mobile: Sheet overlay sidebar
- Desktop: Collapsible sidebar with icon-only mode
- Keyboard shortcut (Cmd/Ctrl + B) to toggle sidebar

### 3. User Profile
- Avatar with fallback initials
- Display name and role
- Dropdown menu with:
  - Settings link
  - Sign out functionality

### 4. Active State Indication
- Current page highlighted in navigation
- Matches exact routes and nested routes

### 5. Branding
- Compassion logo in sidebar header
- Consistent blue color theme
- Links back to home page

## Technical Details

### Dependencies Installed
```bash
bunx shadcn@latest add dropdown-menu --yes
bunx shadcn@latest add avatar --yes
```

### Package Manager
Project uses **bun** as the package manager.

### Styling
- Tailwind CSS for utility classes
- CSS variables for theming
- Backdrop blur effects for modern UI
- Consistent spacing and typography

## Future Enhancements

Potential additions:
1. Real data integration with Convex queries
2. Notifications badge on navigation items
3. Search functionality in sidebar
4. Favorites/pinned items
5. Breadcrumb navigation
6. Loading states for async operations
7. Tooltips for icon-only mode
8. Custom themes/color schemes

## Usage

To access the restricted area:
1. Sign in with valid credentials
2. Complete registration if first time
3. Navigate to `/user` route
4. Sidebar automatically shows available navigation based on role
5. Click navigation items to access different sections

## Role Hierarchy

From highest to lowest access:
1. **national_admin** - Full system access
2. **cluster_admin** - Cluster and CDEJ management
3. **cdej_admin** - CDEJ user management
4. **cdej_staff** - Content creation and viewing
5. **cdej_monitor** - View-only access
6. **beneficiary** - Limited access

## Files Modified/Created

### Created:
- `components/AppSidebar.tsx`
- `app/user/page.tsx`
- `app/user/lessons/page.tsx`
- `app/user/lessons/create/page.tsx`
- `app/user/quizzes/page.tsx`
- `app/user/quizzes/create/page.tsx`
- `app/user/admin/clusters/page.tsx`
- `app/user/admin/cdejes/page.tsx`
- `app/user/admin/users/page.tsx`
- `app/user/settings/page.tsx`
- `components/ui/dropdown-menu.tsx` (via shadcn)
- `components/ui/avatar.tsx` (via shadcn)

### Modified:
- `app/user/layout.tsx` - Enhanced header styling
- `app/globals.css` - Updated sidebar color variables

### Deleted:
- `components/Sidenav.tsx` - Empty placeholder file

## Testing Recommendations

1. Test with different user roles
2. Verify role-based navigation filtering
3. Test responsive behavior (mobile/desktop)
4. Verify sidebar collapse/expand functionality
5. Test keyboard shortcuts
6. Verify sign-out functionality
7. Test navigation active states
8. Verify protected routes redirect appropriately


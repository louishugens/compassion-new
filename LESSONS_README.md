# Lessons Feature Documentation

## Overview
The lessons feature allows admins to create educational content for beneficiaries with rich text editing, media uploads, and granular permission controls based on organizational hierarchy.

## Features

### 1. Rich Text Content
- **Rich Text Editor**: Uses React Quill for WYSIWYG editing
- **Formatting Options**: Bold, italic, underline, lists, headings, links, etc.
- **Content Storage**: HTML content stored in Convex database

### 2. Media Support
- **Image Uploads**: Up to 4MB per image via UploadThing
- **Video Uploads**: Up to 32MB per video via UploadThing
- **Preview**: Real-time preview of uploaded media
- **Optional**: Both image and video are optional fields

### 3. Age Groups
Lessons can target multiple age groups:
- 0-5 ans
- 6-10 ans
- 11-15 ans
- 16-18 ans
- 19+ ans

### 4. Permission-Based Scope

#### National Admin
- Can create **national** lessons (visible to all clusters/CDEJs)
- Can create **cluster** lessons for any cluster
- Can create **CDEJ** lessons for any CDEJ

#### Cluster Admin
- Can create **cluster** lessons for their assigned cluster
- Can create **CDEJ** lessons for any CDEJ in their cluster
- Auto-assigned to their cluster

#### CDEJ Admin
- Can create **CDEJ** lessons for their assigned CDEJ only
- Auto-assigned to their CDEJ and cluster
- Cannot change cluster/CDEJ in the form

## Database Schema

### Lessons Table
```typescript
{
  title: string,                    // Lesson title
  description: string,              // Short description
  content: string,                  // Rich text HTML content
  imageUrl?: string,                // Optional image URL from UploadThing
  videoUrl?: string,                // Optional video URL from UploadThing
  ageGroups: string[],              // Target age groups
  scope: 'national' | 'cluster' | 'cdej',
  clusterId?: Id<'clusters'>,       // Required for cluster/cdej scope
  cdejId?: Id<'cdejs'>,            // Required for cdej scope
  isPublished: boolean,             // Draft vs published status
  createdAt: number,                // Timestamp
  createdBy: Id<'users'>,          // Creator user ID
  updatedAt?: number,               // Last update timestamp
  updatedBy?: Id<'users'>,         // Last updater user ID
}
```

### Indexes
- `by_scope`: Query lessons by scope (national/cluster/cdej)
- `by_cluster`: Query lessons by cluster
- `by_cdej`: Query lessons by CDEJ
- `by_created_by`: Query lessons by creator
- `by_is_published`: Query published vs draft lessons

## API Functions

### Mutations

#### `createLesson`
Creates a new lesson with proper permission validation.

**Args:**
- `title`: string
- `description`: string
- `content`: string (HTML)
- `imageUrl?`: string
- `videoUrl?`: string
- `ageGroups`: string[]
- `scope`: 'national' | 'cluster' | 'cdej'
- `clusterId?`: Id<'clusters'>
- `cdejId?`: Id<'cdejs'>
- `isPublished`: boolean

**Returns:** `Id<'lessons'>` - The created lesson ID

**Permissions:**
- Validates user role and organizational assignments
- Ensures admins can only create lessons within their scope
- Throws errors for unauthorized attempts

### Queries

#### `getLessons`
Returns all lessons visible to the current user based on their organizational assignment.

**Args:**
- `isPublished?`: boolean - Filter by published status

**Returns:** Array of lesson objects

**Visibility Rules:**
1. Everyone sees national lessons
2. Users with cluster assignment see cluster lessons
3. Users with CDEJ assignment see CDEJ lessons

#### `getLesson`
Gets a single lesson by ID.

**Args:**
- `lessonId`: Id<'lessons'>

**Returns:** Lesson object or null

#### `getClusters`
Returns all clusters for dropdown selection.

**Returns:** Array of { _id, name, code }

#### `getCdejsByCluster`
Returns CDEJs for a specific cluster.

**Args:**
- `clusterId`: Id<'clusters'>

**Returns:** Array of { _id, name, code }

#### `getCurrentUserInfo`
Returns current user's role and organizational assignments.

**Returns:** { userId, role, clusterId?, cdejId? } or null

## UploadThing Configuration

### Environment Variables
Add these to your `.env.local`:

```env
# UploadThing Configuration
# Get your keys from https://uploadthing.com/dashboard
UPLOADTHING_SECRET=your_uploadthing_secret_here
UPLOADTHING_APP_ID=your_uploadthing_app_id_here
```

**Note:** Make sure to replace the placeholder values with your actual UploadThing credentials.

### File Routes
- `lessonImage`: Images up to 4MB, 1 file max
- `lessonVideo`: Videos up to 32MB, 1 file max

### Setup
1. Sign up at [uploadthing.com](https://uploadthing.com)
2. Create a new app
3. Copy your secret and app ID
4. Add to `.env.local`

## Form Fields

### Required Fields
- Title
- Description
- Content (rich text)
- Age Groups (at least one)
- Scope
- Cluster (if scope is cluster or cdej)
- CDEJ (if scope is cdej)

### Optional Fields
- Image
- Video
- Published status (defaults to false/draft)

## Usage Example

### Creating a National Lesson (National Admin)
1. Navigate to `/user/lessons/create`
2. Fill in title, description, and content
3. Select age groups
4. Choose "National" scope
5. Optionally add image/video
6. Check "Publish immediately" if ready
7. Click "Créer la leçon"

### Creating a CDEJ Lesson (CDEJ Admin)
1. Navigate to `/user/lessons/create`
2. Fill in title, description, and content
3. Select age groups
4. Scope is auto-set to "CDEJ"
5. Cluster and CDEJ are auto-selected and disabled
6. Optionally add image/video
7. Check "Publish immediately" if ready
8. Click "Créer la leçon"

## Validation Rules

1. **Authentication**: User must be authenticated
2. **User Assignment**: User must have an organizational assignment
3. **Scope Validation**:
   - National scope requires `national_admin` role
   - Cluster scope requires `cluster_admin` or `national_admin` role
   - CDEJ scope requires `cdej_admin`, `cluster_admin`, or `national_admin` role
4. **Organizational Validation**:
   - Cluster/CDEJ admins can only create lessons for their assigned organizations
   - National admins can create lessons for any organization
5. **Field Validation**:
   - Cluster ID required for cluster/cdej scope
   - CDEJ ID required for cdej scope
   - At least one age group must be selected

## Future Enhancements
- Lesson editing/updating
- Lesson deletion
- Lesson duplication
- Lesson analytics (views, completions)
- Lesson comments/feedback
- Lesson categories/tags
- Search and filtering
- Lesson scheduling (publish date)
- Version history


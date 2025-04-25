# Add Note Feature Proposal

## Overview

This document outlines a proposal to implement the "Add Note" feature on the note detail page. The feature will allow users to add personal annotations to their notes, with support for text entry, YouTube timestamps, and image attachments.

## Feature Requirements

### Core Functionality

- Add a new card when the "Add Note" button is clicked, positioned below existing cards
- Card should have "Note" title in the lower left corner (blue background, darker blue bold text, rounded corners)
- Display placeholder text "Catch what you're thinking now" in the upper left
- Implement editing and viewing states with appropriate UI elements
- Support basic text input with auto-focus functionality
- Do not save empty notes

### UI Components

- **Card Header**: "Note" label matching existing card styling
- **Text Area**: Full-width input area with placeholder
- **Button Sets**:
  - **Normal View**: Right-aligned Image, Copy, Edit, and Delete buttons
  - **Editing View**: Center-aligned Cancel and Save buttons
  - **Add Note Button**: When clicked while editing, should return focus to current note

### Video Timestamp Integration

- When a note is saved, capture the current timestamp from the video player
- Display the timestamp in blue text in the top right corner of the note in MM:SS format (e.g., "00:45")
- Indent the note content 2 spaces to the left of this timestamp
- Make the timestamp visually distinct from the note content
- Consider making the timestamp clickable to seek to that position in the video

### YouTube Timestamp Support

- Allow entry of timestamps in minutes:seconds format (00:00, 00:30, 01:00)
- Auto-detect timestamp format and convert to clickable links
- When clicked, seek the video to the specified timestamp
- Consider visual indicators for timestamps (icon or styling)

### Image Attachment

- Add Image button with appropriate icon (suggestion: camera icon or image frame icon)
- Support uploading images from device
- Consider size limitations and compression
- Preview attached images within the note

### Responsive Behavior

- Add vertical scrollbar when content exceeds approximately 7 lines
- Ensure consistent display across different screen sizes
- Handle long text entries appropriately

### State Management

- Track editing status of each note
- Maintain hover state for showing action buttons
- Focus management when adding new notes

### Data Persistence

- Save notes to database under user account (once login feature is supported)
- Temporarily save under default developer user
- Support for editing existing notes
- Handle deletion with appropriate confirmation

### Delete Note Functionality

- **Confirmation Dialog**:

  - Display modal overlay with semi-transparent background
  - Centered alert box with "Are you sure you want to delete this content?" message
  - "Tip" text label in the upper left corner of the dialog
  - Red "Delete" button positioned in the lower left
  - Gray "Cancel" button to the left of the Delete button
  - "X" close button in the upper right corner
  - All buttons should close the dialog, but only Delete performs the deletion

- **Delete Implementation Options**:

  - **Hard Delete**: Permanently remove the note from the database
    - Pro: Simpler implementation, reduces database size
    - Con: No recovery option, potentially frustrating for users who delete by accident
  - **Soft Delete**: Add a "deleted" flag to the note and filter from UI
    - Pro: Allows for potential recovery feature, enables trash management
    - Con: Increases database complexity and size, requires periodic cleanup

- **Recommended Approach**: Implement hard delete initially for simplicity, but design the database schema to support soft delete in the future if needed. This allows for quicker implementation while keeping options open for future enhancements.

## Technical Implementation

### UI Component Structure

```jsx
<NoteCard
  isEditing={boolean}
  content={string}
  timestamp={Date}
  videoTimestamp={string} // MM:SS format from video player
  attachments={Array}
  onSave={function}
  onCancel={function}
  onDelete={function}
/>
```

### Suggested Image Button Icon

Options:

1. Simple frame icon: □ with mountain/sun icon inside
2. Camera icon: 📷
3. Image icon: 🖼️

Recommended: A clean, minimal image frame icon that matches the application's design system.

### YouTube Timestamp Detection

Implement regex pattern matching for timestamp formats:

- `\b([0-9]{1,2}:[0-9]{2})\b` for detecting MM:SS format

Convert detected timestamps to clickable spans with onClick handlers to seek video.

### Empty Note Handling

- Disable Save button when note is empty
- Provide visual feedback (subtle color change) when attempting to save empty note
- Auto-dismiss empty note card when user clicks outside

### Scrollbar Implementation

- Use CSS `overflow-y: auto` with max-height property
- Approximate max-height to accommodate 7 lines of text
- Ensure scrollbar styling matches application design

### Focus Management Logic

```javascript
// Pseudocode for Add Note button click handler
function handleAddNoteClick() {
  if (existingNoteInEditMode) {
    setFocusToExistingNote();
  } else {
    createNewNoteCard();
    setFocusToNewNote();
  }
}
```

### Autosave Implementation

- Implement autosave functionality to prevent data loss while editing notes
- Save draft state to local storage during editing
- Consider backend syncing for longer editing sessions
- Restore draft content if editing is interrupted

### Error Handling & Edge Cases

- **Network Failures**: Implement local storage backup to prevent data loss when saving fails
- **Concurrent Editing**: Handle potential conflicts if notes are edited across multiple devices
- **Content Limits**: Define maximum note length and appropriate error messages
- **Invalid Input**: Sanitize user input to prevent XSS attacks and database issues
- **Rate Limiting**: Prevent rapid creation of many notes (potential spam/abuse)

### Analytics & Tracking

- Track note creation, editing, and deletion events
- Measure average note length and content type (plain text vs. with timestamps/images)
- Monitor feature adoption and usage patterns
- Identify potential usability issues through interaction tracking

### Undo Functionality

If implementing hard delete:

- Consider adding a temporary "Undo" toast notification after deletion
- Cache recently deleted notes in memory for quick restoration
- Limit undo window to 5-10 seconds to balance usability and complexity

## User Experience Considerations

### Keyboard Shortcuts

- Esc: Cancel editing
- Ctrl/Cmd+Enter: Save note
- Tab: Navigate between notes

### Accessibility

- Ensure proper ARIA attributes for screen readers
- Keyboard navigability for all functions
- Sufficient color contrast for text elements

### Feedback Mechanisms

- Visual feedback when saving/deleting notes
- Appropriate cursor styles to indicate editable areas
- Hover states for interactive elements

## Database Schema Proposal

```
Note {
  id: UUID (primary key)
  userId: UUID (foreign key to User table)
  noteId: UUID (foreign key to parent Note)
  content: TEXT
  videoTimestamp: STRING (MM:SS format captured at creation)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
  hasAttachments: BOOLEAN
  attachments: JSONB (for storing image metadata)
  isDeleted: BOOLEAN (for potential soft delete implementation)
  tags: ARRAY[STRING] (for potential tagging functionality)
}
```

## Open Questions & Decisions

1. **Timestamp Implementation**:

   - Should timestamps be automatically converted to links or require specific formatting?
   - How should timestamp links behave if multiple videos are present?
   - Should there be a visual indicator for timestamps?

2. **Image Attachment Handling**:

   - What are the size/format limitations for attached images?
   - How should images be displayed within notes (inline, thumbnails, etc.)?
   - Should we support multiple image attachments per note?

3. **Database Schema**:

   - What fields are required for the note object?
   - How should we handle offline notes before they're synced?
   - What indexing strategy should be used for efficient retrieval?

4. **Rich Text Support**:

   - Should notes support formatting (bold, italic, lists, etc.)?
   - If so, what library should be used for rich text editing?
   - How would rich text impact the database schema?

5. **Mobile Experience**:

   - How should the note UI adapt for smaller screens?
   - Should any functionality be modified for touch interfaces?

6. **Performance Considerations**:

   - How to handle large numbers of notes efficiently?
   - Should notes be loaded lazily or all at once?
   - Caching strategy for offline access?

7. **Integration with Other Features**:

   - How should notes interact with the summarization feature?
   - Should notes be included in exports?
   - Can AI features interact with user notes?

8. **Deletion Implementation**:

   - Do we need a recycle bin/trash feature for recovering deleted notes?
   - Should we implement bulk deletion for multiple notes?
   - How long should we keep deleted notes if using soft delete?

9. **Security Considerations**:

   - Do we need encryption for sensitive note content?
   - How do we ensure proper access controls if notes contain private information?

10. **Autosave Implementation**:

    - How frequently should autosave occur during note editing?
    - Should there be visual indicators when autosaving?
    - Should we keep autosave history or just the most recent version?
    - How should we handle conflicts between autosaved content and manually saved content?

11. **Version History**:

    - Is version history needed for notes?
    - If so, how many versions should be retained?
    - Should users be able to view and restore previous versions?
    - How would version history impact storage requirements?

12. **Regulatory Compliance**:

    - Are there GDPR or other privacy regulations that affect how we handle note data?
    - Do we need to implement data portability features?
    - What data retention policies should be applied to notes?
    - Should users be able to request deletion of all their notes at once?

13. **Note Organization**:

    - Should we implement a tagging system for notes?
    - If so, should tags be predefined or user-created?
    - Do we need hierarchical organization (folders/categories)?
    - Should notes be searchable, and if so, how should search be implemented?

14. **Collaboration Features**:
    - Should multiple users be able to view/edit the same notes?
    - If collaboration is needed, how should we handle concurrent editing?
    - Should there be different permission levels (view-only, edit, etc.)?
    - How would we handle notifications for collaborative edits?

## Next Steps

1. Review and finalize requirements based on feedback
2. Create design mockups for the feature
3. Implement prototype to test core functionality
4. Determine database schema and persistence approach
5. Implement YouTube timestamp detection and linking
6. Add image attachment functionality
7. Design and implement deletion confirmation flow
8. Implement video timestamp capture and display
9. Test thoroughly across devices and use cases
10. Document API and component usage

## Technical Dependencies

- Text area component with auto-resize functionality
- Image upload and processing library
- YouTube API integration for timestamp functionality
- Database migration for new note schema
- UI component library for consistent styling
- Modal dialog component for deletion confirmation
- Video player integration for timestamp capture

1. What This App Does
penpal is a web app for writing with AI where you review and accept changes like track changes. You type on the left, chat with AI on the right, and choose which edits to keep.

2. Core Features
- Smart Editor: Create and edit documents in a two-panel layout (document left, AI chat right). A custom in-house implementation coordinates the editor and sidebar to propose, preview, and export final content.
- AI Suggestion Review: Send a prompt and the custom AI engine analyzes the open document, generating granular, in-text highlighted suggestions mapped to exact spans. Review changes in the sidebar and accept/reject individually or in bulk to instantly update the document.

3. Tech Stack
- Framework: Next.js 15
- Database: Convex
- Auth: Clerk
- Feature Provider: Custom implementation for AI suggestion generation, diffing/highlighting, and accept/reject workflow

4. UI Design Style
Clean, split-pane, distraction-free editor inspired by track-changes: left document pane, right AI chat, subtle inline highlights, clear accept/reject controls, and simple bulk actions.
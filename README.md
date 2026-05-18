# MonoForge

A platform for public and private publication of open-source projects.

> [!NOTE]
> ***Not all files have been uploaded to GitHub*** due to some internal errors, so a ZIP archive with the full code has been uploaded to the repository. ( [download zip](https://github.com/lordofsunshine/monoforge/blob/main/monoforge-github-source.zip) )

A page is available on our website: https://monoforge.org/lordofsunshine/monoforge

## Service Updates

1. **Batch file upload**
   Multiple files are now uploaded together in one batch. This creates one commit and one activity event instead of separate events for each file.

2. **Unified repository deletion**
   Repository deletion now works through one shared backend service. This means the UI and API use the same deletion logic.

3. **Full repository cleanup**
   When a repository is deleted, all related data is cleaned up too: files, issues, comments, stars, commits, activity records, and unused file blobs. Storage references are also updated correctly.

4. **Improved service layer**
   Important backend logic has been moved into dedicated services for repositories, files, stars, and issues. This makes the system easier to maintain and more reliable.

5. **Issue creation fix**
   Fixed an error that could appear when creating a discussion without selecting a source file or source line.

6. **Markdown alerts**
   Added support for Markdown alert blocks: NOTE, TIP, IMPORTANT, WARNING, and CAUTION.

7. **Admin page**
   Added a new read-only admin page at `/admin`.

8. **Admin metrics**
   The admin page now shows useful service statistics, including users, repositories, files, issues, stars, storage usage, database usage, and audit events.

9. **Storage path fix**
   Fixed storage path logic so production builds do not include unnecessary dependencies.

10. **UI consistency improvements**
    Improved button sizes, containers, mobile spacing, long names, and empty states for a cleaner and more consistent interface.

11. **Landing page spacing**
    Fixed the spacing between the main CTA section and the “Find public projects” block.

12. **Header alignment**
    Adjusted the header logo position so it aligns better with the hero section.

13. **Hero image visibility**
    Made the `hero.png` background more visible in dark theme.

14. **Auth page improvements**
    Added a hero visual to the right side of the login and register pages. Removed the image border for a cleaner look.

15. **Text link styling**
    Links inside regular text are now easier to notice thanks to a subtle underline/border style.
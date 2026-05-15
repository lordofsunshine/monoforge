# MonoForge

A platform for public and private publication of open-source projects.

> [!NOTE]
> ***Not all files have been uploaded to GitHub*** due to some internal errors, so a ZIP archive with the full code has been uploaded to the repository. ( [download zip](https://github.com/lordofsunshine/monoforge/blob/main/monoforge-github-source.zip) )

A page is available on our website: https://monoforge.org/lordofsunshine/monoforge

## Whats NEW?
1. **Repository links are fixed:** repositories with hyphens in their names now open correctly and no longer cause an error.

2. **File browsing is more reliable:** root folders, nested folders, and different path formats are now handled more smoothly.

3. **API authorization is improved:** protected actions now work more consistently whether the user is logged in or using an API key.

4. **External API requests work better:** requests with valid API keys are no longer blocked for no reason.

5. **Stars are more stable:** starring and unstarring repositories now works more reliably and is more compatible with different tools.

6. **Repository creation is safer:** if something unexpected goes wrong, the site now shows a clear error instead of an empty server error.

7. **Login error messages are clearer:** if a user enters the wrong password too many times, they now see a clear temporary block warning.

8. **Google sign-in was added:** the login and registration pages can now show a `Continue with Google` button.

9. **Google sign-in is fixed:** signing in with Google now works more reliably and no longer triggers the technical `UnknownAction` error.

10. **Local development is smoother:** the project now works better when running through `127.0.0.1` or `localhost`.

11. **Normal project files can now be uploaded:** files like `.sh`, `.exe`, `.dll`, `.jar`, `.bat`, and similar ones can be uploaded if they are part of a repository.

12. **Secret files are now blocked:** files like `.env`, private keys, `.pem`, `.key`, `.p12`, and `.pfx` are blocked, and users see a clear reason why.

13. **Bulk uploads work better:** if some files are not allowed, the rest still upload successfully, while skipped files are shown with a reason.

14. **The homepage is cleaner:** extra decorative and overloaded elements were removed, making the interface calmer and easier to understand.

15. **Mobile spacing is improved:** content on phones no longer sticks to the screen edges.

16. **Main pages are better aligned:** login, registration, docs, settings, and new repository pages now match the main site layout more closely.

17. **Repository deletion warning was added:** before deleting a repository, users are warned that the data cannot be restored from the site and are advised to download a ZIP backup.

18. **README rendering is improved:** images, links, tables, long lines, and code blocks now display more neatly.

19. **README protection is still in place:** Markdown content is still cleaned to protect the site from malicious code.

20. **Localization was expanded:** more parts of the interface are now translated into Russian and English.

21. **Public search is improved:** search is available without logging in and works by repository names, descriptions, users, issues, and file paths.

22. **Private repositories are better protected:** private repositories are now more reliably hidden from other users.

23. **Error messages are improved:** instead of confusing technical failures, the site now returns cleaner and more structured error messages.

24. **Rate limits are still active:** protection against too many requests is still enabled for login, registration, search, uploads, downloads, issues, comments, and stars.

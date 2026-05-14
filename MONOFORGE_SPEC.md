# MonoForge

Минималистичная GitHub-like платформа для хранения, просмотра и публикации проектов. Не клон GitHub, а легкий инженерный архив: черно-белый интерфейс, быстрый просмотр кода, экономное хранение файлов, понятные лимиты и минимум фоновой магии.

## 1. Архитектура проекта

### Стек

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Auth.js / NextAuth
- Node.js runtime для API, файловых операций, sharp и zstd
- Docker Compose для PostgreSQL и локального запуска
- zstd для сжатия текстовых и обычных бинарных файлов
- sharp для оптимизации изображений
- позже: isomorphic-git или simple-git

### Основной принцип

MVP хранит проекты как управляемые файловые снапшоты, а не как полноценные Git-репозитории. Пользователь создает проект, загружает файлы, видит дерево, README, issues, stars и профиль. Git push/pull появляется позже отдельным слоем.

### Слои

```txt
app/
  (public)/
  (auth)/
  dashboard/
  [owner]/[repo]/
  api/
components/
  ui/
  repo/
  issue/
  profile/
lib/
  auth/
  db/
  storage/
  compression/
  images/
  limits/
  rate-limit/
  slug/
prisma/
storage/
  objects/
  repos/
  tmp/
```

### Поток загрузки файла

1. API принимает файл через authenticated route handler.
2. Проверяет лимиты пользователя, проекта, MIME, размер и расширение.
3. Считает sha256 содержимого.
4. Если объект уже есть, повторно использует blob.
5. Для изображения запускает sharp и сохраняет optimized variant.
6. Для обычного файла сжимает zstd.
7. Метаданные пишет в PostgreSQL.
8. Сам байтовый объект кладет на диск или в object storage.

### Поток просмотра файла

1. Страница `[owner]/[repo]/tree/[[...path]]` грузит только текущий уровень дерева.
2. Страница `[owner]/[repo]/blob/[[...path]]` грузит только выбранный файл.
3. Для маленьких текстовых файлов API возвращает декодированный preview.
4. Большие файлы показываются как download-only.
5. Изображения отдаются optimized variant.

## 2. Список страниц

### Public

- `/` - лаконичная стартовая страница с поиском проектов и последними публичными репозиториями.
- `/explore` - публичные проекты, фильтры по языку, тегам и активности.
- `/login` - вход.
- `/register` - регистрация.

### User

- `/dashboard` - проекты пользователя, recent activity, issues assigned to me.
- `/settings/profile` - профиль.
- `/settings/account` - email, пароль, сессии.
- `/settings/storage` - использованное место и лимиты.

### Profile

- `/[username]` - профиль, pinned projects, public activity.
- `/[username]?tab=stars` - избранное.

### Repository

- `/[owner]/[repo]` - обзор проекта, README, файлы корня, метаданные.
- `/[owner]/[repo]/tree/[[...path]]` - дерево папки.
- `/[owner]/[repo]/blob/[[...path]]` - просмотр файла.
- `/[owner]/[repo]/issues` - список issues.
- `/[owner]/[repo]/issues/new` - создание issue.
- `/[owner]/[repo]/issues/[number]` - issue thread.
- `/[owner]/[repo]/settings` - настройки проекта.
- `/[owner]/[repo]/stars` - пользователи, которые поставили star.

### Later

- `/[owner]/[repo]/commits`
- `/[owner]/[repo]/commit/[sha]`
- `/[owner]/[repo]/branches`
- `/[owner]/[repo]/releases`
- `/organizations/[slug]`

## 3. Сущности базы данных

### Auth

- User
- Account
- Session
- VerificationToken

### Product

- Repository
- RepositoryMember
- RepositoryStar
- RepositoryTag
- FileObject
- RepositoryFile
- FileVariant
- Issue
- IssueComment
- IssueLabel
- IssueLabelLink
- ActivityEvent
- UserQuota
- UploadBatch
- ApiToken

### Ключевая модель хранения

`FileObject` описывает физический blob по sha256. Один и тот же файл в разных проектах хранится один раз.

`RepositoryFile` описывает путь файла внутри проекта: repo, path, name, size, objectId, visibility, language, lastModifiedAt.

`FileVariant` хранит производные версии: zstd-compressed, image-webp, image-avif, image-thumbnail.

## 4. Roadmap

### Этап 0. Основание

- Next.js App Router проект.
- Tailwind monochrome theme.
- Prisma + PostgreSQL.
- Auth.js credentials или email provider.
- Docker Compose.
- Базовые layout, navigation, empty states.

### Этап 1. MVP репозиториев

- Создание публичного и приватного проекта.
- Загрузка файлов через web UI.
- Дерево файлов с ленивой загрузкой.
- README renderer.
- Просмотр текстовых файлов.
- Download raw file.
- Удаление файла и папки.
- Stars.
- Public profile.

### Этап 2. Issues

- Issues list.
- Issue details.
- Comments.
- Labels.
- Open/closed status.
- Lightweight activity timeline.

### Этап 3. Storage discipline

- Deduplication по sha256.
- zstd compression для обычных файлов.
- sharp optimization для изображений.
- Quota dashboard.
- Background cleanup orphaned blobs.

### Этап 4. Collaboration

- Repository members.
- Roles: owner, maintainer, viewer.
- Private repositories.
- API tokens.

### Этап 5. Git layer

- Import from zip.
- Import from public Git URL.
- Commit history.
- Branches.
- Later: push/pull через isomorphic-git или simple-git.

## 5. Уникальные фишки

- Mono Mode: весь интерфейс черно-белый, без цветного шума; цвет используется только для состояния ошибки или опасного действия.
- Forge Index: на странице проекта показывается компактный инженерный паспорт: размер, количество файлов, самый большой файл, степень сжатия, README status.
- Storage-first repository: пользователь сразу видит, сколько места реально занимает проект до и после сжатия.
- Quiet Issues: issues выглядят как рабочие карточки без социальной ленты и лишних реакций.
- Readme as front panel: README не прячется ниже дерева, а становится главным описанием проекта.
- File weight hints: рядом с файлами показывается вес и compression ratio.
- Text-first code view: минимальный просмотр кода, моноширинный шрифт, липкая строка пути, без тяжелых редакторов в MVP.
- Project capsule: короткий публичный блок проекта, который можно вставить на внешний сайт позже.

## 6. Ограничения для слабого сервера

- По умолчанию Server Components.
- Минимум client components: только upload, dropdowns, forms with dynamic state.
- Без тяжелого online editor в MVP.
- Без realtime websocket в MVP.
- Без полнотекстового поиска по содержимому файлов в MVP.
- Пагинация везде: repos, issues, comments, stars.
- Ленивое дерево файлов: загружать только текущую папку.
- Preview только для текстовых файлов до 256 KB.
- Raw download stream, без загрузки всего файла в память.
- Upload через tmp file, затем streaming hash/compress.
- Фоновые задачи простым worker process, без отдельного брокера в MVP.
- Никаких больших JSON blob в PostgreSQL.
- Индексы только под реальные запросы.

## 7. Где хранить данные

### PostgreSQL

- Пользователи, сессии, аккаунты.
- Репозитории и настройки.
- Пути файлов и дерево.
- Метаданные объектов: sha256, size, mime, compression, storage key.
- Issues, comments, labels.
- Stars.
- Quotas.
- Activity events.
- API tokens hashes.

### Диск или object storage

- Оригинальные blobs.
- Сжатые zstd blobs.
- Оптимизированные изображения.
- Thumbnails.
- Временные upload chunks.
- Позже: Git packfiles или bare repositories.

### Локальный диск в MVP

```txt
storage/
  objects/ab/cd/<sha256>.zst
  objects/ab/cd/<sha256>.raw
  objects/ab/cd/<sha256>.webp
  objects/ab/cd/<sha256>.thumb.webp
  tmp/<upload-id>
```

Object storage подключается позже через одинаковый интерфейс `StorageDriver`.

## 8. Сжатие файлов

### Сжимать zstd

- `.ts`, `.tsx`, `.js`, `.jsx`
- `.css`, `.scss`
- `.html`, `.md`, `.mdx`
- `.json`, `.yaml`, `.yml`, `.toml`
- `.txt`, `.csv`, `.xml`
- обычные бинарные файлы, если compression ratio после теста лучше 0.9

### Не сжимать zstd

- `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.gif`
- `.zip`, `.gz`, `.bz2`, `.xz`, `.7z`, `.rar`
- `.mp4`, `.mov`, `.mp3`, `.wav`
- файлы меньше 1 KB

### Изображения

- Оригинал хранить только если включен режим preserve original.
- Для web preview генерировать WebP.
- Для больших изображений делать thumbnail до 1200px по длинной стороне.
- Удалять EXIF по умолчанию.
- Ограничить пиксели, чтобы не ловить image bombs.

### Когда сжимать

- При upload.
- При import из zip.
- Позже при import из git.
- Не сжимать при каждом чтении.

### Уровни zstd

- MVP default: level 3.
- Для файлов больше 10 MB: level 1.
- Для маленьких текстовых файлов: level 6 допустим, если CPU свободен.
- Хранить `compressionAlgo`, `compressionLevel`, `compressedSize`.

## 9. Лимиты пользователей

### Free local defaults

- 100 MB total storage на пользователя.
- 20 репозиториев.
- 5 приватных репозиториев.
- 2 000 файлов на репозиторий.
- 25 MB max upload file size.
- 100 MB max upload batch.
- 256 KB max text preview.
- 1 MB max README render.
- 20 issues per minute.
- 60 comments per hour.
- 120 API requests per minute на пользователя.
- 30 login attempts per hour на IP.

### Repository limits

- Максимальная глубина пути: 20.
- Максимальная длина пути: 512 символов.
- Максимальная длина имени файла: 128 символов.
- Запрет control characters в path.
- Запрет `.env`, `.env.local`, private keys и known secret filenames для public upload без явного подтверждения.

### Server safety limits

- 128 MB max request body через reverse proxy.
- 512 MB max worker memory.
- 2 concurrent compression jobs на маленьком сервере.
- 1 concurrent image optimization job на маленьком сервере.
- Cleanup tmp uploads старше 24 часов.

## MVP Definition

MVP считается готовым, когда пользователь может:

1. Зарегистрироваться и войти.
2. Создать репозиторий.
3. Загрузить файлы.
4. Увидеть дерево файлов.
5. Открыть README.
6. Открыть текстовый файл.
7. Скачать raw file.
8. Создать issue.
9. Оставить comment.
10. Поставить star.
11. Открыть публичный профиль.

## Дизайн-направление

### Визуальный язык

- Черный, белый, серый.
- Моноширинные акценты для путей, sha, размеров и timestamps.
- Тонкие линии вместо тяжелых карточек.
- Радиус 4-8px.
- Табличные списки вместо больших плиток.
- Dense layout, но с хорошими отступами.
- Кнопки с иконками там, где действие очевидно.

### Главный экран проекта

- Верхняя строка: owner / repo, visibility, star.
- Под ней: tabs `Code`, `Issues`, `Settings`.
- Левый блок: file tree текущей папки.
- Правый или нижний блок: Forge Index.
- README отдельной секцией ниже файлов.

### Тональность интерфейса

- Слова короткие: `New repo`, `Upload`, `Raw`, `Open`, `Closed`.
- Ошибки конкретные: `File is over 25 MB`.
- Без маркетинговой болтовни внутри рабочего интерфейса.

## Минимальная Prisma-схема по смыслу

```prisma
model Repository {
  id          String   @id @default(cuid())
  ownerId     String
  slug        String
  name        String
  description String?
  visibility  String   @default("public")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner User @relation(fields: [ownerId], references: [id])

  @@unique([ownerId, slug])
  @@index([visibility, updatedAt])
}

model FileObject {
  id             String   @id @default(cuid())
  sha256         String   @unique
  byteSize       Int
  mimeType       String?
  storageKey     String
  compression    String?
  compressedSize Int?
  createdAt      DateTime @default(now())
}

model RepositoryFile {
  id           String   @id @default(cuid())
  repositoryId String
  objectId     String?
  path         String
  name         String
  kind         String
  byteSize     Int      @default(0)
  language     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  repository Repository @relation(fields: [repositoryId], references: [id])
  object     FileObject? @relation(fields: [objectId], references: [id])

  @@unique([repositoryId, path])
  @@index([repositoryId, kind, path])
}
```

## Что не делать в MVP

- Не делать полноценный Git server.
- Не делать pull requests.
- Не делать CI.
- Не делать realtime notifications.
- Не делать organization billing.
- Не делать сложные ACL.
- Не делать глобальный code search.
- Не делать Monaco editor как основной просмотрщик.

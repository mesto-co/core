# Как помочь?

## Как помочь?

### Код

1. Склонируйте репозиторий

```bash
git clone https://github.com/mesto-co/core
cd core
```

2. Установите зависимости

```bash
npm install
```

3. Запустите тесты, чтобы проверить, что все работает.

```bash
npm test
```

### Частые вопросы
1. Как создать новую миграцию?
```bash
./node_modules/.bin/knex migrate:make name
```
2. Как запустить миграции на проде?
```bash
# username should be registered on AWS and has enough rights, machine IP should be whitelisted on AWS
ssh  -L 5432:10.0.24.213:5432 <username>@18.158.111.228
DATABASE=postgres://postgres:<database password>@localhost:5432/postgres ./node_modules/.bin/knex migrate:latest
```

### Code reviews

Code review необходимо для любого изменения. Мы используем GitHub pull requests для этого.

Частые запросы в code review:
- 99% изменений требуют как минимум один тест - лучше добавьте его сразу,
- идеальный PR делает что-то одно, старайтесь объединить ваши комиты в один перед созданием PR - [how to](https://stackoverflow.com/questions/5189560/squash-my-last-x-commits-together-using-git) - этот комит потом попадет в мастер, хорошая история комитов помогает использовать git по полной, например, git blame, либо git bisect,
- для хорошей истории комитов - старайтесь не трогать код, который уже есть, без особой необходимости - чинить баг - окей, рефакторить - часто окей, переформатировать лишний раз не стоит - пострадает git blame.

### Code Style

- Coding style определен в [.eslintrc](https://github.com/mesto.co/core/blob/master/.eslintrc.js)

Чтобы запустить linter..

```bash
npm run eslint
```

.. и исправить часть проблем:

```bash
npm run eslint:fix
```

### Commit Messages

Та-да-дам - semantic Commit Messages формат:

```
label(namespace): title

description

footer
```

1. *label* is one of the following:
    - `fix` - core bug fixes.
    - `feat` - core features.
    - `docs` - changes to docs, e.g. `docs(api.md): ..` to change documentation.
    - `test` - changes to core tests infrastructure.
    - `devops` - build-related work, e.g. CI related patches and general changes to the browser build infrastructure
    - `chore` - everything that doesn't fall under previous categories
2. *namespace* is put in parenthesis after label and is optional. Must be lowercase.
3. *title* is a brief summary of changes.
4. *description* is **optional**, new-line separated from title and is in present tense.
5. *footer* is **optional**, new-line separated from *description* and contains "fixes" / "references" attribution to github issues.

Example:

```
feat(firefox): single signon authorization

This patch implements a SSO authorization in API.

Fixes #123
```

### Документация

Важный раздел!

### Новые зависимости

Для всех зависимостей (installation и development):
- **Не добавляйте** зависимость, если легко реализовать (скажем нет leftpad).
- Каждая новая зависимость должна хорошо поддерживаться.
- Проверить пакет на его размер на https://bundlephobia.com/ и посмотреть альтрнативы

A barrier for introducing new installation dependencies is especially high:
- **Do not add** installation dependency unless it's critical to project success.

### Running & Writing Tests

Важный раздел!

### API Coverage

Каждый API метод должен быть вызван как минимум один раз в тестах.
У нас будет автоматический скрипт для проверки этого.

# cronjob_demo

## Preparation

- Node version 18.17.0

## Steps to run demo

- Step 1: Open Docker Engine

- Step 2: Run script to run the db container
  ```sh
    make run
  ```
- Step 3: Install packages (if use `yarn install` or `npm install` please remove `pnpm-lock.yaml` ). At here, I used `pnpm`
  ```sh
    pnpm install
  ```
- Step 4: Migrate db and seed data

  ```sh
    npx prisma generate\

    npx prisma migrate deploy\

    npx prisma db seed
  ```

- Step 5: Run server
  ```sh
    pnpm start:dev
  ```

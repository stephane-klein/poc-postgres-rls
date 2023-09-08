# POC PostgreSQL RLS

Resources:

- RLS: [Row-Level Security](https://www.postgresql.org/docs/15/ddl-rowsecurity.html)

```sh
$ asdf install
$ pnpm install
$ ./scripts/init.sh
```

```sh
$ ./scripts/seed.sh
$ ./load-fixtures.js
$ pnpm run test
 PASS  tests/contacts.js
  ✓ admin user count invoices (22 ms)
  ✓ application_user count invoices (3 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.366 s, estimated 1 s
Ran all test suites.
```

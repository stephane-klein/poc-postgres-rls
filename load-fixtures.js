#!/usr/bin/env node
import fs from 'fs';
import yaml from 'js-yaml';
import postgres from 'postgres';

const data = yaml.load(fs.readFileSync('./fixtures.yaml', 'utf8'));

const sql = postgres(
    'postgres://postgres:password@localhost:5432/postgres'
);

await sql`TRUNCATE users, invoices`;
await sql`ALTER SEQUENCE invoices_id_seq RESTART WITH 1`;
await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
for await (const user of data.users) {
    await sql`INSERT INTO users ${sql(user, 'id', 'username')}`;

    for await (const invoice of user.invoices) {
        await sql`INSERT INTO invoices ${sql({date: invoice.date, user_id: user.id})}`;
    }
}

sql.end();

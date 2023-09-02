#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(sql) {
    const data = yaml.load(fs.readFileSync(path.resolve(__dirname, './fixtures.yaml'), 'utf8'));

    await sql`TRUNCATE users, invoices`;
    await sql`ALTER SEQUENCE invoices_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
    for await (const user of data.users) {
        await sql`INSERT INTO users ${sql(user, 'id', 'username')}`;

        for await (const invoice of user.invoices) {
            await sql`INSERT INTO invoices ${sql({date: invoice.date, user_id: user.id})}`;
        }
    }
}

if (__filename === process.argv[1]) {
    console.log('Load fixtures...');
    const sql = postgres(
        'postgres://postgres:password@localhost:5432/postgres'
    );
    await main(sql);
    sql.end();
    console.log('Fixtures loaded');
}
export default main;

#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres(
    'postgres://postgres:password@localhost:5432/postgres'
);
await sql`
    SELECT
        SET_CONFIG(
            'auth.session_id',
            'foo',
            TRUE
        ),
        SET_CONFIG(
            'auth.user_id',
            'bar',
            FALSE
        );
`;

console.log(
    await sql`
        SELECT
            current_setting('auth.session_id', TRUE) AS session_id,
            current_setting('auth.user_id', TRUE) AS user_id;
    `
);

const reserve = await sql.reserve();
const reserve2 = await sql.reserve();

await reserve`
    SELECT
        SET_CONFIG(
            'auth.session_id',
            'foo',
            TRUE
        ),
        SET_CONFIG(
            'auth.user_id',
            'bar',
            FALSE
        );
`;

console.log('reserve1');
console.log(
    await reserve`
        SELECT
            current_setting('auth.session_id', TRUE) AS session_id,
            current_setting('auth.user_id', TRUE) AS user_id;
    `
);

console.log('reserve2');
console.log(
    await reserve2`
        SELECT
            current_setting('auth.session_id', TRUE) AS session_id,
            current_setting('auth.user_id', TRUE) AS user_id;
    `
);

console.log('reserve1');
console.log(
    await reserve`
        SELECT
            current_setting('auth.session_id', TRUE) AS session_id,
            current_setting('auth.user_id', TRUE) AS user_id;
    `
);
reserve.release();
reserve2.release();
sql.end();

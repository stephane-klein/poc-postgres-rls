import postgres from 'postgres';
import fixture from '../load-fixtures.js';

let sql;


beforeAll(async () => {
    sql = postgres(
        'postgres://postgres:password@localhost:5432/postgres'
    );
    await fixture(sql);
});
afterAll(() => {
    sql.end()
});

test('admin user count invoices', async () => {
    expect(
        (await sql`SELECT COUNT(*)::INTEGER FROM public.invoices`)[0].count
    ).toBe(36);
});

test('application_user count invoices', async () => {
    const result = await sql.begin((sql) => [
            sql`SET LOCAL auth.user_id = 1`,
            sql`SET ROLE TO application_user`,
            sql`EXPLAIN (ANALYZE TRUE, FORMAT JSON) SELECT COUNT(*)::INTEGER FROM public.invoices`,
            sql`SELECT COUNT(*)::INTEGER FROM public.invoices`
    ]);
    expect(
        result.at(-2)[0]['QUERY PLAN'][0]['Plan']['Plans'][0]['Node Type']
    ).toBe('Bitmap Heap Scan');
    expect(result.at(-1)[0].count).toBe(6);
});

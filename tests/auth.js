import postgres from 'postgres';

let sql;


beforeAll(() => {
    sql = postgres(
        'postgres://postgres:password@localhost:5432/postgres'
    );
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
    expect(
        (await sql.begin((sql) => [
            sql`SET ROLE TO application_user`,
            sql`SELECT COUNT(*)::INTEGER FROM public.invoices`
        ])).at(-1)[0].count
    ).toBe(1);
});

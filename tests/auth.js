import postgres from 'postgres';
import fixture from '../load-fixtures.js';

let sql;


beforeEach(async () => {
    sql = postgres(
        'postgres://postgres:password@localhost:5432/postgres'
    );
});
afterEach(() => {
    sql.end()
});

describe('When admin user request the list of invoices', () => {
    it('Should return all invoices (72)', async() => {
        await fixture(sql);
        expect(
            (await sql`SELECT COUNT(*)::INTEGER FROM public.invoices`)[0].count
        ).toBe(72);
    });
});


describe('When user 1 request the list of invoices', () => {
    let result;

    it('Should return only its invoices (6)', async() => {
        await fixture(sql);
        result = await sql.begin((sql) => [
                sql`SET LOCAL auth.user_id = 1`,
                sql`SET ROLE TO application_user`,
                sql`EXPLAIN (ANALYZE TRUE, FORMAT JSON) SELECT COUNT(*)::INTEGER FROM public.invoices`,
                sql`SELECT COUNT(*)::INTEGER FROM public.invoices`
        ]);
        expect(result.at(-1)[0].count).toBe(6);
    });
    it('Should use an index', async() => {
        await sql`TRUNCATE users, invoices`
        await sql`VACUUM`;
        await sql`
            ALTER SEQUENCE invoices_id_seq RESTART WITH 1;
            ALTER SEQUENCE users_id_seq RESTART WITH 1;

            DROP INDEX IF EXISTS invoices_user_id_index;
            ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS fk_user_id;

            INSERT INTO users (id, username)
            (
                SELECT
                    user_id,
                    'username_' || TO_CHAR(user_id, 'FM0000')
                FROM GENERATE_SERIES(1, 1000) AS user_id
            );

            INSERT INTO invoices (date, user_id)
            (
                SELECT
                    CURRENT_DATE + seq AS date,
                    user_id
                FROM
                    GENERATE_SERIES(1, 2000) AS seq,
                    GENERATE_SERIES(1, 1000) AS user_id
            );

            ALTER TABLE public.invoices ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
            CREATE INDEX invoices_user_id_index ON public.invoices (user_id);
        `.simple();

        result = await sql.begin((sql) => [
                sql`SET LOCAL auth.user_id = 10`,
                sql`SET ROLE TO application_user`,
                sql`EXPLAIN (ANALYZE TRUE, FORMAT JSON) SELECT COUNT(*)::INTEGER FROM public.invoices`
        ]);
        expect(
            result.at(-1)[0]['QUERY PLAN'][0]['Plan']['Plans'][0]['Node Type']
        ).toBe('Index Only Scan');
    });
});

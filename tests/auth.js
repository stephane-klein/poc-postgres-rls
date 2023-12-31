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
                FROM GENERATE_SERIES(1, 100) AS user_id
            );

            INSERT INTO invoices (date, user_id)
            (
                SELECT
                    CURRENT_DATE + seq AS date,
                    user_id
                FROM
                    GENERATE_SERIES(1, 200) AS seq,
                    GENERATE_SERIES(1, 100) AS user_id
            );

            ALTER TABLE public.invoices ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
            CREATE INDEX invoices_user_id_index ON public.invoices (user_id);
            ANALYZE;
        `.simple();

        result = await sql.begin((sql) => [
                sql`EXPLAIN (ANALYZE TRUE, FORMAT JSON) SELECT COUNT(*)::INTEGER FROM public.invoices WHERE user_id=10`
        ]);
        const admin_execution_time = result.at(-1)[0]['QUERY PLAN'][0]['Execution Time'];

        expect(
            result.at(-1)[0]['QUERY PLAN'][0]['Plan']['Plans'][0]['Node Type']
        ).toBe('Index Only Scan');

        result = await sql.begin((sql) => [
                sql`SET LOCAL auth.user_id = 10`,
                sql`SET ROLE TO application_user`,
                sql`EXPLAIN (ANALYZE TRUE, FORMAT JSON) SELECT COUNT(*)::INTEGER FROM public.invoices`
        ]);
        const user_execution_time = result.at(-1)[0]['QUERY PLAN'][0]['Execution Time'];

        expect(
            // Computes the time difference as a percentage
            100 * Math.abs((admin_execution_time - user_execution_time) / ((admin_execution_time + user_execution_time)/2 ))
        ).toBeLessThan(80); // in percent

        expect(
            result.at(-1)[0]['QUERY PLAN'][0]['Plan']['Plans'][0]['Node Type']
        ).toBe('Index Only Scan');
    });
});

describe("When user 1 is connected", () => {
    it("User 1 should be able to insert a new Invoice", async() => {
        await fixture(sql);
        const result = await sql.begin((sql) => [
                sql`SET LOCAL auth.user_id = 1`,
                sql`SET ROLE TO application_user`,
                sql`
                    INSERT INTO invoices
                    (
                        date,
                        user_id
                    )
                    VALUES(
                        NOW(),
                        1
                    ) RETURNING id
                `
        ]);
        expect(result.at(-1)[0].id).toBe(73);
    });
    it("User 1 should be able to update own Invoice", async() => {
        await fixture(sql);
        const result = await sql.begin((sql) => [
                sql`SET LOCAL auth.user_id = 1`,
                sql`SET ROLE TO application_user`,
                sql`
                    UPDATE invoices
                    SET title='Foobar'
                    WHERE id=1
                `,
                sql`
                    SELECT title FROM invoices WHERE id=1
                `
        ]);
        expect(result.at(-1)[0].title).toBe("Foobar");
    });
    it("User 1 should be able to delete own Invoice", async() => {
        await fixture(sql);
        const result = await sql.begin((sql) => [
                sql`SET LOCAL auth.user_id = 1`,
                sql`SET ROLE TO application_user`,
                sql`
                    DELETE FROM invoices
                    WHERE id=1
                `,
                sql`
                    SELECT COUNT(*)::INTEGER FROM invoices WHERE id=1
                `
        ]);
        expect(result.at(-1)[0].count).toBe(0);
    });
});

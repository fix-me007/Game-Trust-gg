import { pool, query } from "../../libs/pool-query.js"

export const addBalance = async ({ user_id, amount }) => {

    const sql = `
    INSERT INTO user_wallets (user_id, balance, total_earned)
    VALUES ($1, $2, $2)
    ON CONFLICT (user_id)
    DO UPDATE
      SET balance = user_wallets.balance + EXCLUDED.balance,
          total_earned = user_wallets.total_earned + EXCLUDED.total_earned,
          updated_at = NOW()
    RETURNING *;
  `;
    const params = [user_id, amount];

    try {
        const result = await query(sql, params)

        if (result.rowCount > 0) {
            return { success: true, message: "เติมเงินสําเร็จ", wallet: result.rows[0] };
        }

        return { success: false, message: 'Insert failed' };
    } catch (error) {
        console.error("ไม่สามารถเติมเงินได้", error);
        throw error
    }

}

export const withdrawBalance = async ( user_id, amount, type, description ) => {

    const client = await pool.connect();

    console.log("type", user_id, amount, type, description);

    try {
        await client.query('BEGIN');

        // 🔍 Get wallet and lock row
        const { rows: wallets } = await client.query(
            `SELECT * FROM user_wallets WHERE user_id = $1 FOR UPDATE`, [user_id]
        );

        if (wallets.length === 0) {
            await client.query('ROLLBACK');
            return { success: false, error: "Wallet not found" };
        }

        const wallet = wallets[0];
        const balance_before = parseFloat(wallet.balance);
        const isWithdraw = type === 'withdraw';

        // ❌ Check for insufficient balance
        if (isWithdraw && balance_before < amount) {
            await client.query('ROLLBACK');
            return { success: false, error: "Insufficient balance" };
        }


        // เช็คว่าถอนเงินหรือเติม ? :
        const balance_after = isWithdraw
            ? balance_before - amount
            : balance_before + amount;

        // 🧾 Update wallet
        const updateWalletSql = `
            UPDATE user_wallets
            SET 
                balance = $1,
                ${isWithdraw ? 'total_spent = total_spent + $2' : 'total_earned = total_earned + $2'},
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $3
        `;

        await client.query(updateWalletSql, [balance_after, amount, user_id]);

        // Insert transaction log
        const insertTransactionSql = `
            INSERT INTO wallet_transactions (
                wallet_id,
                user_id,
                type,
                amount,
                balance_before,
                balance_after,
                description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await client.query(insertTransactionSql, [
            wallet.wallet_id,
            user_id,
            type,
            amount,
            balance_before,
            balance_after,
            description || null
        ]);

        await client.query('COMMIT');

        return { message: `${type} successful`, balance_after }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Transaction error:", error);
        return { success: false, error: "Something went wrong." };
    } finally {
        client.release();
    }

}

export const checkBalance = async (user_id) => {
    const sql = 'SELECT balance from user_wallets WHERE user_id = $1'
    const params = [user_id]

    try {
        const result = await query(sql, params)

        if (result.rowCount > 0) {
            return {
                balance: result.rows[0]
            };
        }

        return { success: false, message: 'Insert failed' };
    } catch (error) {
        console.error("ไม่สามารถเช็คยอดเงินได้", error);
        throw error
    }

}
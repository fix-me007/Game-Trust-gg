import dotenv from "dotenv"
import { query } from "../libs/pool-query.js"
dotenv.config()

export const signupUser = async ({ email, password, username, first_name, last_name }) => {
  const sql = 'INSERT INTO users (email, password, username, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING user_id'
  const param = [email, password, username, first_name, last_name]

  try {
    const result = await query(sql, param)

    // console.log("controller", result);

    if (result.rowCount > 0) {
      return { success: true, id: result.rows[0].user_id };
    }

    return { success: false, message: 'Insert failed' };
  } catch (error) {
    console.error("Error occurred during signup:", error);
    throw error
  }
}

export const singInUserWithEmail = async ({ email }) => {
  const sql = 'SELECT * FROM users WHERE email = $1'
  const param = [email]

  try {
    const result = await query(sql, param)

    if (result.rowCount > 0) {
      return { success: true, result: result.rows[0] };
    }
    console.log("tes", result.rows)
    return { success: false, message: 'Insert failed' };

  } catch (error) {
    console.error('Error signing in user:', error)
    throw error
  }

}
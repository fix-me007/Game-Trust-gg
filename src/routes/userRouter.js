import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { signupUser, singInUserWithEmail } from "../controllers/userControllers.js"
import dotenv from 'dotenv'

dotenv.config();

const userRouter = Router()
const JWT_SECRET = process.env.JWT_SECRET


userRouter.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: `hello from user route`,
  })
})

userRouter.post("/signup", async (req, res) => {
  const { email, password, username, first_name, last_name } = req.body;

  if (!email || !password || !username || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      message: "ต้องระบุ email, password, username, first_name, last_name",
    });
  }

  try {
    const hashPassword = await bcrypt.hash(password, 10)
    console.log(hashPassword);

    //query
    const result = await signupUser({
      email, password: hashPassword, username, first_name, last_name
    })

    if (result.success === true) {
      return res.status(200).json({
        success: true,
        message: "สมัครสมาชิกสำเร็จ",
        id: result.id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'สมัครสมาชิกไม่สำเร็จ',
        result
      });
    }

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในระบบ",
    });
  }
});


userRouter.post("/signin", async (req, res) => {
  const { email, password } = req.body

  try {
    const { result } = await singInUserWithEmail({ email })

    if (!result) {
      return res.status(404).json({ message: 'Not found' })
    }

    console.log("RES FROM SINGIN ROUTER:", result);

    // compare password with hashpassword (from table)
    const matched = await bcrypt.compare(password, result.password)
    if (!matched) {
      return res.status(404).json({ message: 'ไม่พบบัญชี' })
    }

    const token = jwt.sign({ id: result.id }, JWT_SECRET, { expiresIn: '1h' })
    console.log("your token", token);

    const { password: removedPassword, ...safeUser } = result

    return res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบสําเร็จ',
      user: safeUser,
      token
    })

  } catch (error) {
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' })
  }
});

export default userRouter



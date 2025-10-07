import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import { jwtTokenMiddleware } from "../../middlewares/jwtMiddleware.js"
import { onlySuperAdmin } from "../../middlewares/superAdmin.js"
import dotenv from 'dotenv'
import { deleteUser, signupUser, singInUserWithEmail } from "../../controllers/common/userControllers.js"

dotenv.config();

const userRouter = Router()
const JWT_SECRET = process.env.JWT_SECRET


userRouter.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: `hello from user route`,
  })
})

userRouter.get("/verifyToken", jwtTokenMiddleware, (req, res) => {
  try {
    const userId = req.user

    return res.status(200).json({
      message: "Token is valid",
      userId
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
});

userRouter.post("/super-signup", onlySuperAdmin, async (req, res) => {
  const { email, password, username, first_name, last_name } = req.body
  const role = "admin"

  if (!email || !password || !username || !first_name || !last_name || !role) {
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
      email, password: hashPassword, username, first_name, last_name, user_role: role
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


userRouter.post("/signup", async (req, res) => {
  const { email, password, username, first_name, last_name, role } = req.body;

  if (!email || !password || !username || !first_name || !last_name || !role) {
    return res.status(400).json({
      success: false,
      message: "ต้องระบุ email, password, username, first_name, last_name",
    });
  }

  const allowedRoles = ['buyer', 'seller']

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Hell Hah Please don't change roles"
    });
  }


  try {
    const hashPassword = await bcrypt.hash(password, 10)
    console.log(hashPassword);

    //query
    const result = await signupUser({
      email, password: hashPassword, username, first_name, last_name, user_role: role
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

    // แก้ เปลี่ยนจาก id เป็น user_id 
    // ถ้าไม่แก้จะไม่สามารถ decode เพื่อเอา user id  
    const token = jwt.sign({ id: result.user_id, role: result.user_role }, JWT_SECRET, { expiresIn: '1h' })
    console.log("your token", token, "test result.id", result.user_id);

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


userRouter.delete("/delete-user", onlySuperAdmin, async (req, res) => {
  const { user_id } = req.body

  try {
    const result = await deleteUser({ user_id })

    if (!result) {
      return res.status(404).json({ message: 'Not found' })
    }

    if (result.success === true) {
      return res.status(200).json({
        success: true,
        message: "ลบบัญชีสำเร็จ",
        id: result.id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'ลบบัญชีไม่สำเร็จ',
        result
      });
    }

  } catch (error) {
    console.error("Error Delete user", error)
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในระบบ",
    });
  }
})

export default userRouter



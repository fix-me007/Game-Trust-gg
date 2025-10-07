import { Router } from "express"
import { jwtTokenMiddleware } from "../../middlewares/jwtMiddleware.js"
import { addBalance, checkBalance, withdrawBalance } from "../../controllers/common/walletControllers.js"

const walletRouter = Router()

walletRouter.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello This is Wallet Router!'
    })
})

walletRouter.post("/add-balance", jwtTokenMiddleware, async (req, res) => {
    // user เติมเงินเองใช้ user_id + ยอดเงินที่จะเติม

    // เพิ่มเติม เช็คสลิป
    const user_id = req.user
    const { balance } = req.body

    const amount = Number(balance);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("amount must be a positive number");
    }

    try {
        const result = await addBalance({ user_id, amount })

        res.status(200).json({
            success: true,
            message: "Balance updated successfully",
            result
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Error" })
    }

})

walletRouter.get("/check-balance", jwtTokenMiddleware, async (req, res) => {
    const user_id = req.user
    console.log("uiseas", user_id);

    try {
        const result = await checkBalance(user_id)
        res.status(200).json({ success: true, message: "เช็คยอดเงินสําเร็จ", result: result.balance })
    } catch (error) {
        console.error("sad ERR", error)
        res.status(500).json({ success: false, message: "Server Error" })
    }
})

walletRouter.post("/withdraw-balance", jwtTokenMiddleware, async (req, res) => {
    const user_id = req.user
    const { amount, type, description } = req.body

    console.log("REQ draw", amount, type, description)

    if (!['deposit', 'withdraw'].includes(type)) {
        return res.status(400).json({ success: false, error: "Invalid transaction type" })
    }

    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, error: "Amount must be a positive number" })
    }

    try {
        const result = await withdrawBalance(user_id, amount, type, description)
        res.status(200).json({ success: true, message: result.message, balance_after: result.balance_after })
    } catch (error) {
        console.error("Hasd Err", error)
        res.status(500).json({ success: false, message: "Server Error" })
    }

})

export default walletRouter
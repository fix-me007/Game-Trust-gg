import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const onlySuperAdmin = (req, res, next) => {

    const token = req.headers.authorization?.split(" ")[1]

    console.log("Received token:", token);


    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing" })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" })
        }


        console.log("payload", payload.role);
        

        if (payload.role !== "super_admin") {
            return res.status(403).json({
                message: "Only SuperAdmin"
            });
        }


        console.log("321 get payload")
        const user_id = payload.id
        console.log(user_id)
        req.user = user_id

        next()
    })
}

export { onlySuperAdmin }

import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const jwtTokenMiddleware = (req, res, next) => {

    const token = req.headers.authorization?.split(" ")[1]

    console.log("Received token:", token);
    

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing" })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" })
        }

        // console.log(payload)

        const userId = payload.id
        req.user = userId

        next()
    })
}

export { jwtTokenMiddleware }

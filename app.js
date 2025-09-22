import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
dotenv.config()

import { query } from "./src/libs/pool-query.js"

// import router
import userRouter from "./src/routes/userRouter.js"

// uploadthing
import uploadRouter from "./src/libs/uploadthing.js"
import { createRouteHandler } from "uploadthing/express"

const app = express()
const PORT = process.env.PORT
const HOST = process.env.HOST
const API_PREFIX = process.env.API_PREFIX

app.use(cors())
app.use(express.json())

// uploadimage route
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    // config: { ... },
  }),
);

// main route
app.use(`${API_PREFIX}/users`, userRouter)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: 'Api is runing..',
    timestamp: new Date().toISOString()
  })
})

// database
app.get('/database/health', async (req, res) => {
  try {
    const sql = 'SELECT * from hiruma'
    const data = await query(sql)
    const check = data.rows[0].csi

    res.status(200).json({ success: true, status: check });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://${HOST}:${PORT}`)
})
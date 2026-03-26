import express from 'express'
import { MatchesRouter } from './Module/index.js';
import { connectDB } from './db/connection.js';
import { globalErrorHandler } from './common/utils/index.js';

export const bootstrap = async () => {
    const app = express()
    const port = 3000
    app.use(express.json())
    await connectDB()

    app.use('/matches', MatchesRouter)

    app.use(globalErrorHandler)


    app.use((req, res) => {
        return res.status(404).json({ message: "page not found" })
    })

    app.listen(port, () => {
        console.log(`server is running on port ${port}`);

    })
}

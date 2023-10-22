import express, { Response } from "express";
import { DbInstance } from "../../db";

const router = express.Router();
const db = DbInstance.getInstance();
const MAX_LIMITATION: number = 20;

const getMatchesQuery = 'SELECT * FROM matches ORDER BY id LIMIT ? OFFSET ?';

router.get("/get/matches/:offset?", async (req, res) => {
    const offset: number = req.params.offset ? parseInt(req.params.offset) : 0;
    const limit: number = req.body.limit <= 20 && req.body.limit >= 1 ? req.body.limit : MAX_LIMITATION;

    const isValidOffset = checkOffset(offset);

    if(!isValidOffset) {
        return invalidOffset(res);
    }

    db.all(getMatchesQuery, [limit, offset], (err, row) => {
        if(err) {
            res.status(500);
            res.json({
                "errorMessage": "Something went wrong"
            });
        }
        
        res.status(200).json(row);
    });
});

router.get("/get/verified_matches/:offset?", async (req, res) => {
    const offset: number = req.params.offset ? parseInt(req.params.offset) : 0;
    const limit: number = req.body.limit <= 20 && req.body.limit >= 1 ? req.body.limit : MAX_LIMITATION;

    const isValidOffset = checkOffset(offset);

    if(!isValidOffset) {
        return invalidOffset(res);
    }

    db.all((`SELECT * FROM matches WHERE is_verified > 0 ORDER BY id LIMIT ${limit} OFFSET ${offset}`), (err, rows) => {
        if(err) {
            res.status(500);
            res.json({
                "errorMessage": "Something went wrong"
            });

            return;
        }

        res.status(200).json(rows);
    })
});

router.get("/get/unverified_matches/:offset?", async (req, res) => {
    const offset: number = req.params.offset ? parseInt(req.params.offset) : 0;
    const limit: number = req.body.limit <= 20 && req.body.limit >= 1 ? req.body.limit : MAX_LIMITATION;

    const isValidOffset = checkOffset(offset);

    if(!isValidOffset) {
        invalidOffset(res);
        return;
    }

    db.all((`SELECT * FROM matches WHERE is_verified < 1 ORDER BY id LIMIT ${limit} OFFSET ${offset}`), (err, rows) => {
        if(err) {
            console.error(err);

            res.status(500);
            res.json({
                "errorMessage": "Something went wrong"
            });

            return;
        }


        res.status(200).json(rows);
    })
});

router.put("/update/:id", async (req, res) => {
    const matchId = parseInt(req.params.id);

    if(!req.body.is_verified) {
        res.status(400);
            res.json({
                "errorMessage": "The field 'is_verified' is required."
        });

        return;
    }

    if(typeof req.body.is_verified !== "boolean") {
        if(!req.body.is_verified) {
            res.status(400);
                res.json({
                    "errorMessage": "The field 'is_verified' is type of boolean"
            });
        }

        return;
    }

    const is_verified: number = req.body.is_verified ? 1 : 0;

    db.run(
        `UPDATE matches
        SET 
            is_verified = ${is_verified}

        WHERE id = ${matchId}`,
         
        (err) => {
            if(err) {
                res.status(500);

                res.json({
                    "errorMessage": err.message
                });
                
                return;
            }

            res.sendStatus(200);
    });

})

function checkOffset(offset: number): boolean {
    return isNaN(offset) ? false : true;
}

function invalidOffset(res: Response): void {
    res.status(400);

    res.json({
        "errorMessage": "offset path parameter have to be a number"
    });
}

export default router;
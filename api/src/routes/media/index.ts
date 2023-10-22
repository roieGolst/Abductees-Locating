import express from "express";
import multer from "multer";
import path from "path";

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), "media"));
    },

    filename: (req,  file, cb) => {
        switch(file.mimetype) {
            case "image/png" : {
                cb(null, `${file.fieldname}.png`);
                break;
            }

            default: {
                cb(new Error("Unsupported file type"), file.filename);
            }
        }
    }
});

const upload = multer({storage});
const router = express.Router();

router.put("/add/media", upload.single("uploaded_file"), async (req, res): Promise<void> => {
    console.dir(req.body, { depth: 0 }) ;
    if (!req.file) {
        res.status(400).send('No file were uploaded.');
        return;
    }

    res.sendStatus(200);
});

export default router;
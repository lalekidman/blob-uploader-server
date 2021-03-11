import {Request, Response, NextFunction, Router} from 'express'
import fs from 'fs'
import Busboy from 'busboy'
const mediaPattern = /^(image\/png|video\/mp4)$/i
const blobLoc = __dirname.concat(`/../../../../uploads`)
const getBlobpath = (fileId: string) => {
  return `${blobLoc}/${fileId}`
}
export const BlobUploaderMiddleware = (req: Request, res: Response, next: NextFunction) => {
  var busboy = new Busboy({ headers: req.headers });
  const fileId = req.headers['x-file-id'] as string
  const fileSize = parseInt(req.headers['x-file-size'] as string)
  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    const blobFlag = fs.existsSync(getBlobpath(fileId)) ? 'a' : 'w'
    file.pipe(fs.createWriteStream(getBlobpath(fileId), {flags: blobFlag}));
    file.on('end', function() {
      const stats = fs.statSync(getBlobpath(fileId))
      if (stats.size === fileSize) {
        //@ts-expect-error
        req.file = {
          filename,
          fieldname,
          encoding,
          mimetype,
          location: blobLoc,
          path: getBlobpath(fileId),
        }
        next()
        return
      } else {
        res.sendStatus(201)
      }
    });
  });
  req.pipe(busboy)
}

export const BlobTotalLoaded = (req: Request, res: Response, next: NextFunction) => {
  let {fileId} = req.query
  fileId = fileId as string
  if (!(fs.existsSync(getBlobpath(fileId)))) {
    res.status(400).send({error: "No blob found."})
  }
  const blobStats = fs.statSync(getBlobpath(fileId))
  res.status(200).json({
    totalBytesUploaded: blobStats.size
  })
}
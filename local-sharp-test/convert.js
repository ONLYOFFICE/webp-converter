const sharp = require("sharp");
const QUALITY = 75

var filename = process.argv[2];

async function convertImage() {
  try {
    await sharp(filename)
      .webp({ quality: +QUALITY })
      .toFile(filename + ".webp");
  } catch (error) {
    console.log(error);
  }
}

convertImage();
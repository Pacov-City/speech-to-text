const { SpeechClient } = require("@google-cloud/speech")
const { Storage } = require("@google-cloud/storage");
const fs  = require("fs").promises;
const path = require('path')

const storage = new Storage();
const client = new SpeechClient();

//RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, mono 44100 Hz

async function processFile(fileName) {
  const outFile = `${fileName}.transcript.json`
  try {
    await fs.stat(outFile)
    console.log(`Output file already exist - skipping ${outFile}`)
    return 
  } catch (err){ 
    // file not exist - OK
  }

  const gcsUri = await uploadFile(fileName);

  const audio = {
    uri: gcsUri,
  };
  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 44100,
    languageCode: "cs-CZ",
    enableWordTimeOffsets: true,
    enableWordConfidence: true,
    enableAutomaticPunctuation: true,
    enableSpeakerDiarization: true,
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [operation] = await client.longRunningRecognize(request)
  console.log(`Started recognition for ${fileName} as ${operation.name}`)
  const [response] = await operation.promise()
  fs.writeFile(outFile,JSON.stringify(response,null,2))
  console.log(`Done recognition for ${fileName}, result stored in ${outFile}`)
}

async function uploadFile(fileName){
    let fileSize = -1
    try {
      const stat = await fs.stat(fileName)
      fileSize = stat.size
    } catch (err) {
      console.log( `file to upload not existing ${fileName}`)
      throw err
    }
    const bucket = storage.bucket("pacov-city-speech-recog")
    const name = path.basename(fileName)
    let file = bucket.file(name)
    const fileExists = (await file.exists())[0]
    
    if ( ! fileExists ) {
      console.log(`Uploading ${fileName}`)
      file = await bucket.upload(fileName, {onUploadProgress:(ev)=>{
        console.log(`Upload progress ${Math.floor(ev.bytesWritten/fileSize*100)}% for ${fileName}: ${ev.bytesWritten} of ${fileSize}`)
      }})
      console.log(`uploaded: ${fileName}`)
    } else {
      console.log(`already exists: ${name}`)
    } 
    const gsUrl = `gs://${encodeURIComponent(bucket.name)}/${encodeURIComponent(name)}`
    return gsUrl
}

setTimeout(async ()=>{
    const files = process.argv.slice(2)
    for (let idx=0; idx<files.length; idx++){
      const elm = files[idx]
      try {
        console.log(`Start processing of ${elm} (${idx+1} of ${files.length})`)
        await processFile(elm)
        console.log(`Finished processing of ${elm} (${idx+1} of ${files.length})`)
      } catch (err){
        console.log(`failed to process ${elm}`,err)
      }
    }
},0)



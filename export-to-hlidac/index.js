const fs = require("fs").promises;
const exec = require("child_process").exec;
const https = require('https');

/*
{
  "id": "",
  "ico": "",
  "mesto": "Pacov",
  "datum": "2019-07-07T00:00:00+02:00",
  "nazev": "",
  "popis": "",
  "url": "",
  "delka": , 
  "tags": null,
  "HsProcessType": "audio",
  "AudioUrl": "",
  "PrepisAudia": [
    {
      "sekundOdZacatku": 0,
      "text": ""
    },
    {
      "sekundOdZacatku": 108,
      "text": "černé"
    },
    {
      "sekundOdZacatku": 108,
      "text": " "
    }
  ],
}
*/

function base2title(base) {
  const [_, udalost, rok, mesic, den, cast] = base.match(
    /([^-]+)-(....)-(..)-(..)-part-(..)/
  );
  const nazev = `Zasedásedání zastupitelstva města Pacov ${den}.${mesic}.${rok}, část: ${
    Number(cast) + 1
  }`;
  return nazev;
}

function base2audioUrl(base) {
  return `https://pacov.city/zastupitelstvo/zaznamy/data/${base}.mp3`;
}

function base2url(base) {
  return `https://pacov.city/zastupitelstvo/zaznamy/corrector/#${base}:0`;
}

function base2transcriptionFile(base) {
  return `../data/${base}.wav.transcript.json`;
}

function getWordStartSec(word) {
  return Number(
    word.startTime.hasOwnProperty("seconds") ? word.startTime.seconds : "0"
  );
}

async function base2transcription(base) {
  const transcript = JSON.parse(
    await fs.readFile(base2transcriptionFile(base), "utf-8")
  );
  let ret = [];
  let secondBuf = [];
  let currentSec = 0;

  transcript.results.forEach((result) => {
    result.alternatives[0].words.forEach((word) => {
      const sec = getWordStartSec(word);
      if (currentSec != sec) {
        //compose result
        ret.push({
          sekundOdZacatku: currentSec,
          text: secondBuf.join(" "),
        });
        secondBuf = [];
      }
      secondBuf.push(word.word);
      currentSec = sec;
    });
  });
  return ret;
}

function generateId(base) {
  return `pacov-city-${base}`;
}

async function getMp3Length(base) {
  const mp3File = `../data/${base}.mp3`;
  const len = await new Promise((resolve, reject) => {
    exec(`mp3info -p %S ${mp3File}`, (error, stdout, stderr) => {
      resolve(stdout);
    });
  });
  return Number(len);
}

async function generateRecord(base) {
  const [_, udalost, rok, mesic, den, cast] = base.match(
    /([^-]+)-(....)-(..)-(..)-part-(..)/
  );
  return {
    id: generateId(base),
    ico: "00248789",
    mesto: "Pacov",
    datum: `${rok}-${mesic}-${den}T00:00:00+01:00`,
    nazev: base2title(base),
    popis: base2title(base),
    url: base2url(base),
    delka: await getMp3Length(base),
    tags: null,
    HsProcessType: "audio",
    AudioUrl: base2audioUrl(base),
    PrepisAudia: await base2transcription(base),
  };
}

async function uploadRecord(record){
    return new Promise((resolve,reject)=>{
        const recordBuf = Buffer.from(JSON.stringify(record,null,2),"utf-8")
        const response = []
        //const url = `https://www.hlidacstatu.cz/api/v2/datasety/zasedani-zastupitelstev/zaznamy/${record.id}?mode=skip`
        const url = `https://webhook.site/30bbc7d2-2370-40e1-8c20-7b2f3c1dca36/api/v2/datasety/zasedani-zastupitelstev/zaznamy/${record.id}?mode=skip`
        const req = https.request(url, 
        {
            method: "POST",
            headers: {
                "content-type":"application/json",
                "authorization":`Token ${process.env['HS_TOKEN']}`,
                "accept":"application/json",
                "content-length":recordBuf.length,
            }
        },(res)=>{

            if (res.statusCode != 200 ){
                console.log(`Status: ${res.statusCode}`)
            }

            res.on("data",(chunk)=>{
                //console.log("chunk: ",chunk)
                response.push(chunk)
            })
            res.on("end",()=>{
                if (res.statusCode==200){
                    console.log(`${record.id}: OK`)
                    console.log(`response:\n${Buffer.from(...response).toString("utf-8")}`)
                } else {
                    console.log(`${record.id}: FAILED`)
                    console.log(`response:\n${Buffer.from(...response).toString("utf-8")}`)
                }
            })
        })
        req.on("error",(err)=>{
            reject(err)
        })
        req.end(recordBuf)    
    })
}

async function main() {
  const dataList = JSON.parse(await fs.readFile("../data/data-test.json", "utf-8"));
  //const dataList = JSON.parse(await fs.readFile("../data/data.json", "utf-8"));
  
  const all = dataList.map(async (elm) => {
    const record = await generateRecord(elm) 
    await uploadRecord(record)
    //console.log(await generateRecord(elm));
  });
  await Promise.all(all);
}

main().catch((err) => {
  console.log("error in main", err);
});

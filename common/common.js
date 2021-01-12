window.addEventListener("load", () => {
  init();
});

function base2title(base) {
  const [_, udalost, datum, cast] = base.match(
    /([^-]+)-(....-..-..)-part-(..)/
  );
  const nazev = `Událost: ${udalost}, Datum: ${datum}, Část: ${Number(cast) + 1}`;
  return nazev;
}

function base2transcriptUrl(base) {
    return `../data/${base}.wav.transcript.json`
}

function base2mp3Url(base) {
    return `../data/${base}.mp3`
}

async function loadDataList(){
    const res = await fetch("../data/data.json")
    return await res.json();
}

function wordId(resultIdx, wordIdx){
    return `w-${resultIdx}-${wordIdx}`
}

function generateHash(base,second){
    return `${base}:${second}`
}

function parseHash(hash){
    const [_,base,second] = /^#?([^:]+):([0-9]+)$/.exec(hash)
    return {base, second}
}


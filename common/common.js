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


async function loadDataList(){
    const res = await fetch("../data/data.json")
    return await res.json();
}



function wordId(resultIdx, wordIdx){
    return `w-${resultIdx}-${wordIdx}`
}

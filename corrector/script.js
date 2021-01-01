window.addEventListener("load",()=>{
  init()
})

async function init(){
    const player = document.getElementById("player")
    const output = document.getElementById("output")

    await populateSelect()

    player.addEventListener("timeupdate",(ev)=>{
        updatePosition()
    })
}

function base2title(base){
    const [_,udalost,datum,cast]=base.match(/([^-]+)-(....-..-..)-part-(..)/)
    const nazev = `Událost: ${udalost}, Datum: ${datum}, Část: ${Number(cast)+1}`
    return nazev
}

async function populateSelect(){
    const dataList = loadDataList()
    const select = document.getElementById("data-select")
    dataList.forEach((elm)=>{
        //console.log(`Adding ${elm}`)
        const opt = document.createElement("option")
        opt.textContent = base2title(elm)
        opt.dataset.dataId = elm
        opt.value=elm 
        opt.selected = false
        select.appendChild(opt)
    })
    select.value=""
    select.addEventListener("change",()=>{
        const base = select.value 
        const mp3 = `data/${base}.mp3`
        const data = `data/${base}.wav.transcript.json`
        loadText(data)
        const player = document.getElementById("player")
        const source = document.getElementById("audio-src")
        source.src=mp3
        player.currentTime=0
        player.load()
    })

}


// async function loadDataList(){
//     const res = await fetch("data/data.json")
//     const dataList = await res.json();
//     const select = document.getElementById("data-select")
//     dataList.forEach((elm)=>{
//         //console.log(`Adding ${elm}`)
//         const opt = document.createElement("option")
//         opt.textContent = base2title(elm)
//         opt.dataset.dataId = elm
//         opt.value=elm 
//         opt.selected = false
//         select.appendChild(opt)
//     })
//     select.value=""
//     select.addEventListener("change",()=>{
//         const base = select.value 
//         const mp3 = `data/${base}.mp3`
//         const data = `data/${base}.wav.transcript.json`
//         loadText(data)
//         const player = document.getElementById("player")
//         const source = document.getElementById("audio-src")
//         source.src=mp3
//         player.currentTime=0
//         player.load()
//     })
// }

async function updatePosition(){
    const position = player.currentTime
    selectElements(Math.floor(position))
}

let sec2elm=[]
function addWordSpanToIndex(elm,sec){
    if ( ! sec2elm[sec] ){
        sec2elm[sec]=[]
    }
    sec2elm[sec].push(elm)
}

let selectedElms=[]
function selectElements(sec){
    if (selectedElms){
        selectedElms.forEach((elm)=>{
            elm.classList.remove("selected")
        })    
    }
    selectedElms = sec2elm[sec]
    if (selectedElms){
        selectedElms.forEach((elm)=>{
            elm.classList.add("selected")
            elm.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});        
        })
    }
}

let textData;
async function loadText(url){
    const res = await fetch(url)
    textData = await res.json();
    populateText();
}

function populateText() {
    sec2elm=[]
    const audio = document.querySelector("audio");
    const text = document.getElementById("text");
    text.innerHTML=""
    textData.results.forEach((result, resultIdx) => {
        const div = document.createElement("section")
        div.id=`res-${resultIdx}`
        const words = result.alternatives[0].words;
        words.forEach((word, wordIdx) => {
            const wordStartTime = word.startTime.seconds || 0 + ((word.startTime.nanos || 0) / 1e9);
            const wordEndTime = word.endTime.seconds || 0 + ((word.endTime.nanos || 0) / 1e9);
            const startTimeSec = Math.floor(wordStartTime);
            const wordSpan = document.createElement("span");
            wordSpan.classList.add("text")
            wordSpan.id = wordId(resultIdx, wordIdx);
            wordSpan.textContent = `${word.word} `;
            wordSpan.title = `${wordStartTime}-${wordEndTime}s ${wordSpan.id}`;
            wordSpan.contentEditable=true
            wordSpan.addEventListener("dblclick", () => {
                audio.currentTime = wordStartTime;
            });
            wordSpan.addEventListener("input",(ev=>{
                wordSpan.classList.add("changed")
                
            }))
            // wordSpan.addEventListener("mouseup", (ev) => {
            //     console.log("mouseup",ev)
            //     if (ev.button == 2) {
            //         fixWord(resultIdx, wordIdx);
            //         //ev.preventDefault()
            //         return true
            //     }
            // });

            // wordSpan.addEventListener("contextmenu",(ev)=>{
            //     ev.preventDefault()
            // })

            addWordSpanToIndex(wordSpan, startTimeSec);
            // wordSpan.addEventListener("click",()=>{
            // })
            div.appendChild(wordSpan);
        });
        text.appendChild(div)
    });
}

function fixWord(resultIdx,wordIdx){
    console.log(`fixing word:${resultIdx}/${wordIdx}`)
}

function wordId(resultIdx, wordIdx){
    return `w-${resultIdx}-${wordIdx}`
}
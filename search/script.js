
async function init(){
    const player = document.getElementById("player")

    const dataList=await loadDataList()

    player.addEventListener("timeupdate",(ev)=>{
        updatePosition()
    })

    function updatePosition(){
        //todo player advanced
    }
}

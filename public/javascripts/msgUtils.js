"use strict"

/** In questo file saranno raccolte le utility per gestire
 *  la creazione di nuovi messaggi   
 */

/**
 * 
 * @param {*} ts 
 */
function timeString(ts) {
    return ts.getDate()+"/"+(ts.getMonth()+1)
        +"/"+ts.getFullYear()+" "
        +ts.getHours()+":"+ts.getMinutes()+":"
        +ts.getSeconds()
}

/**
 * Realizza un div contenente un messaggio
 * 
 * @param {string} type 
 * @param {string} msg 
 */
function infoMsg(type, msg) {
    type = type.toLowerCase()
    /** Contenitore per allineare il messaggio di
     *  avvertimento
     */
    let div = document.createElement('div')
    div.classList.add("info-msg-container", "text-center",
        "mt-2", "mb-2")
    let msgDiv = document.createElement('div')
    msgDiv.classList.add("info-msg", 'rounded', 'm-auto')
    div.append(msgDiv)
    let content = document.createElement('p')
    msgDiv.append(content)
    
    /** Intestazione del messaggio
     */
    let typeSpan = document.createElement('span')
    typeSpan.classList.add("info-msg-type")
    switch(type) {
        case "info":
            msgDiv.classList.add('bg-info', 'text-white')
            typeSpan.textContent = '[INFO]: '
            break
        case "success":
            msgDiv.classList.add('bg-success', 'text-white')
            typeSpan.textContent = '[SUCCESS]: '
            break
        case "warning":
            msgDiv.classList.add('bg-warning', 'text-dark')
            typeSpan.textContent = '[WARNING]: '
            break
        case "error":
            msgDiv.classList.add('bg-danger', 'text-white')
            typeSpan.textContent = '[ERROR]: '
            break
        default:
            throw new Error("Invalid info message type")
    }
    content.append(typeSpan)
    /** Inserisce il messaggio di avvertimento
     */
    let textMsg = document.createTextNode(msg)
    content.append(textMsg)
    let timeMsg = document.createElement('span')
    timeMsg.classList.add("info-msg-time")
    timeMsg.textContent = ' [' + timeString(new Date()) + ']'
    content.append(timeMsg)
            
    return div
}

/** Dato che Blob e file non si possono trasmettere naturalmente
 *  Socket.io questa funzione serve a convertirli in oggetti 
 *  "equivalenti" che ne contengono il contenuto in ArrayBuffer
 *  e i vari metadati associati.
 * 
 *  Ogni File viene tradotto in un oggetto con la seguente struttura:
 *  {
 *      name, 
 *      type, 
 *      content
 * } 
 * 
 * @param {Array<File>} fileList 
 */
async function makeFileEquivalentObject(filelist) {
    let ans = []
    for(let fileToRead of filelist) {
        let reader = new FileReader()
        let fileBuffer = await new Promise((resolve, reject) => {
            reader.onload = function(evt) {
                resolve([evt.target.result])
            }
            reader.onerror = reject
            reader.readAsArrayBuffer(fileToRead)
        })
        const file = {
            name: fileToRead.name,
            type: fileToRead.type,
            content: fileBuffer
        }
        /**
         * Aggiunge alla risposta il file appena caricato,
         * mi tengo tranquillo per un eventuale di invio di
         * più file insieme
         */
        ans.push(file)
    }

    return ans
}

/** Fa il lavoro inverso della funzione precedente
 * @param {*} feq 
 */
function makeFileFromEquivalentObject(feq) {
    return new File(feq.content, feq.name)
}

/**
 * 
 * @param {*} msg 
 */
function makeAudioDiv(audioArray) {
    let auDiv = document.createElement("div")
    auDiv.classList.add("mb-1")
    let audio = document.createElement("audio")
    let audioBlob = new Blob(audioArray)
    audio.src = URL.createObjectURL(audioBlob)
    audio.controls = true
    auDiv.append(audio)
    return auDiv
}

/** Crea un div che rappresenta il messaggio appena ricevuto
 * 
 * @param {object} msg 
 */
function addMsg(msg) {
    // Creazione del contenitore
    let divMsg = document.createElement("div")
    divMsg.classList.add("msg", "border", "rounded", 
        "mb-2", "bg-primary", "text-white", "p-2",
        "clearfix")
    // Nome di chi ha inviato il messaggio
    let name = document.createElement("p")
    name.classList.add("font-weight-bold", "msg-content", "mb-1")
    name.textContent = msg.auth
    divMsg.append(name)

    //Carousel
    if(msg.msg.carousel) {
        let images = msg.msg.carousel.map(makeFileFromEquivalentObject)
        let msgCarousel = document.createElement('div')
        msgCarousel.classList.add("carousel-space")
        divMsg.append(msgCarousel)
        /** Porcata da fare perché mi serve aspettare che sia connesso
         *  al DOM
         */
        let id = setTimeout(() => {
            clearTimeout(id)
            initCarousel(divMsg, images)
        },0)
    }

    // contenuto testuale
    if(msg.msg.text) {
        let content = document.createElement("p")
        content.classList.add("text-justify", "msg-content", "mb-0")
        content.textContent = msg.msg.text
        divMsg.append(content)
    }
    // file allegati
    if(msg.msg.files) {
        let fileList = document.createElement("ul")
        fileList.classList.add("list-group", "m-0", "font-italic", "mb-1")
        for(let file of msg.msg.files) {
            let li = document.createElement("li")
            li.classList.add("list-group-item", "pt-0", "pb-0")
            let a = document.createElement("a")
            //a.classList.add("text-white")
            li.append(a)
            
            let newFile = makeFileFromEquivalentObject(file)
            a.href = URL.createObjectURL(newFile)
            a.textContent = newFile.name
            a.download = newFile.name

            fileList.append(li)
        }
        divMsg.append(fileList)
    }
    // audio
    if(msg.msg.audio) {
        let auDiv = makeAudioDiv(msg.msg.audio)
        divMsg.append(auDiv)
    }
    
    // orario
    if(msg.msg.ts_send) {
        let timestamp = document.createElement("span")
        timestamp.classList.add("float-right", "ts-msg", "small")
        let ts = new Date(msg.msg.ts_send)
        timestamp.textContent = timeString(ts)
        divMsg.append(timestamp)
    }
    
    return divMsg
}
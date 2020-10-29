"use strict"

/** In questo file saranno raccolte le utility per gestire
 *  la creazione di nuovi messaggi   
 */

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

    let name = document.createElement("p")
    name.classList.add("font-weight-bold", "msg-content", "mb-1")
    name.textContent = msg.auth
    divMsg.append(name)

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
            
            let newFile = new File(file.content, file.name)
            a.href = URL.createObjectURL(newFile)
            a.textContent = file.name
            a.download = file.name

            fileList.append(li)
        }
        divMsg.append(fileList)
    }
    // audio
    if(msg.msg.audio) {
        let audio = document.createElement("audio")
        audio.classList.add("mb-1")
        let audioBlob = new Blob(msg.msg.audio)
        audio.src = URL.createObjectURL(audioBlob)
        audio.controls = true
        divMsg.append(audio)
    }
    
    // orario
    if(msg.msg.ts_send) {
        let timestamp = document.createElement("span")
        timestamp.classList.add("float-right", "ts-msg", "small")
        let ts = new Date(msg.msg.ts_send)
        timestamp.textContent = ts.getDate()+"/"+(ts.getMonth()+1)
            +"/"+ts.getFullYear()+" "
            +ts.getHours()+":"+ts.getMinutes()+":"+ts.getSeconds()
        divMsg.append(timestamp)
    }
    
    return divMsg
}
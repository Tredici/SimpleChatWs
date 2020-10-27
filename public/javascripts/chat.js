const data = {}
const socket = io()

/** Crea un div che rappresenta il messaggio appena ricevuto
 * 
 * @param {object} msg 
 */
function addMsg(msg) {
    // Creazione del contenitore
    let divMsg = document.createElement("div")
    divMsg.classList.add("msg", "border", "rounded", 
        "mb-2", "bg-primary", "text-white", "p-2")

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
        fileList.classList.add("list-group", "m-0", "font-italic")
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

    
    return divMsg
}

$(
    async () => {

        $('#login').submit(e => {
            e.preventDefault()
            let name = $('#name').val()
            $('form#login').addClass('disabled')
            $('form#login input').prop("disabled",true)
            $('form#login input[type="submit"]').remove()
            data.name = name

            /**
             * Invia al server il proprio nome e riceve indietro l'elenco
             * di tutti gli utenti collegati al momento
             */
            socket.emit('logged', {name: name}, (users) => {
                //  Da eseguire dopo il login
                $("main").removeClass('d-none')
                /**
                 * Per la ricezione di messaggi
                 */
                socket.on('new-msg', msg => {
                    let msgDiv = addMsg(msg)
                    $("#messages").append(msgDiv)
                })

                /**
                 * Codice per l'upload di nuovi messaggi
                 */
                $('#chat-form').submit(async e => {
                    e.preventDefault()
                    let form = e.currentTarget
                    //let data = new FormData(form)
                    let text_msg = $('#text-msg').val().trim()
                    let data = {
                        text: text_msg
                    }
                    const filelist = $('#file-msg')[0].files
                    if(filelist.length) {
                        data.files = []
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
                            data.files.push(file)
                        }

                    }
                    socket.emit("msg", data)
                    form.reset()
                })

                /**
                 * Gestione degli utenti connessi al momento
                 */
                for(let user of users) {
                    let li = document.createElement("li")
                    li.classList.add("list-inline-item")
                    li.dataset["userid"] = String(user.id)
                    li.textContent = user.name
                    $('#members').append(li)
                }
                socket.on("join", new_user => {
                    let li = document.createElement("li")
                    li.classList.add("list-inline-item")
                    li.dataset["userid"] = String(new_user.id)
                    li.textContent = new_user.name
                    $('#members').append(li)
                })
                socket.on("leave", leaving_user => {
                    let id = String(leaving_user.id)
                    $('#members li[data-userid="'+id+'"]').remove()
                })
            })
        })
    }
)



const data = {}
const socket = io()

/** Crea un div che rappresenta il messaggio appena ricevuto
 * 
 * @param {object} msg 
 */
function addMsg(msg) {
    let divMsg = document.createElement("div")
    divMsg.classList.add("msg", "border", "rounded", 
        "mb-2", "bg-primary", "text-white", "p-2")

    let name = document.createElement("p")
    name.classList.add("font-weight-bold", "msg-content", "mb-1")
    name.textContent = msg.auth
    let content = document.createElement("p")
    content.classList.add("text-justify", "msg-content", "mb-0")
    content.textContent = msg.msg.text

    divMsg.append(name,content)
    
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
                $('#chat-form').submit(e => {
                    e.preventDefault()
                    let form = e.currentTarget
                    //let data = new FormData(form)
                    let text_msg = $('#text-msg').val().trim()
                    let data = {
                        text: text_msg
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



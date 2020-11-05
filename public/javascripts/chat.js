const data = {}
const socket = io()
/** Per errori di connessione
 */
socket.on('connect_error', (error) => {
    let message = infoMsg('error', "[connect_error] "
        +error)
    $("#start").append(message)
})
/** Per timeout nella connessione
 */
socket.on('connect_timeout', (timeout) => {
    let message = infoMsg('error', "[connect_timeout] "
        +timeout)
    $("#start").append(message)
})

let audio_msg = undefined
let pic_msg = undefined
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
                /**
                 * Rende visibile la zona per per chattare
                 */
                $("main").removeClass('d-none')
                /**
                 * Visualizza il messaggio che evidenzia che
                 *  la connessione è stata stabilita
                 */
                let loginMessage = infoMsg('info', 'logged!')
                $("#messages").append(loginMessage)
                
                /** Per avvertire che ci si è disconnessi
                 */
                socket.on('disconnect', (reason) => {
                    let message = infoMsg('info', '[disconnected] '
                        +reason)
                    $("#messages").append(message)
                })
                /** Per i tentativi di riconnessione
                 */
                socket.on('reconnecting', (attemptNumber) => {
                    let message = infoMsg('info', '[reconnecting] '
                        +attemptNumber)
                    $("#messages").append(message)
                })
                /** Per riconnessione fallita
                 */
                socket.on('reconnect_failed', () => {
                    let message = infoMsg('info', '[reconnect_failed]')
                    $("#messages").append(message)
                })
                /** Per errori nel funzionamento
                 */
                socket.on('error', (error) => {
                    let message = infoMsg('error', "[error] "+error)
                    $("#messages").append(message)
                })

                /** Per la ricezione di messaggi
                 */
                socket.on('new-msg', msg => {
                    let msgDiv = addMsg(msg)
                    msgDiv.classList.add("mr-4", "bg-secondary")
                    $("#messages").append(msgDiv)
                })

                /**
                 * Controllo del bottone per registrare
                 *  audio
                 */
                function initRecording() {
                    $("button#audio-msg").click(async e => {
                        //per evitare il problema della doppia chiamata
                        $("button#audio-msg").off()
                        let button = document.getElementById('audio-msg')
                        
                        button.disabled = true
                        audio_msg = undefined
                        let stream
                        let constraints = { audio: true, video: false }
                        try {
                            stream = await navigator.mediaDevices
                            .getUserMedia(constraints)
                        } catch(err) {
                            button.disabled = false
                            button.classList.add('btn-danger')
                            console.error(err)
                            return
                        }
                        /**
                         * Registratore dell'audio
                         */
                        let mediaRecorder = new MediaRecorder(stream)
                        /**
                         * Array dell'audio registrato
                         */
                        let recordedAudio = []
                        mediaRecorder.ondataavailable = (e) => {
                            recordedAudio.push(e.data)
                        }

                        mediaRecorder.start()
                        button.classList.add('btn-warning')
                        button.textContent = "Ferma"
                        button.disabled = false
                        $('form#chat-form input[type="submit"]')[0].disabled = true
                        /**
                         * Sospende la funazione fino al prossimo click
                         */
                        await new Promise(resolve => {
                            button.addEventListener('click', e => {
                                e.preventDefault()
                                e.stopPropagation()
                                mediaRecorder.stop()
                                stream.getTracks().forEach(track => track.stop())
                                /**
                                 * porcata per ottenere i dati
                                 * della registrazione
                                 */
                                window.setTimeout(resolve, 0)
                            }, {
                                capture: true,
                                once: true
                            })
                        })
                        /**
                         * rende globalmente accessibili i 
                         */
                        audio_msg = recordedAudio
                        let audio = makeAudioDiv(recordedAudio)
                        audio.id = "audio-msg"
                        button.parentElement.replaceChild(audio, button)
                        
                        $('form#chat-form input[type="submit"]')[0].disabled = false
                    })
                }
                initRecording()
                
                /** Per il drag&drop
                 */
                $('#chat-form').on("dragenter", e => e.preventDefault())
                $('#chat-form').on("dragover", e => e.preventDefault())
                $('#chat-form').on("drop", async e => {
                    let form = e.currentTarget
                    e.preventDefault()
                    console.log(e)
                    let draggedFiles = e.originalEvent.dataTransfer.files
                    let imageFiles = []
                    for(let f of draggedFiles) {
                        if(!f.type.startsWith("image/")) continue
                        imageFiles.push(f)
                    }
                    initCarousel(form, imageFiles)
                    pic_msg = imageFiles
                })

                /**
                 * Per gestire il reset della form
                 */
                $('#chat-form').on('reset', e => {
                    let form = e.currentTarget
                    /** Reset del carousel
                     */
                    $(".carousel-space", form).empty()
                    /** Reset dell'audio
                     */
                    audio_msg = undefined
                    /** Reset dell'elemento riferimento per le
                     *  collezioni
                     */
                    pic_msg = undefined
                    /**
                     * Crea un nuovo bottone per le registrazioni
                     */
                    let button = document.createElement('button')
                    button.classList.add("btn","btn-success")
                    button.id = "audio-msg"
                    button.type = "button"
                    button.textContent = "Registra"
                    $("#audio-msg").replaceWith(button)
                    // reset dell'audio
                    initRecording()
                })
                /**
                 * Codice per l'upload di nuovi messaggi
                 */
                $('#chat-form').submit(async e => {
                    e.preventDefault()
                    let form = e.currentTarget
                    /**
                     * Contiene i dati da inviare
                     */
                    let data = {}
                    /**
                     * vale true se l'utente ha effetivamente inserito 
                     * dei contenuti nella form da inviare, se false
                     * non invia nulla
                     */
                    let ready = false
                    /**
                     * Per trasferire il testo
                     */
                    let text_msg = $('#text-msg').val().trim()
                    if(text_msg) {
                        ready |= true
                        data.text = text_msg
                    }
                    /**
                     * Per gli eventuali file allegati
                     */
                    const filelist = $('#file-msg')[0].files
                    if(filelist.length) {
                        ready |= true
                        data.files = await makeFileEquivalentObject(filelist)
                    }
                    /**
                     * Per gestire le eventuali registrazioni audio
                     */
                    if(audio_msg) {
                        ready |= true
                        data.audio = audio_msg
                    }
                    
                    /** Per gestire l'eventuale carousel di foto
                     */
                    if(pic_msg) {
                        ready |= true
                        data.carousel = await makeFileEquivalentObject(pic_msg)
                    }

                    /**
                     * Se non ci sono contenuti non invia nulla
                     */
                    if(!ready) return
                    /**
                     * Timestamp inoltro
                     */
                    data.ts_send = Date.now()
                    /**
                     * Invia il messaggio a tutti gli altri
                     * e poi lo aggiunge anche nella chat corrente
                     */
                    socket.emit("msg", data, (msg) => {
                        /**
                         * Personalizza il messaggio per il
                         * sender
                         */
                        let msgDiv = addMsg(msg)
                        msgDiv.classList.add("ml-4")
                        $("#messages").append(msgDiv)
                    })
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
                    // Messaggio a video
                    let message = infoMsg('info', "[JOINED] "
                        +new_user.name)
                    $("#messages").append(message)
                })
                socket.on("leave", leaving_user => {
                    let id = String(leaving_user.id)
                    $('#members li[data-userid="'+id+'"]').remove()
                    // Messaggio a video
                    let message = infoMsg('info', "[LEFT] "
                        +leaving_user.name)
                    $("#messages").append(message)
                })
            })
        })
    }
)



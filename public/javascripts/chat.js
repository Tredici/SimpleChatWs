const data = {}
const socket = io()

let audio_msg = undefined
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
                        button.disabled = false
                        button.textContent = "Ferma"
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
                        let audioBlob = new Blob(recordedAudio)
                        let audio = document.createElement('audio')
                        audio.id = "audio-msg"
                        audio.controls = true
                        audio.src = URL.createObjectURL(audioBlob)
                        button.parentElement.replaceChild(audio, button)
                        
                        $('form#chat-form input[type="submit"]')[0].disabled = false
                    })
                }
                initRecording()
                
                /**
                 * Per gestire il reset della form
                 */
                $('#chat-form').on('reset', e => {
                    /**
                     * Reset dell'audio
                     */
                    audio_msg = undefined
                    /**
                     * Crea un nuovo bottone per le registrazioni
                     */
                    let button = document.createElement('button')
                    button.id = "audio-msg"
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
                     * Per trasferire il testo
                     */
                    let text_msg = $('#text-msg').val().trim()
                    let data = {
                        text: text_msg
                    }
                    /**
                     * Per gli eventuali file allegati
                     */
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
                    /**
                     * Per gestire le eventuali registrazioni audio
                     */
                    if(audio_msg) {
                        data.audio = audio_msg
                    }

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
                })
                socket.on("leave", leaving_user => {
                    let id = String(leaving_user.id)
                    $('#members li[data-userid="'+id+'"]').remove()
                })
            })
        })
    }
)



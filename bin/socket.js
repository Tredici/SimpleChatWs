"use strict"

const socket = require('socket.io')

const users = new Map()

function sendAll(evNm, data) {
    for(let pair of users) {
        let conn = pair[0]
        conn.emit(evNm, data)
    }
}

function WRT(io) {
    const RTCNamespace = io.of('/RTC')
    RTCNamespace.on('connect', ws => {
        ws.join('online', () => {
            /**
             * Per iniziare
             */
            ws.on('start', (data, done) => {
                data.who = socket.id
                console.log('start:', data)
                ws.to('online').emit('new', data)
                done("send")
            })
            /**
             * Per rispondere
             */
            ws.on('accept', (data, done) => {
                data.who = socket.id
                console.log('accept:', data)
                ws.to('online').emit('accepted', data)
                done("Ready")
            })
            /**
             * A quanto pare bisogna informare urbi
             *  et orbi dei "candicati"
             */
            ws.on('candidate', candidate => {
                ws.to('online').emit('candidate', candidate)
            })
        })
    })
}

module.exports = function(http) {
    /**
     * contatore di connessione
     */
    let counter = 0

    let io = socket(http)
    
    /**
     * Per sperimentare per la comunicazione real time
     */
    WRT(io)

    io.on('connection', (ws) => {
        /**
         * Aggiunge il collegamento al pool 
         */ 
        users.set(ws, {logged:false, id:counter++})

        ws.on('disconnect', () => {
            let data = users.get(ws)
            users.delete(ws)
            const who = {
                id: data.id,
                name: data.name
            }
            sendAll("leave", who)
        })

        /**
         * Si attiva quando un utente si connette
         * 
         * done() è la la funzione da invocare per
         *  fornire al chiamante l'elenco dei 
         *  partecipanti 
         */
        ws.on("logged", (login_data, done) => {
            let data = users.get(ws)
            /**
             * Per evitare che si utilizzi più volte
             */
            if(data.logged) return
            data.logged = true
            data.name = login_data.name

            /**
             * Si unisce alla room per la chat globale
             */
            ws.join('global-chat')

            /**
             * Dati che descrivono il ws che si sta
             *  unendo
             */
            const joining = {
                id: data.id,
                name: data.name
            }
            
            /**
             * Broadcast di un nuovo messaggio
             */
            ws.on("msg", (msg, done) => {
                let new_msg = {
                    auth: users.get(ws).name,
                    msg: msg
                }
                // invia prima a tutti gli altri
                ws.to('global-chat').emit("new-msg", new_msg)
                // poi conferma l'invio
                done(new_msg)
            })

            /**
             * Array di utenti loggati
             */
            const ans = []
            for(let pair of users) {
                let data = pair[1]
                /**
                 * Scarta i non loggati e se stesso
                 */
                if(!data.logged || ws === pair[0]) continue
                let other = pair[0]
                let user = {
                    id: data.id,
                    name: data.name
                }
                ans.push(user)
                /**
                 * Avverte l'altro del nuovo join
                 */
                other.emit("join", joining)
            }
            done(ans)

        })
    })
}
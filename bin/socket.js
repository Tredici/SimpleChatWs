"use strict"

const path = require('path')
const socket = require('socket.io')

const chatroom = require(path.join(__dirname, "chatroom"))

const users = new Map()

function sendAll(evNm, data) {
    for(let pair of users) {
        let conn = pair[0]
        conn.emit(evNm, data)
    }
}

module.exports = function(http) {
    /**
     * contatore di connessione
     */
    let counter = 0

    let io = socket(http)
    // Inizializza il namespace
    // per la chatroom (tutti online insieme)
    chatroom(io)
    // Inizializza il namespace principale per
    // la chat principale
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
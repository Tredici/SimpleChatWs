"use strict"

const socket = require('socket.io')

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
             * Dati che descrivono il ws che si sta
             *  unendo
             */
            const joining = {
                id: data.id,
                name: data.name
            }
            

            /**
             * 
             */
            ws.on("msg", (msg) => {
                let new_msg = {
                    auth: users.get(ws).name,
                    msg: msg
                }

                sendAll("new-msg", new_msg)
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
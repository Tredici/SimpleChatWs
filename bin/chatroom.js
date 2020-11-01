"use strict"

/** Per la chatroom, io è l'oggetto base
 *  per gestire i websocket
 * 
 * @param {*} io 
 */
module.exports = function(io) {
    const nms = io.of('/chatroom')

    const rooms = new Map()

    nms.on('connect', (ws) => {
        
        /**
         * Gestione di tutte le connessioni
         */
        ws.once('join', (room, done) => {
            ws.join(room)
            let userId = ws.id
            let group
            /** Per comunicazione 1-1
             */
            ws.on('sendTo', (who, what, whit, done) => {
                if(!group.has(who)) {
                    // il tipo è assente
                    console.error("Not found:",
                        who, what, whit)
                    done('404')
                } else {
                    /** Invia solo al 
                     *  destinatario
                     */
                    let skt = group.get(who)
                    skt.emit(what, whit)
                    done()
                }
            })
            if(!rooms.has(room)) {
                group = new Map()
                rooms.set(room, group)
            } else {
                group = rooms.get(room)
            }
            group.set(userId, ws)
            /** Quando si disconnette avverte
             *      tutti gli altri
             */
            ws.once('disconnect', () => {
                group.delete(userId)
                if(!group.size) {
                    rooms.delete(room)
                } else {
                    ws.to(room).emit('leave', userId)
                }
            })
            /** Comunica agli altri che si è
             *  aggiunto
             */
            ws.to(room).emit('new', {id: userId})
            done(userId)
        })
    })
}

"use strict"

const debug = require('debug')('simplechatws:chatroom')

/** Per la chatroom, io è l'oggetto base
 *  per gestire i websocket
 * 
 * @param {*} io 
 */
module.exports = function(io) {
    const nms = io.of('/chatroom')

    let custom_id = 0
    io.engine.generateId = (req) => {
        return "custom_id_" + custom_id++; // custom id must be unique
    }

    const rooms = new Map()
    const users = new Map()

    nms.on('connect', (ws) => {
        
        /**
         * Gestione di tutte le connessioni
         */
        ws.once('join', (room, done) => {
            ws.join(room)
            let userId = ws.id
            let group
            debug("join:", userId, room)
            /** Lega un utente alla sua room
             */
            users.set(userId, room)
            /** Per comunicazione 1-1
             */
            ws.on('sendTo', (who, what, whit, done) => {
                debug('sendTo:', who, what)
                let userId = ws.id
                let room = users.get(userId)
                let group = rooms.get(room)
                if(!group.has(who)) {
                    // il tipo è assente
                    console.error("Not found:",
                    who, what)
                    debug("group:", ...group.keys())
                    done('404')
                } else {
                    /** Invia solo al 
                     *  destinatario
                     */
                    let skt = group.get(who)
                    skt.emit(what, userId, whit)
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

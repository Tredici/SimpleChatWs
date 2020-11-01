"use strict"

/** Si collega  al namespace
 */
const socket = io('/chatroom')

function addVideo(id, stream) {
    let audio = document.createElement('audio')
    audio.controls = true
    audio.id = id
    audio.srcObject = stream

    return audio
}

function removeVideo(id) {
    $('#'+id).remove()
}

/** Id della room, nell'url
 */
let roomId 
/** Id dell'utente
 */
let userId

/**
 * Politica da seguire:
 *  +quando un nuovo entra:
 *      comunica a tutti gli altri che è arrivato
 *      gli altri individualmente lo contattano 
 *          facendo loro l'offerta per il P2P
 *      
 *      "chi entra riceve, chi c'è già offre"
 *      
 */

 
 /** Usata per inviare uno specifico evento a un
  *     dato socket (connessione 1-1)
  * 
  * @param {*} who  -   a chi inviare
  * @param {*} what -   quale evento
  * @param {*} whit -   dati da allegare
  * @param {*} done -   per conferma,
  *     senza argomenti se tutto va bene
  */
function sendTo(who, what, whit, done) {
    socket.emit('sendTo', who, what, whit, done)
}

/** Gestisce tutto l'handshake
 * 
 * @param {*} data 
 */
function onNew(data) {
    // nuovo
    let newUser = data.id
    // inizia a preparare la connessione
    let P2P = new RTCPeerConnection()
}

$(async () => {
    roomId = $('#room').data('id')

    let stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
    $('video#video')[0].srcObject = stream

    /** comunica agli altri che si è unito
     *      e riceve alla fine il suo id
     */
    socket.emit('join', room, id => userId = id)
    /** Per quando uno se ne va
     */
    socket.on('leave', id => {
        removeVideo(id)
    })
    /** Per quando si unisce uno nuovo
     */
    socket.on('new', onNew)
})

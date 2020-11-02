"use strict"

/** Si collega  al namespace
 */
const socket = io('/chatroom')

function addVideo(id, stream) {
    let video = document.createElement('video')
    video.controls = true
    video.dataset.userid = id
    video.srcObject = stream
    $('#room').append(video)
    if(video.paused)
        video.play()
    return video
}

function removeVideo(id) {
    $('[data-userid="'+id+'"]').remove()
}

/** Id della room, nell'url
 */
let roomId 
/** Id dell'utente
 */
let userId
/** Stream audio e video da trasmettere poi
 */
let stream

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


/**
 * Per la connessione tra pari
 */
const config = {
    iceServers: [/*{
        urls: ["stun:stun.l.google.com:19302"]
    }*/]
};
const config2 = { 
    optional: [{RtpDataChannels: true}] 
}

/** Per tenere traccia di tutti i pari
 */
const peers = new Map()

/** Gestisce tutto l'handshake
 * 
 * @param {*} data 
 */
async function onNew(data) {
    // nuovo
    let newUser = data.id
    // inizia l'handshake
    await startHandshake(newUser)
}
/** Per modularità
 */
async function startHandshake(newUser) {
    // inizia a preparare la connessione
    let P2P = new RTCPeerConnection(config, config2)
    // aggiunge il pari al gruppo
    peers.set(newUser, P2P)
    // questione degli candidati ICE
    P2P.onicecandidate = event => {
        if (event.candidate) {
            console.log("candidate", event.candidate)
            sendTo(newUser, "candidate", event.candidate, () => {})
        }
    }
    /** Bisogna attaccare gli stream per la trasmissione
     */
    stream.getTracks().forEach(
        track => P2P.addTrack(track, stream)
    )
    /** Arrivato a questo punto serve inviare l'offerta
     */
    // la prepara
    let offer = await P2P.createOffer()
    // setta le impostazioni locali
    await P2P.setLocalDescription(offer)
    // prende il pacchetto da inviare
    let requestToExcange = P2P.localDescription
    // lo invia
    sendTo(newUser, 'offer', {offer: requestToExcange}, 
        () => console.log('Offer sent'))
}

/** Per accettare un'offerta
 */
socket.on("offer", async (who, data) => {
    /** Chi riceve un'offerta non possiede ancora un canale
     *  di comunicazione verso l'offerente
     */
    // se lo crea
    let P2P = new RTCPeerConnection(config, config2)
    // lo aggiunge al gruppo
    peers.set(who, P2P)
    P2P.onicecandidate = event => {
        if (event.candidate) {
            console.log("candidate", event.candidate)
            sendTo(who, "candidate", event.candidate, () => {})
        }
    }
    // attacca gli stream
    stream.getTracks().forEach(
        track => P2P.addTrack(track, stream)
    )
    /** "Accetta" l'offerta
     */
    let offer = data.offer
    await P2P.setRemoteDescription(
        new RTCSessionDescription(offer))
    /** crea la risposta
     */
    let answer = await P2P.createAnswer()
    await P2P.setLocalDescription(answer)
    sendTo(who, 'answer', {answer: answer}, 
        () => console.log('answer sent'))

    // lega il video
    linkStream(who, P2P)
})
/** Per gestire una risposta
 */
socket.on("answer", async (who, data) => {
    let P2P = peers.get(who)
    await P2P.setRemoteDescription(
        new RTCSessionDescription(data.answer))
    // lega il video
    linkStream(who, P2P)        
})

/** Prende il collegamento P2P e ne estrae
 *  gli stream per creare poi un elemento
 *  audio
 * 
 * @param {*} who 
 * @param {*} P2P 
 */
function linkStream(who, P2P) {
    // Stream da associare poi al video
    let stream = new MediaStream()
    // accede ai gestori delle track
    let rcvs = P2P.getReceivers()
    // riempie lo stream
    rcvs.forEach(rcv => stream.addTrack(rcv.track))
    // aggiunge l'elemento audio
    return addVideo(who, stream)
}


/** Per quel seccante scambio di candidati
 */
socket.on("candidate", async (who, candidate) => {
    let P2P = peers.get(who)
    await P2P.addIceCandidate(new RTCIceCandidate(candidate))
})

$(async () => {
    roomId = $('#room').data('id')

    stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
    $('video#video')[0].srcObject = stream
    /** Per quando si unisce uno nuovo
     */
    socket.on('new', onNew)
    /** Per quando uno se ne va
     */
    socket.on('leave', id => {
        if(peers.delete(id))
            removeVideo(id)
    })

    /** comunica agli altri che si è unito
     *      e riceve alla fine il suo id
     */
    socket.emit('join', roomId, id => userId = id)
})

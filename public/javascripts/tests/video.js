"use strict"

/**
 * Perla trasmissione tra pari ho seguito le istruzioni qui:
 *  https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
 */

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

let myPeerConnection

 

/** TEST
 * Per capire se riceve uno stream
 */
function buildP2P() {
    let myPeerConnection = new RTCPeerConnection(config, config2)
    myPeerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("candidate", event.candidate)
            socket.emit("candidate", event.candidate)
        }
    }
    /*myPeerConnection.ontrack = (e) => {
        console.log("Track event!", e)
    }
    myPeerConnection.ondatachannel = function(ev) {
        console.log('Data channel is created!');
        ev.channel.onopen = function() {
          console.log('Data channel is open and ready to be used.');
        };
    };*/
    return myPeerConnection
}
/*var dataChannelOptions = { 
    reliable:true 
};
let ch = myPeerConnection.createDataChannel('data',
    dataChannelOptions)
    ch.onerror = function (error) { 
        console.log("Error:", error); 
};
ch.onmessage = function (event) { 
    console.log("Got message:", event.data); 
};*/

/**
 * Per il broadcast delle informazioni
 */
const socket = io('/RTC')
socket.on("candidate", (candidate) => {
    myPeerConnection
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e))
})

socket.on('new', async (data, done) => {
    /**
     * Evita race
     */
    $("#avvia")[0].disabled = true
    console.log('new:', data)
    // prepara la connessione lato client
    myPeerConnection = buildP2P()
    // riceve l'offerta
    await myPeerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer))
    // fa cose, tipo attaccare i suoi stream - TODO

    // crea la rispsta
    let answer = await myPeerConnection.createAnswer()
    await myPeerConnection.setLocalDescription(answer)

    // deve inviare all'altro le info adesso
    socket.emit("accept", {answer: answer}, async (msg) => {
        console.log('accept:', msg)
        /**
         * ora prova a connettere il video
         */
        // prende i ricettori delle varie tracce
        let receivers = myPeerConnection.getReceivers()
        //crea e riempie una track per l'audio
        let rcvdStream = new MediaStream()
        receivers.forEach(rcv => rcvdStream.addTrack(rcv.track))
        for(let rcv of receivers) {
            rcvdStream.addTrack(rcv.track)
            let stats = await rcv.getStats()
            console.log("recv:", rcv, stats)
        }
        //prova ad attaccarla al video
        let remoteVideo = $('#videoOther')[0]
        remoteVideo.srcObject = rcvdStream
        remoteVideo.addEventListener('loadedmetadata', () => {
            console.log("Ready to play")
            remoteVideo.play()
        })

        //debugger
        //$('#videoOther')[0].srcObject = 
        
    })
    // per vedere se effettivamente funziona
    //debugger
})

$("#avvia").click(async e => {
    /** Bottone premuto
     */
    let button = e.currentTarget
    button.disabled = true
    
    /** Conterrà il MediaStream fornito dal browser
     */
    let stream
    /** Opzioni per chiedere al browser di registrare
     */
    let constraints = { audio: true, video: true }
    /** Prova a richiedere lo stream
     */
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
     * Attacca il video a <video>
     */
    $('#video')[0].srcObject = stream

    /**
     * Per la trasmissione remota
     *
     */
    myPeerConnection = buildP2P()
    /*myPeerConnection = new RTCPeerConnection(config, config2)
    myPeerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("candidate", event.candidate);
        }
    };*/
    
    let rtpSender 
    stream.getTracks().forEach(
        track => rtpSender = myPeerConnection
           .addTrack(track, stream)
    )
    /**
     * Crea l'offerta di trasmissione
     */
    let offer = await myPeerConnection.createOffer()
    await myPeerConnection.setLocalDescription(offer)
    let requestToExcange = myPeerConnection.localDescription
    console.log(requestToExcange)

    socket.emit('start', {offer: requestToExcange}, (msg) => {
        console.log(msg)

    })
    // deve aspettare l'accettazione
    socket.once('accepted', async (data) => {
        console.log('accepted:', data)
        //debugger
        await myPeerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer))
        //debugger
    })

    return
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
    /** MediaStream che dovrebbe "alimentare" il 
     *  l'elemento video
     */
    let videoStream = new MediaStream()
})

$("#avvia").onclick(async e => {
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
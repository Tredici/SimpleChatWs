"use strict"

/**
 * Contiene funzioni per interagire con l'utente
 * Non opera direttamente ma le funzioni che esplone 
 *  verranno chiamate dagli altri file JS
 */

 /** Fornisce tutte le classi associate a
  *  un oggetto che rispettano un dato
  *  pattern
  * 
  * @param {DOMElement} el 
  * @param {string} rgx 
  */
function getClasses(el, pattern) {
    // costruisce l'espressione regolare
    let reg = RegExp(pattern)
    // trova tutte le classi che la rispettano
    let ans = Array.from(el.classList).filter(el=> reg.test(el))
    return ans
}
/** Ritorna tutte le classi bootstrap per
 *  applicare effetti ai bottoni
 *  
 * @param {DOMElement} el 
 */
function getBtnClasses(el) {
    return getClasses(el, '^btn-')
}

/** RImuove tutte le classi bootstrap
 *  per personalizzare i bottoni, 
 *  ovvero quelle "btn-*"
 * 
 * 
 * @param {*} el 
 */
function rmBtnClasses(el) {
    let toRm = getBtnClasses(el)
    el.classList.remove(...toRm)
    return el
}

/** Serve ad attivare o disabilitare la 
 *  trasmissione del video
 * 
 * @param {Event} e 
 */
function flipVideo(e) {
    // Prende il bottone
    let button = e.currentTarget
    // prende le tracce video tramesse
    let vt = stream.getVideoTracks()
    // controlla che ci siano tracce video
    if(!vt.length) {
        throw new Error("No video tracks!")
    }
    let nxtStat = !vt[0].enabled
    // gestisce le varie track
    vt.forEach(track => track.enabled = nxtStat)
    // imposta il nuovo stato del bottone
    rmBtnClasses(button)
    // aggiorna la decorazione del bottone
    if(nxtStat) {
        button.classList.add('btn-success')
    } else {
        button.classList.add('btn-danger')
    }
}
/** Come sopra ma per l'audio
 * 
 * @param {*} e 
 */
function flipAudio(e) {
    // Prende il bottone
    let button = e.currentTarget
    // prende le tracce audio tramesse
    let at = stream.getAudioTracks()
    // controlla che ci siano tracce audio
    if(!at.length) {
        throw new Error("No audio tracks!")
    }
    let nxtStat = !at[0].enabled
    // gestisce le varie track
    at.forEach(track => track.enabled = nxtStat)
    // imposta il nuovo stato del bottone
    rmBtnClasses(button)
    if(nxtStat) {
        button.classList.add('btn-success')
    } else {
        button.classList.add('btn-danger')
    }
}


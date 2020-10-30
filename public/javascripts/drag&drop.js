"use strict"

/** File di utility per gestire la componente di drag&drop
 *  delle immagini + carousel
 */

/** Posiziona il carousel in cima alla form
 * @param {*} images 
 */
function initCarousel(form, images) {
    // Svuota
    $("#carousel", form).empty()
    // Individua dove mettere il carousel
    let place = $("#carousel", form)[0]
    // Costruisce il carousel
    let carousel = buildCarousel(images)
    // Lo posiziona
    place.append(carousel)
    // Lo avvia
    $('.carousel', place).carousel()
    return place
}

 /** Realizza il carousel di immagini da
  *     posizionare poi sopra la form
  * 
  * @param {Array<img Files>} images 
  */
function buildCarousel(images) {
    if(!Array.isArray(images)) throw new Error("")

    let carDiv = document.createElement('div')
    carDiv.id = "controls"
    carDiv.classList.add("carousel", "slide")
    //carDiv.dataset.ride = "carousel"

    let carInner = document.createElement('div')
    carInner.classList.add("carousel-inner")
    carDiv.append(carInner)

    /** Riempimento con le immagini
     */
    let active = false
    for(let image of images) {
        let item = document.createElement('div')
        item.classList.add("carousel-item")
        if(!active) {
            item.classList.add("active")
            active = true
        }
        let img = document.createElement('img')
        img.src = URL.createObjectURL(image)
        img.classList.add('w-100')
        item.append(img)

        carInner.append(item)
    }

    /** Aggiunta dei bottoni per lo scorrimento tra le immagini
     */
    {
        // sinistra
        let aPrev = document.createElement('a')
        aPrev.href = "#controls"
        aPrev.setAttribute("role", "button")
        aPrev.dataset.slide = "prev"
        aPrev.classList.add('carousel-control-prev')
        let frecciaSinistra = document.createElement('span')
        aPrev.append(frecciaSinistra)
        frecciaSinistra.classList.add('carousel-control-prev-icon')
        frecciaSinistra.setAttribute('aria-hidden', "true")
        carDiv.append(aPrev)
    }
    {
        // destra
        let aNext = document.createElement('a')
        aNext.href = "#controls"
        aNext.setAttribute("role", "button")
        aNext.dataset.slide = "next"
        aNext.classList.add('carousel-control-next')
        let frecciaDestra = document.createElement('span')
        aNext.append(frecciaDestra)
        frecciaDestra.classList.add('carousel-control-next-icon')
        frecciaDestra.setAttribute('aria-hidden', "true")
        carDiv.append(aNext)
    }
    
    return carDiv
}
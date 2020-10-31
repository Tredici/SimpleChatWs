"use strict"

/** File di utility per gestire la componente di drag&drop
 *  delle immagini + carousel
 */

/** Posiziona il carousel in cima alla form
 * @param {*} images 
 */
function initCarousel(element, images) {
    // Svuota
    $(".carousel-space", element).empty()
    // Individua dove mettere il carousel
    let place = $(".carousel-space", element)[0]
    // Costruisce il carousel
    let carousel = buildCarousel(images)
    // Lo posiziona
    place.append(carousel)
    // Lo avvia
    $('.carousel', place).carousel({
        interval: 5000,
        pause: 'hover',
        ride: 'carousel'
    })
    return place
}

/** Genera una stringa pseudocasuale
 */
function randomId() {
    return "controls-"+Math.random().toString().substr(2)
}

function buildArrow(carouselID, direction) {
    let aArrow = document.createElement('a')
    aArrow.href = "#"+carouselID
    aArrow.setAttribute("role", "button")
    aArrow.dataset.slide = direction
    aArrow.classList.add('carousel-control-'+direction)
    let spanArrow = document.createElement('span')
    aArrow.append(spanArrow)
    spanArrow.classList.add('carousel-control-'+direction+'-icon')
    spanArrow.setAttribute('aria-hidden', "true")
    return aArrow
}

/** Realizza e ritorna un "div.carousel-item"
 * 
 * @param {Files} image
 */
function buildCarouselItem(image) {
    let item = document.createElement('div')
    item.classList.add("carousel-item", 'h-100')
    // Contenitore dell'immagine
    let imgContainer = document.createElement('div')
    imgContainer.classList.add('w-100', 'd-block', 
        'bg-dark', 'text-center', 'h-100')
    item.append(imgContainer)
    // Immagine
    let img = document.createElement('img')
    img.classList.add('m-auto', 'mh-100', 
        'd-inline-block', 'mw-100', 'align-middle')
    img.src = URL.createObjectURL(image)
    imgContainer.append(img)
    return item
}

 /** Realizza il carousel di immagini da
  *     posizionare poi sopra la form
  * 
  * @param {Array<img Files>} images 
  */
function buildCarousel(images) {
    if(!Array.isArray(images)) throw new Error("")

    let carouselID = randomId()
    let carDiv = document.createElement('div')
    carDiv.id = carouselID
    carDiv.classList.add("carousel", "slide")
    //carDiv.dataset.ride = "carousel"

    let carInner = document.createElement('div')
    carInner.classList.add("carousel-inner")
    carInner.style.height = "5cm"
    carDiv.append(carInner)

    /** Riempimento con le immagini
     */
    let active = false
    for(let image of images) {
        let item = buildCarouselItem(image)
        if(!active) {
            item.classList.add("active")
            active = true
        }

        carInner.append(item)
    }

    /** Aggiunta dei bottoni per lo scorrimento tra le immagini
     */
    let leftArrow = buildArrow(carouselID, 'prev')
    carDiv.append(leftArrow)
    let rightArrow = buildArrow(carouselID, 'next')
    carDiv.append(rightArrow)
    
    return carDiv
}
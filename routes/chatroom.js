const express = require('express');
const router = express.Router();

const { v4: uuidv4, v4 } = require('uuid')

/* GET home page. */
router.get('/', function(req, res, next) {
    let path = req.originalUrl
    if(path[ path.length-1 ] !== '/')
        path += '/'

    path += v4()
    console.log(path)
    res.redirect(path);
});

router.get('/:roomId', (req, res) => {
    res.remder('chatroom', {title: "chatroom", roomId: req.params.roomId})
})

module.exports = router;

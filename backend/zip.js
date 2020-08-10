require('dotenv').config()
var archiver   = require('archiver');
var dateFormat = require('./dateFormat.js')
var fs         = require('fs')
var path       = require('path')
var moment     = require('moment')
const {
    sendAlert,
    randomID,
    filterList,
    fileName
}              = require('./converter.js');
const { send } = require('process');

const createZipList = (camera, start, end) => {
    var archive = archiver('zip', {
        zlib: {level: 9}
    })

    const filteredList = filterList(camera, start, end)

    const frames = filteredList.length    

    console.log(start.split('-')[0], start.split('-')[1], end.split('-')[0], end.split('-')[1])
    
    for (const file of filteredList){
        archive.file(path.resolve(process.env.imgDir, camera, file), {
            name: file
        }) 
    }

    return {frames, archive}
};

const zip = (archive, camera, frames, start, end, save, req, res) => {

    const rand = randomID()

    if(frames == 0){
        if(save){
            sendAlert(`Zip Process:\nID: ${rand}\nCamera: ${camera}\nNot started: has ${frames} frames`)
        }
        else{
            res.send(JSON.stringify({
                id: rand,
                url: undefined
            }))
        }
    }
    else{
        if(save){
            var output = fs.createWriteStream(`${process.env.imgDir}/${fileName(camera, start, end, rand, 'zip')}`)
        
            console.log("SENDING START ALERT")
            sendAlert(`ZIP Started:\nID: ${rand}\nCamera: ${camera}\nFrames: ${frames}\nStart: ${moment(start, dateFormat).format("dddd, MMMM Do YYYY, h:mm:ss a")}\nEnd: ${moment(end, dateFormat).format("dddd, MMMM Do YYYY, h:mm:ss a")}`)

            output.on('close', function() {
                console.log("SENDING END ALERT")
                sendAlert(`Your zip archive (${rand}) is finished. Download it at: http://${process.env.host}:${process.env.PORT}/shared/captures/${fileName(camera, start, end, rand, 'zip')}`)
                fs.unlinkSync(path.resolve(process.env.imgDir, `zip_${rand}.txt`))
            });    

            archive.on('error', function(err) {
                console.log('An error occurred: ' + err.message);
                if(save){
                    sendAlert(`Your zip (${rand}) could not be completed.`)
                }    
                fs.unlinkSync(path.resolve(process.env.imgDir, `zip_${rand}.txt`))
            });
            
            fs.writeFileSync(path.resolve(process.env.imgDir, `zip_${rand}.txt`), "progress")

            archive.pipe(output)

            req.app.locals[rand] = archive

            res.send(JSON.stringify({
                id: rand,
                url: `http://${process.env.host}:${process.env.PORT}/shared/captures/${fileName(camera, start, end, rand, 'zip')}`
            }))
        }
        else{
            res.attachment(fileName(camera, start, end, rand, 'zip'))
            archive.pipe(res, {end: true})
        }

        archive.finalize()
    }

}

module.exports = {
    createZip: (req, res) => {
        let { camera, start, end, save } = req.body;

        const {frames, archive} = createZipList(camera, start, end)

        if(save == undefined || save == true || frames > 250 || save == "true"){
            save = true
        }
        else{
            save = false
        }

        zip(archive, camera, frames, start, end, save, req, res)
    },

    statusZip: (req, res) => {
        const { id } = req.body

        console.log(id)
        res.send(JSON.stringify({
            running: fs.existsSync(path.resolve(process.env.imgDir, `zip_${id}.txt`)),
            id
        }))
    },

    cancelZip: (req, res) => {
        const { id } = req.body

        let cancelled = true

        if(req.app.locals[id] != undefined){
            req.app.locals[id].abort()
            delete req.app.locals[id]
            sendAlert(`Your zip (${id}) was cancelled.`)
        }
        else{
            cancelled = false;
        }
        
        //fs.unlinkSync(path.resolve(process.env.imgDir, `zip_${id}.txt`))

        res.send(JSON.stringify({
            cancelled,
            id
        }))
    },

    deleteZip: (req, res) => {
        const { id } = req.body

        console.log(id)
        let deletable = fs.existsSync(path.resolve(process.env.imgDir, fileName(camera, start, end, id, 'zip')))

        if(deletable){
            fs.unlinkSync(path.resolve(process.env.imgDir, fileName(camera, start, end, id, 'zip')))
        }
        
        res.send(JSON.stringify({
            deleted: deletable,
            id
        }))
    }
}
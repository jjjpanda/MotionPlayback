require('dotenv').config()
var archiver   = require('archiver');
var dateFormat = require('./dateFormat.js')
var fs         = require('fs')
var path       = require('path')
var moment     = require('moment')
const {
    sendAlert,
    filterType,
    parseFileName,
    findFile
}              = require('./converter.js');

module.exports = {
    statusProcess: (req, res) => {
        const { id } = req.body

        const { type } = parseFileName(findFile(id))

        console.log(id)
        res.send(JSON.stringify({
            running: fs.existsSync(path.resolve(process.env.imgDir, `${type}_${id}.txt`)),
            id
        }))
    },

    cancelProcess: (req, res) => {
        const { id } = req.body

        const { type } = parseFileName(findFile(id))

        let cancelled = true

        if(req.app.locals[id] != undefined){
            req.app.locals[id].abort()
            delete req.app.locals[id]
            sendAlert(`Your ${type} (${id}) was cancelled.`)
        }
        else{
            cancelled = false;
        }

        res.send(JSON.stringify({
            cancelled,
            id
        }))
    },
   
    listProcess: (req, res) => {
        let list = [...filterType('zip'), ...filterType('mp4')]

        list = list.map(file => {
            const { id, type } = parseFileName(file)

            return {
                ...parseFileName(file),
                running: fs.existsSync(path.resolve(process.env.imgDir, `${type}_${id}.txt`))
            }
        })

        res.send({
            list
        })
    },

    deleteProcess: (req, res) => {
        const { id } = req.body

        const file = findFile(id);

        console.log(id)
        let deletable = fs.existsSync(path.resolve(process.env.imgDir, file))

        if(deletable){
            fs.unlinkSync(path.resolve(process.env.imgDir, file))
        }
        
        res.send(JSON.stringify({
            deleted: deletable,
            id
        }))
    }
}
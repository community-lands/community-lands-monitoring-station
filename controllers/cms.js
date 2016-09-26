const settings = require('../helpers/settings')
const fs = require('fs')
const path = require('path')

function save (req, res) {
  try {
    var src = req.body.src
    var html = req.body.html
    var content_dir = path.join(path.dirname(settings.getSubmissionsDirectory()), 'content')
    var target = path.join(content_dir, src)
    fs.writeFile(target, html, function (err) {
      if (err) {
        return console.log(err)
      }
    })
    res.status(200).send()
  } catch (err) {
    console.log(err)
    res.status(500).send()
  }
}

module.exports = {
  save: save
}

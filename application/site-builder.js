const pug = require('pug')
const path = require('path')
const fs = require('fs-extra')

function fetch_template_pug (file) {
  return pug.compileFile(file, {
    pretty: true
  })
}

function fetch_template_json (file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function walk_source_tree (
  source,
  target,
  template_pug,
  template_json,
  callback) {
  var resolved_source = path.resolve(source)
  console.log('Compiling content in ' + resolved_source)
  fs.walk(source)
    .on('data', function (item) {
      var relative = item.path.slice(resolved_source.length + 1)
      if (typeof (relative) !== 'undefined' && relative.endsWith('.html')) {
        console.log('  + compiling: ' + relative)
        var target_file = path.join(target, relative)
        template_json['yield'] = fs.readFileSync(item.path)
        fs.writeFileSync(target_file, template_pug(template_json))
      }
    })
    .on('end', function () {
      callback()
    })
}

exports.build_website_with_template = (
  content,
  template,
  target,
  callback
  ) => {
  console.log('Fetching template')
  const template_pug = fetch_template_pug(
    path.join(template, 'template.pug')
  )

  console.log('Fetching parameters and properties')
  const template_json = fetch_template_json(
    path.join(template, 'template.json')
  )

  console.log('Cleaning target directory')
  fs.removeSync('target')

  console.log('Copying static resources')
  fs.copySync(
    path.join(template, 'resources'),
    target
  )

  walk_source_tree(
    path.join(template, 'sample-content'),
    target,
    template_pug,
    template_json,
    function () {
      walk_source_tree(
        'src/content',
        target,
        template_pug,
        template_json,
        callback
      )
    }
  )
}

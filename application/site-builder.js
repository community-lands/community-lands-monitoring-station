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

function walk_source_tree (options) {
  let resolved_source = path.resolve(options.source)
  console.log('Compiling content in ' + resolved_source)
  fs.walk(options.source)
    .on('data', function (item) {
      let relative = item.path.slice(resolved_source.length + 1)
      if (typeof (relative) !== 'undefined' && relative.endsWith('.html')) {
        console.log('  + compiling: ' + relative)
        let target_file = path.join(options.target, relative)
        options.template_json['yield'] = fs.readFileSync(item.path)
        fs.writeFileSync(target_file, options.template_pug(options.template_json))
      }
    })
    .on('end', function () {
      options.callback()
    })
}

exports.build_website = (options) => {
  console.log('Fetching template')
  const template_pug = fetch_template_pug(
    path.join(options.template, 'template.pug')
  )

  console.log('Fetching parameters and properties')
  const template_json = fetch_template_json(
    path.join(options.template, 'template.json')
  )
  Object.assign(template_json.parameters, options.parameters)
  template_json.context = options.context

  console.log('Cleaning target directory')
  fs.removeSync('target')

  console.log('Copying static resources')
  fs.copySync(
    path.join(options.template, 'resources'),
    options.target
  )

  walk_source_tree({
    source: path.join(options.template, 'sample-content'),
    target: options.target,
    template_pug: template_pug,
    template_json: template_json,
    callback: function () {
      walk_source_tree({
        source: options.content,
        target: options.target,
        template_pug: template_pug,
        template_json: template_json,
        callback: options.callback
      })
    }
  })
}

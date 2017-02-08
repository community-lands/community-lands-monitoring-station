(function(app) {

  const t = app.t

  function translatePage () {
    var tags = ['h4', 'h5', 'div', 'span', 'b', 'button', 'label']
    for (var i = 0; i < tags.length; i++) {
      var els = document.getElementsByTagName(tags[i])
      for (var k = 0; k < els.length; k++) {
        if (els[k].getAttribute('data-translate')) {
          els[k].innerHTML = t(els[k].getAttribute('data-translate'))
        }
      }
    }
  }

  $(document).ready(function() {
    translatePage()
  })

})(window.app)

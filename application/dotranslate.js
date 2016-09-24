document.onreadystatechange = function () {
  if (document.readyState === 'complete') {
    $('#software-version').text(window.appVersion.version)
    translatePage()
  }
}

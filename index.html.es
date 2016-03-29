<html>
  <head>
    <title>Community Lands Monitoring Station</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <script>
    var ipc = require('ipc');
    ipc.on('has_configuration', function(configuration) {
      document.getElementById('baseUrl').innerHTML = configuration.baseUrl
      document.getElementById('shared_secret').innerHTML = configuration.shared_secret
      document.getElementById('mapUrl').innerHTML = configuration.baseUrl + "/mapfilter"
      document.getElementById('form_folder').innerHTML = configuration.directory + "/Monitoring/" + configuration.station + "/Forms"
    });
    ipc.send('show_configuration');
    </script>
  </head>
  <body><div class="container-fluid"><div class="row"><div class="col-xs-12">
    <div class="alert alert-info" style='margin-top: 10px'><b>La estación de monitoreo funcionará siempre y cuando esta ventana está abierta.</b></div>
    <h4>Configuración del ODK Collect</h4>
    <div class="well">
      <div>
        URL:
      </div>
      <div><b id="baseUrl"></b></div>
      <div>
        Utilizar tu identificación personal para el nombre de usuario.
      </div>
      <div>
        Contraseña:
      </div>
      <div><b id="shared_secret"></b></div>
    </div>
    <h4>Configuración del navegador</h3>
    <div class="well">
      <div>
        URL para ver mapas en su navegador:
      </div>
      <div><b id="mapUrl"></b></div>
    </div>
    <h4>Avanzada</h4>
    <div class="well">
      <div>
        Carpeta para formularios de monitoreo:
      </div>
      <div><b id="form_folder"></b></div>
      <a href="/backup/latest" target="_blank">
        <div class="btn btn-small btn-primary" style="margin-top: 10px">Copia segura de sus datos</div>
      </a>
    </div>

  </div></div></div></body>
</html>

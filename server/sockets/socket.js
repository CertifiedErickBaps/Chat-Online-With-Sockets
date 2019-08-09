const { io } = require("../server");

const { Usuarios } = require("../clases/usuarios");

const { crearMensaje } = require("../utilidades/utilidades");

const usuarios = new Usuarios();

io.on("connection", client => {
  //Registro de un usuario
  client.on("entrarChat", function(usuario, regreso) {
    if (!usuario.nombre || !usuario.sala) {
      return regreso({
        error: true,
        mensaje: "El nombre es necesario"
      });
    }

    client.join(usuario.sala);

    usuarios.agregarPersona(
      client.id,
      usuario.nombre,
      usuario.sala
    );

    client.broadcast
      .to(usuario.sala)
      .emit("listaPersonas", usuarios.getPersonaPorSala(usuario.sala ));

    regreso(usuarios.getPersonaPorSala(usuario.sala));
  });

  //Mensaje grupal
  client.on("crearMensaje", data => {
    let persona = usuarios.getPersona(client.id);

    let mensaje = crearMensaje(persona.nombre, data.mensaje);

    client.broadcast.to(persona.sala).emit("crearMensaje", mensaje);
  });

  //Evento de desconexion
  client.on("disconnect", function() {
    let personaBorrada = usuarios.borrarPersona(client.id);

    client.broadcast
      .to(personaBorrada.sala)
      .emit(
        "crearMensaje",
        crearMensaje("Administrador", `${personaBorrada.nombre} salio`)
      );
    client.broadcast
      .to(personaBorrada.sala)
      .emit("listaPersonas", usuarios.getPersonaPorSala(personaBorrada.sala));
  });

  //Mensaje privado
  client.on("mensajePrivado", data => {
    let persona = usuarios.getPersona(client.id);

    client.broadcast
      .to(data.para)
      .emit("mensajePrivado", crearMensaje(persona.nombre, data.mensaje));
  });
});

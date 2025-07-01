const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./db');
const passport = require('passport');
const nodemailer = require('nodemailer'); // Importar Nodemailer
require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middlewares
app.use(express.urlencoded({ extended: true })); // Para datos de formularios
app.use(express.json()); // Para datos en formato JSON
app.use(session({
  secret: 'clave_secreta_segura',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.messages = req.session.messages || [];
  req.session.messages = []; // Limpia los mensajes después de usarlos
  next();
});

// Configurar motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// RUTA PRINCIPAL CON EJEMPLO DE PRODUCTOS
app.get('/', (req, res) => {
  const productos = [
    {
      id: 1,
      titulo: 'Camisa EcoFriendly',
      precio: 35000,
      descuento: 10,
      imagenPrincipal: '/img/camisa1.jpg',
      imagenes: [
        { url: '/img/camisa1.jpg' },
        { url: '/img/camisa2.jpg' }
      ]
    },
    {
      id: 2,
      titulo: 'Pantalón Reciclado',
      precio: 50000,
      descuento: 0,
      imagenPrincipal: '/img/pantalon1.jpg',
      imagenes: [
        { url: '/img/pantalon1.jpg' },
        { url: '/img/pantalon2.jpg' }
      ]
    }
  ];

  const usuario_actual = req.session.validar
    ? {
        full_name: req.session.full_name,
        tipoUsuario: req.session.tipoUsuario
      }
    : null;

  res.render('index', {
    productos,
    usuario_actual,
    session: req.session,
    messages: res.locals.messages || [] // Asegurarte de pasar messages
  });
});

// RUTA DE LOGIN (GET)
app.get('/login', (req, res) => {
  res.render('login');
});

// RUTA DE LOGIN (POST)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Datos recibidos:', { email, password });

  try {
    const query = `SELECT * FROM usuarios WHERE email = ?`;
    const user = db.prepare(query).get(email);
    console.log('Usuario encontrado:', user);

    if (!user || user.password !== password) {
      console.log('Error: Correo o contraseña incorrectos');
      req.session.messages = ['Correo o contraseña incorrectos'];
      return res.redirect('/login');
    }

    req.session.validar = true;
    req.session.tipoUsuario = user.tipoUsuario || 'usuario';
    req.session.full_name = user.full_name;
    res.redirect('/');
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    req.session.messages = ['Error al iniciar sesión'];
    res.redirect('/login');
  }
});

// RUTA DE REGISTRO
app.get('/registro', (req, res) => {
  res.render('register', {
    messages: res.locals.messages || []
  });
});

// RUTA DE REGISTRO (POST)
app.post('/registro', async (req, res) => {
  const { full_name, email, username, telefono, departamento, direccion, municipio, password } = req.body;

  try {
    // Insertar el usuario en la base de datos
    const query = `
      INSERT INTO usuarios (full_name, email, username, telefono, departamento, direccion, municipio, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.prepare(query).run(full_name, email, username, telefono, departamento, direccion, municipio, password);

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'Sgomezd28@gmail.com', // Reemplaza con tu correo
        pass: 'orxf ktpb uhhg tkiy', // Contraseña de aplicación generada
      },
    });

    // Configurar contenido del correo
    const mailOptions = {
      from: 'Sgomezd28@gmail.com',
      to: email,
      subject: 'Bienvenido a MerkaChecheres',
      text: `Hola ${full_name}, ¡Gracias por registrarte! Ahora formas parte de nuestra tienda. Estamos aquí para que tu experiencia de compra sea fácil, rápida y llena de buenos descubrimientos. ¡Explora y encuentra eso que tanto te gusta!`,
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);

    // Establecer sesión y redirigir al índice
    req.session.validar = true;
    req.session.tipoUsuario = 'usuario';
    req.session.full_name = full_name;
    res.redirect('/');
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    if (err.code === 'SQLITE_CONSTRAINT') {
      req.session.messages = ['El correo ya está registrado'];
    } else {
      req.session.messages = ['Error al registrar el usuario'];
    }
    res.redirect('/registro');
  }
});

// RUTA DE LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Rutas de autenticación con Facebook
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Ya está logueado y registrado
    req.session.validar = true;
    req.session.tipoUsuario = 'usuario';
    req.session.full_name = req.user.full_name;
    res.redirect('/');
  }
);

// RUTA PARA RESTABLECER CONTRASEÑA (GET)
app.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  res.render('reset-password', { token });
});

// RUTA PARA RESTABLECER CONTRASEÑA (POST)
app.post('/reset-password', async (req, res) => {
  const { password, token } = req.body;

  try {
    // Actualizar la contraseña en la base de datos
    db.prepare('UPDATE usuarios SET password = ?, reset_token = NULL WHERE reset_token = ?').run(password, token);

    req.session.messages = ['Contraseña restablecida con éxito'];
    res.redirect('/login');
  } catch (err) {
    console.error('Error al restablecer la contraseña:', err);
    req.session.messages = ['Error al restablecer la contraseña'];
    res.redirect('/login');
  }
});

// RUTA PARA OLVIDÉ MI CONTRASEÑA (GET)
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

// RUTA PARA OLVIDÉ MI CONTRASEÑA (POST)
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el correo existe en la base de datos
    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

    if (!user) {
      req.session.messages = ['El correo no está registrado'];
      return res.redirect('/login');
    }

    // Generar un token único para el restablecimiento de contraseña
    const resetToken = Math.random().toString(36).substring(2, 15);

    // Guardar el token en la base de datos (puedes usar una tabla o campo adicional)
    db.prepare('UPDATE usuarios SET reset_token = ? WHERE email = ?').run(resetToken, email);

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tu_correo@gmail.com', // Reemplaza con tu correo
        pass: 'contraseña_de_aplicación', // Contraseña de aplicación generada
      },
    });

    // Configurar contenido del correo
    const mailOptions = {
      from: 'tu_correo@gmail.com',
      to: email,
      subject: 'Restablecimiento de contraseña',
      text: `Hola ${user.full_name},\n\nHemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para restablecerla:\n\nhttp://localhost:3000/reset-password/${resetToken}\n\nSi no solicitaste este cambio, ignora este correo.\n\nGracias,\nEl equipo de MerkaChecheres`,
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);

    req.session.messages = ['Se ha enviado un correo para restablecer tu contraseña'];
    res.redirect('/login');
  } catch (err) {
    console.error('Error al enviar correo de restablecimiento:', err);
    req.session.messages = ['Error al enviar el correo'];
    res.redirect('/login');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

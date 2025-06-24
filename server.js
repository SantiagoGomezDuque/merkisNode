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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

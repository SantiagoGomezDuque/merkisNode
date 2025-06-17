const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar sesiones
app.use(session({
  secret: 'clave_secreta_segura',
  resave: false,
  saveUninitialized: false
}));

// Middleware para parsear datos del formulario
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware para mensajes flash simples
app.use((req, res, next) => {
  res.locals.messages = req.session.messages || [];
  res.locals.form = req.session.form || {};
  res.locals.session = req.session;
  req.session.messages = [];
  req.session.form = {};
  next();
});

// Motor de plantillas EJS
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

  // Simular un usuario logueado (puedes ajustar según sesión real)
  const usuario_actual = req.session.validar
    ? {
        full_name: 'Santiago Gómez',
        foto_perfil: null,
        tipoUsuario: req.session.tipoUsuario
      }
    : null;

  res.render('index', {
    productos,
    usuario_actual,
    session: req.session
  });
});

// RUTA DE LOGIN (GET)
app.get('/login', (req, res) => {
  res.render('login');
});

// RUTA DE LOGIN (POST)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validación simple de ejemplo
  if (email === 'admin@correo.com' && password === '1234') {
    req.session.validar = true;
    req.session.tipoUsuario = 'admin';
    return res.redirect('/');
  }

  req.session.messages = ['Correo o contraseña incorrectos'];
  req.session.form = { email };
  res.redirect('/login');
});

// RUTA DE REGISTRO
app.get('/registro', (req, res) => {
  res.render('register', {
    messages: res.locals.messages || []
  });
});

// RUTA DE REGISTRO (POST)
app.post('/registro', (req, res) => {
  // Aquí va la lógica para registrar el usuario
  // Por ejemplo, puedes guardar los datos en la base de datos

  // Ejemplo simple: redirigir al login después de registrar
  // Puedes agregar validaciones y mensajes según tu necesidad
  res.redirect('/login');
});

// RUTA DE LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
